from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from uuid import UUID

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
    return booking_service.create_booking_phase2(db=db, booking_in=booking_in)


@router.post("/{booking_id}/cancel", response_model=BookingCancelResponse)
def cancel_booking(
    booking_id: UUID,
    cancel_in: BookingCancelRequest,
    db: Session = Depends(get_db),
):
    """Cancel a booking and store an optional cancellation reason."""
    return booking_service.cancel_booking(
        db=db,
        booking_id=booking_id,
        cancellation_reason=cancel_in.cancellation_reason,
    )
