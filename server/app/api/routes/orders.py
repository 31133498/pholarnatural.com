from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.order import OrderCreate, OrderCreateResponse
from app.services import order_service
from app.services.whatsapp import notify, NotificationEvent

router = APIRouter()


@router.post("/", response_model=OrderCreateResponse, status_code=201)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    """Create a pending order (Phase 2 — no Stripe payment required)."""
    order = order_service.create_order_phase2(db=db, order_in=order_in)

    order_number = f"PN-{str(order.id)[:8].upper()}"
    item_count = sum(ci.quantity for ci in order_in.items)
    notify(
        NotificationEvent.NEW_ORDER,
        f"🛍️ New Order — {order_number}\n"
        f"Customer: {order.customer_name} · {item_count} item{'s' if item_count != 1 else ''}\n"
        f"Total: CAD ${order.total_cents / 100:.2f}\n"
        f"pholarnatural.com/admin/orders",
        db,
    )

    return order
