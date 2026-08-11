from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_admin
from app.schemas.order import OrderResponse, OrderStatusUpdate
from app.services import order_service
from app.models.admin import AdminUser
from typing import List, Optional

router = APIRouter()

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
    order_id: UUID,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Get full details of a specific order."""
    return order_service.get_order_detail(db, order_id)

@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: UUID,
    status_in: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Update the status of an order (e.g., mark as 'shipped')."""
    return order_service.update_order_status(db, order_id, status_in)