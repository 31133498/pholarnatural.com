from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.service import Service as ServiceModel
from app.schemas.booking import (
    BlockedDateResponse,
    BookingCreate,
    BookingCancelRequest,
    BookingCancelResponse,
    BookingCreateResponse,
    SlotsResponse,
    SlotInfo,
)
from app.services import booking_service
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


@router.post("/", response_model=BookingCreateResponse, status_code=201)
def create_booking(booking_in: BookingCreate, db: Session = Depends(get_db)):
    """Create a pending booking (Phase 2 — no Stripe payment required)."""
    booking = booking_service.create_booking_phase2(db=db, booking_in=booking_in)

    service = db.query(ServiceModel).filter(ServiceModel.id == booking.service_id).first()
    service_name = service.name if service else "Service"
    booking_date = booking.booking_date.strftime("%a %d %b %Y")
    start_time = booking.start_time.strftime("%I:%M %p").lstrip("0")
    notify(
        NotificationEvent.NEW_BOOKING,
        f"📅 New Booking\n"
        f"{booking.customer_name} — {service_name}\n"
        f"{booking_date} at {start_time}\n"
        f"pholarnatural.com/admin/bookings",
        db,
    )

    return booking


@router.post("/{booking_id}/cancel", response_model=BookingCancelResponse)
def cancel_booking(
    booking_id: UUID,
    cancel_in: BookingCancelRequest,
    db: Session = Depends(get_db),
):
    """Cancel a booking and store an optional cancellation reason."""
    booking = booking_service.cancel_booking(
        db=db,
        booking_id=booking_id,
        cancellation_reason=cancel_in.cancellation_reason,
    )

    service = db.query(ServiceModel).filter(ServiceModel.id == booking.service_id).first()
    service_name = service.name if service else "Service"
    reference = f"PN-{str(booking.id)[:8].upper()}"
    booking_date = booking.booking_date.strftime("%d %b %Y")
    reason = cancel_in.cancellation_reason or "No reason given"
    notify(
        NotificationEvent.BOOKING_CANCELLED,
        f"❌ Booking Cancelled — {reference}\n"
        f"{booking.customer_name} · {service_name} · {booking_date}\n"
        f"Reason: {reason}\n"
        f"pholarnatural.com/admin/bookings",
        db,
    )

    return booking
