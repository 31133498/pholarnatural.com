from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_admin
from app.models.admin import AdminUser
from app.schemas.product import ProductResponse, ProductCreate, ProductUpdate, VariantCreate
from app.services import product_service

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    """
    Retrieve a list of all active products in the store.
    """
    return product_service.get_active_products(db=db)

@router.get("/{slug}", response_model=ProductResponse)
def retrieve_product(slug: str, db: Session = Depends(get_db)):
    """
    Retrieve details for a single product using its slug.
    """
    return product_service.get_product_by_slug(db=db, slug=slug)

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
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Update a product (Admin only)."""
    return product_service.update_product(db, product_id, product_in)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Delete a product (Admin only)."""
    product_service.delete_product(db, product_id)
    return None

@router.post("/{product_id}/variants", status_code=status.HTTP_201_CREATED)
def add_product_variant(
    product_id: int,
    variant_in: VariantCreate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Add a variant to a product (Admin only)."""
    return product_service.add_variant_to_product(db, product_id, variant_in)