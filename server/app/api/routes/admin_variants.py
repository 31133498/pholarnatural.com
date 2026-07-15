from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_admin
from app.models.admin import AdminUser
from app.schemas.product import VariantUpdate
from app.services import product_service

router = APIRouter()

@router.put("/{variant_id}")
def update_variant(
    variant_id: UUID,
    variant_in: VariantUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Update a product variant."""
    # We reuse a public schema or just return the dict for simplicity
    return product_service.update_variant(db, variant_id, variant_in)

@router.delete("/{variant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_variant(
    variant_id: UUID,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Delete a product variant."""
    product_service.delete_variant(db, variant_id)
    return None