from typing import Optional

from app.services.payment_gateway import PaymentGateway
from sqlalchemy.orm import Session
from datetime import datetime, date, time, timedelta, timezone
from fastapi import HTTPException, status

from app.models.booking import Booking, BlockedDate
from app.models.service import Service
from app.schemas.booking import BookingCreate
from app.core.config import settings
from app.schemas.booking import BlockedDateCreate

def get_bookings(db: Session, filter_date: Optional[date] = None, status: Optional[str] = None):
    """Fetch bookings with optional filtering."""
    query = db.query(Booking)
    if filter_date:
        query = query.filter(Booking.booking_date == filter_date)
    if status:
        query = query.filter(Booking.status == status)
    # Order by most recent bookings first
    return query.order_by(Booking.booking_date.desc(), Booking.start_time.asc()).all()

def update_booking_status(db: Session, booking_id: int, new_status: str):
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

def get_available_slots(db: Session, target_date: date, service_id: int = None):
    """
    Calculate available time slots for a given date.
    Assumes operating hours are 9:00 AM to 5:00 PM.
    """
    # 1. Check if the entire date is blocked
    is_blocked = db.query(BlockedDate).filter(BlockedDate.date == target_date).first()
    if is_blocked:
        return []

    # 2. Get existing bookings for this date (that aren't cancelled)
    existing_bookings = db.query(Booking).filter(
        Booking.booking_date == target_date,
        Booking.status.in_(["pending", "confirmed"])
    ).all()

    # 3. Define Salon Operating Hours
    open_time = time(9, 0)
    close_time = time(17, 0) # 5:00 PM

    # 4. Determine required duration
    duration_minutes = 120 # Default duration
    if service_id:
        service = db.query(Service).filter(Service.id == service_id).first()
        if service:
            duration_minutes = service.duration_minutes

    available_slots = []
    
    # We use datetime combination to easily add timedelta minutes
    current_dt = datetime.combine(target_date, open_time)
    end_dt = datetime.combine(target_date, close_time)

    # 5. Generate slots in 30-minute intervals
    while current_dt + timedelta(minutes=duration_minutes) <= end_dt:
        slot_start = current_dt.time()
        slot_end = (current_dt + timedelta(minutes=duration_minutes)).time()

        # Check for overlaps with existing bookings
        overlap = False
        for b in existing_bookings:
            # Overlap formula: Max(start1, start2) < Min(end1, end2)
            if max(slot_start, b.start_time) < min(slot_end, b.end_time):
                overlap = True
                break

        # Also, check if the slot is in the past (if the target_date is today)
        if target_date == datetime.now().date() and slot_start < datetime.now().time():
            overlap = True

        if not overlap:
            # Format time nicely, e.g., "09:00", "13:30"
            available_slots.append(slot_start.strftime("%H:%M"))

        # Move forward by 30 minutes to check the next possible start time
        current_dt += timedelta(minutes=30) 

    return available_slots

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

def unblock_date(db: Session, blocked_id: int):
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