from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date


from app.api.dependencies import get_db, get_payment_gateway, get_current_admin
from app.services.payment_gateway import PaymentGateway
from app.schemas.booking import BookingCreate, CheckoutResponse, BookingResponse, BlockedDateCreate, BlockedDateResponse
from app.services import booking_service
from app.core.config import settings
from app.models.admin import AdminUser

router = APIRouter()

@router.post("/", response_model=CheckoutResponse)
def create_booking(booking_in: BookingCreate, db: Session = Depends(get_db), payment_gateway: PaymentGateway = Depends(get_payment_gateway)):
    """Create a new booking and get the Stripe checkout URL."""
    checkout_url, booking_id = booking_service.create_booking_and_checkout(db=db, booking_in=booking_in, payment_gateway=payment_gateway)
    return CheckoutResponse(checkout_url=checkout_url, booking_id=booking_id)

@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(request: Request, db: Session = Depends(get_db), payment_gateway: PaymentGateway = Depends(get_payment_gateway)):
    """Listen for Stripe events (like successful payments)."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        # Verify the webhook signature to ensure it actually came from Stripe
        event = payment_gateway.verify_webhook_signature(payload, sig_header)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid signature or payload")

    # Handle successful payment
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Fulfill the purchase...
        booking_service.confirm_booking_payment(db=db, session_id=session.get("id"))

    return {"status": "success"}

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
    booking_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Manually confirm a booking."""
    return booking_service.update_booking_status(db, booking_id, "confirmed")

@router.put("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
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
    blocked_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Unblock a date."""
    booking_service.unblock_date(db, blocked_id)
    return None