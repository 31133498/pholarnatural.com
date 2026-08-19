from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.product import ProductResponse
from app.services import product_service

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
def list_products(
    category: Optional[str] = Query(None, description="Filter by category, e.g. 'Hair Oil'"),
    q: Optional[str] = Query(None, description="Search term matched against name and description"),
    db: Session = Depends(get_db),
):
    """Retrieve active products, with optional category and full-text search filters."""
    return product_service.get_active_products(db=db, category=category, q=q)

@router.get("/{slug}", response_model=ProductResponse)
def retrieve_product(slug: str, db: Session = Depends(get_db)):
    """
    Retrieve details for a single product using its slug.
    """
    return product_service.get_product_by_slug(db=db, slug=slug)
