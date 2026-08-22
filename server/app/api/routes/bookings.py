from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_payment_gateway
from app.core.config import settings
from app.schemas.booking import (
    BlockedDateResponse,
    BookingCreate,
    BookingCancelRequest,
    BookingCancelResponse,
    BookingDepositResponse,
    SlotsResponse,
    SlotInfo,
)
from app.services import booking_service
from app.services.payment_gateway import PaymentGateway
from app.services.whatsapp import notify, NotificationEvent

router = APIRouter()


@router.get("/blocked-dates", response_model=List[BlockedDateResponse])
def list_blocked_dates(db: Session = Depends(get_db)):
    """Get all dates that are blocked from booking."""
    return booking_service.get_blocked_dates(db)


@router.get("/slots", response_model=SlotsResponse)
def get_slots(
    date: date = Query(..., description="Date to check (YYYY-MM-DD)"),
    service_id: Optional[UUID] = Query(None, description="Service UUID — used to compute duration"),
    db: Session = Depends(get_db),
):
    """Return all 7 fixed slots (10:00–16:00) with availability for the given date."""
    raw = booking_service.get_available_slots(db, target_date=date, service_id=service_id)
    return SlotsResponse(
        date=date,
        slots=[SlotInfo(time=s["time"], available=s["available"]) for s in raw],
    )


@router.post("/", response_model=BookingDepositResponse, status_code=201)
def create_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    payment_gateway: PaymentGateway = Depends(get_payment_gateway),
):
    """
    Validate availability, create a pending booking, and open a Stripe Payment Intent
    for the 10% deposit. Mount the Payment Element on the client using client_secret.
    WhatsApp new_booking alert fires after the payment_intent.succeeded webhook arrives.
    """
    db_booking, client_secret = booking_service.create_booking_with_payment_intent(
        db=db,
        booking_in=booking_in,
        payment_gateway=payment_gateway,
    )
    return BookingDepositResponse(
        booking_id=db_booking.id,
        client_secret=client_secret,
        publishable_key=settings.STRIPE_PUBLISHABLE_KEY,
        amount_cents=db_booking.deposit_cents,
        booking_date=db_booking.booking_date,
        start_time=db_booking.start_time,
        end_time=db_booking.end_time,
        status=db_booking.status,
    )


@router.post("/{booking_id}/cancel", response_model=BookingCancelResponse)
def cancel_booking(
    booking_id: UUID,
    cancel_in: BookingCancelRequest,
    db: Session = Depends(get_db),
    payment_gateway: PaymentGateway = Depends(get_payment_gateway),
):
    """
    Cancel a booking.
    - Within 30 minutes of creation: full Stripe refund of the deposit.
    - Outside 30 minutes: cancelled without refund.
    Response includes refunded (bool) and a plain-English refund_policy_message.
    """
    booking, refunded, refund_message = booking_service.cancel_booking(
        db=db,
        booking_id=booking_id,
        cancellation_reason=cancel_in.cancellation_reason,
        payment_gateway=payment_gateway,
    )

    service_name = booking.service.name if booking.service else "Service"
    reference = f"PN-{str(booking.id)[:8].upper()}"
    booking_date = booking.booking_date.strftime("%d %b %Y")
    reason = cancel_in.cancellation_reason or "No reason given"
    notify(
        NotificationEvent.BOOKING_CANCELLED,
        f"❌ Booking Cancelled — {reference}\n"
        f"{booking.customer_name} · {service_name} · {booking_date}\n"
        f"Reason: {reason}\n"
        f"Refund: {'yes' if refunded else 'no (outside 30-min window)'}\n"
        f"pholarnatural.com/admin/bookings",
        db,
    )

    return BookingCancelResponse(
        id=booking.id,
        status=booking.status,
        cancellation_reason=booking.cancellation_reason,
        refunded=refunded,
        refund_policy_message=refund_message,
    )
