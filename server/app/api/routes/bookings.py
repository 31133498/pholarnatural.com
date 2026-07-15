from datetime import date
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session


from app.api.dependencies import get_db, get_payment_gateway
from app.services.payment_gateway import PaymentGateway
from app.schemas.booking import BlockedDateResponse, BookingCreate, CheckoutResponse
from app.services import booking_service

router = APIRouter()

@router.post("/", response_model=CheckoutResponse)
def create_booking(booking_in: BookingCreate, db: Session = Depends(get_db), payment_gateway: PaymentGateway = Depends(get_payment_gateway)):
    """Create a new booking and get the Stripe checkout URL."""
    checkout_url, booking_id = booking_service.create_booking_and_checkout(db=db, booking_in=booking_in, payment_gateway=payment_gateway)
    return CheckoutResponse(checkout_url=checkout_url, booking_id=booking_id)

@router.get("/blocked-dates", response_model=List[BlockedDateResponse])
def list_blocked_dates(db: Session = Depends(get_db)):
    """Get a list of dates that are blocked from booking."""
    return booking_service.get_blocked_dates(db)

@router.get("/slots")
def get_slots(
    date: date = Query(..., description="The date to check availability for (YYYY-MM-DD)"),
    service_id: int = Query(None, description="Optional service ID to calculate duration"),
    db: Session = Depends(get_db)
):
    """Get available time slots for a specific date."""
    slots = booking_service.get_available_slots(db, target_date=date, service_id=service_id)
    return {"date": date, "available_slots": slots}