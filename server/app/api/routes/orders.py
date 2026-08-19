from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.order import OrderCreate, OrderCreateResponse
from app.services import order_service

router = APIRouter()


@router.post("/", response_model=OrderCreateResponse, status_code=201)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    """Create a pending order (Phase 2 — no Stripe payment required)."""
    return order_service.create_order_phase2(db=db, order_in=order_in)
