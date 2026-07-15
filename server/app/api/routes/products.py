from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.product import ProductResponse
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
