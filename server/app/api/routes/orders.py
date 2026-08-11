from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
import stripe

from app.api.dependencies import get_db
from app.schemas.order import OrderCreate, CheckoutResponse
from app.services import order_service
from app.core.config import settings

router = APIRouter()

@router.post("/", response_model=CheckoutResponse)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    """Creates a new order and returns a Stripe checkout URL."""
    checkout_url, order_id = order_service.calculate_cart_and_checkout(db=db, order_in=order_in)
    return CheckoutResponse(checkout_url=checkout_url, order_id=order_id)