from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
import stripe

from app.api.dependencies import get_db, get_payment_gateway, get_current_admin
from app.services.payment_gateway import PaymentGateway
from app.schemas.order import OrderCreate, CheckoutResponse, OrderResponse, OrderStatusUpdate
from app.services import order_service
from app.core.config import settings
from app.models.admin import AdminUser
from typing import List, Optional

router = APIRouter()

@router.post("/", response_model=CheckoutResponse)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    """Creates a new order and returns a Stripe checkout URL."""
    checkout_url, order_id = order_service.calculate_cart_and_checkout(db=db, order_in=order_in)
    return CheckoutResponse(checkout_url=checkout_url, order_id=order_id)

@router.post("/webhook", include_in_schema=False)
async def stripe_order_webhook(request: Request, db: Session = Depends(get_db)):
    """Listens for Stripe payment success on product orders."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Verify this is a product order (not a booking) using the metadata we passed earlier
        if session.get('metadata', {}).get('type') == 'product_order':
            order_service.confirm_order_payment(db=db, session_id=session.get("id"))

    return {"status": "success"}


@router.get("/", response_model=List[OrderResponse])
def list_orders(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """List all orders (Admin only)."""
    return order_service.get_orders(db, status)

@router.get("/{order_id}", response_model=OrderResponse)
def get_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Get full details of a specific order."""
    return order_service.get_order_detail(db, order_id)

@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_in: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Update the status of an order (e.g., mark as 'shipped')."""
    return order_service.update_order_status(db, order_id, status_in)