from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_payment_gateway
from app.schemas.order import OrderCreate, OrderCheckoutResponse
from app.services import order_service
from app.services.payment_gateway import PaymentGateway

router = APIRouter()


@router.post("/", response_model=OrderCheckoutResponse, status_code=201)
def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    payment_gateway: PaymentGateway = Depends(get_payment_gateway),
):
    """
    Create a pending order and open a Stripe Checkout Session.
    Returns the checkout_url — redirect the customer there to pay.
    WhatsApp new_order alert fires after payment is confirmed via webhook.
    """
    db_order, checkout_url = order_service.create_order_checkout(
        db=db,
        order_in=order_in,
        payment_gateway=payment_gateway,
    )
    return OrderCheckoutResponse(
        order_id=db_order.id,
        checkout_url=checkout_url,
        total_cents=db_order.total_cents,
        status=db_order.status,
    )
