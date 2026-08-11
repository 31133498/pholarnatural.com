from uuid import UUID

from fastapi import APIRouter, Depends, status, UploadFile, File
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_admin
from app.models.admin import AdminUser
from app.schemas.product import ProductResponse, ProductCreate, ProductUpdate, VariantCreate
from app.services import product_service

router = APIRouter()

# Note: The dependency is injected here, securing the route
@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate, 
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin) # <--- THE LOCK
):
    """Create a new product (Admin only)."""
    return product_service.create_product(db, product_in)

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: UUID,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Update a product (Admin only)."""
    return product_service.update_product(db, product_id, product_in)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Delete a product (Admin only)."""
    product_service.delete_product(db, product_id)
    return None

@router.post("/{product_id}/variants", status_code=status.HTTP_201_CREATED)
def add_product_variant(
    product_id: UUID,
    variant_in: VariantCreate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Add a variant to a product (Admin only)."""
    return product_service.add_variant_to_product(db, product_id, variant_in)

@router.post("/{product_id}/images", status_code=status.HTTP_201_CREATED)
def upload_image(
    product_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Upload an image for a product."""
    return product_service.upload_product_image(db, product_id, file)

@router.delete("/{product_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_image(
    product_id: UUID,
    image_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Delete a product image."""
    product_service.delete_product_image(db, product_id, image_id)
    return None