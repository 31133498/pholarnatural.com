from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date


from app.api.dependencies import get_db, get_current_admin
from app.schemas.booking import BookingResponse, BlockedDateCreate, BlockedDateResponse
from app.services import booking_service
from app.models.admin import AdminUser

router = APIRouter()

# ---- BOOKINGS ----
@router.get("/", response_model=List[BookingResponse])
def list_bookings(
    filter_date: Optional[date] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """List all bookings (Admin only)."""
    return booking_service.get_bookings(db, filter_date, status)

@router.put("/{booking_id}/confirm", response_model=BookingResponse)
def confirm_booking(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Manually confirm a booking."""
    return booking_service.update_booking_status(db, booking_id, "confirmed")

@router.put("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Cancel a booking."""
    return booking_service.update_booking_status(db, booking_id, "cancelled")

# ---- BLOCKED DATES ----
@router.post("/blocked-dates", response_model=BlockedDateResponse, status_code=status.HTTP_201_CREATED)
def block_a_date(
    block_in: BlockedDateCreate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Block a date from being booked."""
    return booking_service.block_date(db, block_in)

@router.delete("/blocked-dates/{blocked_id}", status_code=status.HTTP_204_NO_CONTENT)
def unblock_a_date(
    blocked_id: UUID,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Unblock a date."""
    booking_service.unblock_date(db, blocked_id)
    return None