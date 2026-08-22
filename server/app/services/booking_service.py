from typing import List, Optional
from uuid import UUID

from app.services.payment_gateway import PaymentGateway
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, date, time, timedelta, timezone
from fastapi import HTTPException, status

from app.models.booking import Booking, BlockedDate
from app.models.service import Service
from app.schemas.booking import BookingCreate
from app.core.config import settings
from app.schemas.booking import BlockedDateCreate

# Fixed 60-min slots: Mon–Sat 10:00–17:00 (last start 16:00 → ends 17:00)
SLOT_TIMES: List[str] = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']
CLOSE_TIME = time(17, 0)
DEPOSIT_RATE = 0.1

def get_bookings(db: Session, filter_date: Optional[date] = None, status: Optional[str] = None):
    """Fetch bookings with optional filtering, eagerly loading service for admin response."""
    query = db.query(Booking).options(joinedload(Booking.service))
    if filter_date:
        query = query.filter(Booking.booking_date == filter_date)
    if status:
        query = query.filter(Booking.status == status)
    return query.order_by(Booking.booking_date.desc(), Booking.start_time.asc()).all()

def update_booking_status(db: Session, booking_id: UUID, new_status: str):
    """Confirm or Cancel a booking."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.status = new_status
    db.commit()
    db.refresh(booking)
    return booking


def get_blocked_dates(db: Session):
    """Fetch all blocked dates from the database."""
    # Only return future blocked dates
    today = datetime.now(timezone.utc).date()
    return db.query(BlockedDate).filter(BlockedDate.date >= today).all()

def get_available_slots(db: Session, target_date: date, service_id: Optional[UUID] = None):
    """
    Return all 7 fixed slots (10:00–16:00) with availability for the given date.
    A slot is unavailable if: date is blocked, date is Sunday, the service would
    run past 17:00, or an existing booking overlaps.
    """
    # 1. Blocked date → all unavailable
    if db.query(BlockedDate).filter(BlockedDate.date == target_date).first():
        return [{"time": t, "available": False} for t in SLOT_TIMES]

    # 2. Sunday (weekday 6) → all unavailable
    if target_date.weekday() == 6:
        return [{"time": t, "available": False} for t in SLOT_TIMES]

    # 3. Determine service duration (default 60 min if no service given)
    duration_minutes = 60
    if service_id:
        svc = db.query(Service).filter(Service.id == service_id).first()
        if svc:
            duration_minutes = svc.duration_minutes

    # 4. Existing bookings for this date
    existing = db.query(Booking).filter(
        Booking.booking_date == target_date,
        Booking.status.in_(["pending", "confirmed"])
    ).all()

    dummy = date(2000, 1, 1)  # arbitrary date for timedelta math
    close_dt = datetime.combine(dummy, CLOSE_TIME)

    result = []
    for slot_str in SLOT_TIMES:
        h, m = map(int, slot_str.split(':'))
        slot_start = time(h, m)
        slot_end_dt = datetime.combine(dummy, slot_start) + timedelta(minutes=duration_minutes)
        slot_end = slot_end_dt.time()

        # Service doesn't fit before close
        if slot_end_dt > close_dt:
            result.append({"time": slot_str, "available": False})
            continue

        # Check overlap with any existing booking
        conflict = any(
            max(slot_start, b.start_time) < min(slot_end, b.end_time)
            for b in existing
        )
        result.append({"time": slot_str, "available": not conflict})

    return result

def create_booking_phase2(db: Session, booking_in: BookingCreate):
    """Phase 2: create a pending booking without Stripe. Returns the new Booking row."""
    service = db.query(Service).filter(
        Service.id == booking_in.service_id,
        Service.is_active == True
    ).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found.")

    today = datetime.now(timezone.utc).date()
    if booking_in.booking_date < today:
        raise HTTPException(status_code=400, detail="Cannot book a date in the past.")
    if booking_in.booking_date.weekday() == 6:
        raise HTTPException(status_code=400, detail="We are closed on Sundays.")

    slot_str = booking_in.start_time.strftime("%H:%M")
    if slot_str not in SLOT_TIMES:
        raise HTTPException(status_code=400, detail=f"Invalid time slot: {slot_str}.")

    end_time = check_availability(
        db=db,
        booking_date=booking_in.booking_date,
        start_time=booking_in.start_time,
        duration_minutes=service.duration_minutes,
    )

    deposit_cents = int(service.price_cents * DEPOSIT_RATE)
    db_booking = Booking(
        service_id=service.id,
        customer_name=booking_in.customer_name,
        customer_email=booking_in.customer_email,
        customer_phone=booking_in.customer_phone,
        booking_date=booking_in.booking_date,
        start_time=booking_in.start_time,
        end_time=end_time,
        status="pending",
        deposit_cents=deposit_cents,
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking


def create_booking_with_payment_intent(
    db: Session,
    booking_in: BookingCreate,
    payment_gateway: PaymentGateway,
):
    """
    Phase 9: validate availability, create a pending Booking row, then open a
    Stripe Payment Intent for the 10% deposit (inline Payment Element flow).
    Returns (db_booking, client_secret).
    """
    service = db.query(Service).filter(
        Service.id == booking_in.service_id,
        Service.is_active == True,
    ).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found.")

    today = datetime.now(timezone.utc).date()
    if booking_in.booking_date < today:
        raise HTTPException(status_code=400, detail="Cannot book a date in the past.")
    if booking_in.booking_date.weekday() == 6:
        raise HTTPException(status_code=400, detail="We are closed on Sundays.")

    slot_str = booking_in.start_time.strftime("%H:%M")
    if slot_str not in SLOT_TIMES:
        raise HTTPException(status_code=400, detail=f"Invalid time slot: {slot_str}.")

    end_time = check_availability(
        db=db,
        booking_date=booking_in.booking_date,
        start_time=booking_in.start_time,
        duration_minutes=service.duration_minutes,
    )

    deposit_cents = int(service.price_cents * DEPOSIT_RATE)
    db_booking = Booking(
        service_id=service.id,
        customer_name=booking_in.customer_name,
        customer_email=booking_in.customer_email,
        customer_phone=booking_in.customer_phone,
        booking_date=booking_in.booking_date,
        start_time=booking_in.start_time,
        end_time=end_time,
        status="pending",
        deposit_cents=deposit_cents,
    )
    db.add(db_booking)
    db.flush()  # get ID before calling Stripe

    try:
        pi_data = payment_gateway.create_payment_intent(
            amount_cents=deposit_cents,
            currency="cad",
            metadata={
                "booking_id": str(db_booking.id),
                "type": "booking_deposit",
            },
            customer_email=booking_in.customer_email,
        )
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=502, detail=f"Payment setup failed: {exc}")

    db_booking.stripe_payment_intent_id = pi_data["payment_intent_id"]
    db.commit()
    db.refresh(db_booking)
    return db_booking, pi_data["client_secret"]


def confirm_booking_payment_intent(db: Session, payment_intent_id: str):
    """
    Called by webhook when payment_intent.succeeded — marks booking confirmed.
    Eagerly loads the service so the caller can compose a WhatsApp message.
    Returns the booking or None if not found / already confirmed.
    """
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.service))
        .filter(Booking.stripe_payment_intent_id == payment_intent_id)
        .first()
    )
    if booking and booking.status == "pending":
        booking.status = "confirmed"
        db.commit()
        db.refresh(booking)
        return booking
    return None


def fail_booking_payment(db: Session, payment_intent_id: str):
    """
    Called by webhook when payment_intent.payment_failed — marks the booking
    payment_failed so the slot is freed and the admin is notified.
    Returns the booking or None if not found.
    """
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.service))
        .filter(Booking.stripe_payment_intent_id == payment_intent_id)
        .first()
    )
    if booking and booking.status == "pending":
        booking.status = "payment_failed"
        db.commit()
        db.refresh(booking)
        return booking
    return None


def cancel_booking(
    db: Session,
    booking_id: UUID,
    cancellation_reason: Optional[str] = None,
    payment_gateway: Optional[PaymentGateway] = None,
):
    """
    Cancel a booking by ID, storing an optional reason.
    When payment_gateway is provided and the booking has a Payment Intent:
      - Within 30 minutes of creation → full refund via Stripe.
      - Outside that window → cancel without refund.
    Returns (booking, refunded: bool, refund_policy_message: str).
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="This booking is already cancelled.")
    if booking.status == "completed":
        raise HTTPException(status_code=400, detail="Completed bookings cannot be cancelled.")

    refunded = False
    refund_message = ""

    if payment_gateway and booking.stripe_payment_intent_id:
        created = booking.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        age = datetime.now(timezone.utc) - created

        if age <= timedelta(minutes=30):
            try:
                payment_gateway.create_refund(booking.stripe_payment_intent_id)
                refunded = True
                refund_message = (
                    "Your deposit has been fully refunded and will appear in 5–10 business days."
                )
            except Exception as exc:
                raise HTTPException(status_code=502, detail=f"Refund failed: {exc}")
        else:
            refund_message = (
                "The 30-minute free cancellation window has passed. "
                "Your deposit is non-refundable."
            )

    booking.status = "cancelled"
    booking.cancellation_reason = cancellation_reason
    db.commit()
    db.refresh(booking)
    return booking, refunded, refund_message


def block_date(db: Session, block_in: BlockedDateCreate):
    """Block a specific date so customers cannot book it."""
    # Check if already blocked
    existing = db.query(BlockedDate).filter(BlockedDate.date == block_in.date).first()
    if existing:
        raise HTTPException(status_code=400, detail="This date is already blocked.")
        
    db_block = BlockedDate(date=block_in.date, reason=block_in.reason)
    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    return db_block

def unblock_date(db: Session, blocked_id: UUID):
    """Remove a block from a date."""
    db_block = db.query(BlockedDate).filter(BlockedDate.id == blocked_id).first()
    if not db_block:
        raise HTTPException(status_code=404, detail="Blocked date not found")
        
    db.delete(db_block)
    db.commit()
    return {"message": "Date successfully unblocked"}

def check_availability(db: Session, booking_date: date, start_time: datetime.time, duration_minutes: int):
    """Check if a time slot is available."""
    
    # 1. Check if the entire date is blocked
    is_blocked = db.query(BlockedDate).filter(BlockedDate.date == booking_date).first()
    if is_blocked:
        raise HTTPException(status_code=400, detail="This date is not available for booking.")

    # 2. Calculate end time
    # Combine with a dummy date to do the timedelta math
    dummy_dt = datetime.combine(date.today(), start_time)
    end_dt = dummy_dt + timedelta(minutes=duration_minutes)
    end_time = end_dt.time()

    # 3. Check for overlapping bookings (pending or confirmed)
    # An overlap occurs if: ExistingStart < NewEnd AND ExistingEnd > NewStart
    overlapping_booking = db.query(Booking).filter(
        Booking.booking_date == booking_date,
        Booking.status.in_(["pending", "confirmed"]),
        Booking.start_time < end_time,
        Booking.end_time > start_time
    ).first()

    if overlapping_booking:
        raise HTTPException(status_code=400, detail="This time slot is already booked.")
        
    return end_time

def create_booking_and_checkout(db: Session, booking_in: BookingCreate, payment_gateway: PaymentGateway):
    """Creates a pending booking and returns a Stripe Checkout URL."""
    
    # 1. Get the service to find its duration and price
    service = db.query(Service).filter(Service.id == booking_in.service_id, Service.is_active == True).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found.")

    # 2. Verify Availability
    end_time = check_availability(
        db=db, 
        booking_date=booking_in.booking_date, 
        start_time=booking_in.start_time, 
        duration_minutes=service.duration_minutes
    )

    # 3. Calculate deposit (Let's assume a fixed 50% deposit for now, or you can adjust this logic)
    deposit_cents = int(service.price_cents * 0.5)

    # 4. Create the Pending Booking in the DB
    db_booking = Booking(
        service_id=service.id,
        customer_name=booking_in.customer_name,
        customer_email=booking_in.customer_email,
        customer_phone=booking_in.customer_phone,
        booking_date=booking_in.booking_date,
        start_time=booking_in.start_time,
        end_time=end_time,
        status="pending",
        deposit_cents=deposit_cents
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)

    strip_line_items = [{
                'price_data': {
                    'currency': 'usd',
                    'unit_amount': deposit_cents,
                    'product_data': {
                        'name': f"Deposit for {service.name}",
                        'description': f"Booking on {booking_in.booking_date} at {booking_in.start_time}"
                    },
                },
                'quantity': 1,
            }]

    # 5. Create Stripe Checkout Session
    try:
        session_data = payment_gateway.create_checkout_session(
            line_items=strip_line_items,
            success_url=f"{settings.DOMAIN}/booking/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.DOMAIN}/booking/cancel",
            metadata={"booking_id": str(db_booking.id)},
            customer_email=booking_in.customer_email
        )
        
        # 6. Save the Stripe session ID to the booking
        db_booking.stripe_session_id = session_data["session.id"]
        db.commit()
        
        return session_data["url"], db_booking.id

    except Exception as e:
        # If Stripe fails, delete the pending booking to keep the DB clean
        db.delete(db_booking)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

def confirm_booking_payment(db: Session, session_id: str):
    """Called by the Stripe webhook when payment succeeds."""
    booking = db.query(Booking).filter(Booking.stripe_session_id == session_id).first()
    if booking:
        booking.status = "confirmed"
        db.commit()
        return booking
    return None