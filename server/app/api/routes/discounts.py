from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.discount import DiscountValidateRequest, DiscountValidateResponse
from app.services import discount_service

router = APIRouter()


@router.post("/validate", response_model=DiscountValidateResponse)
def validate_discount(req: DiscountValidateRequest, db: Session = Depends(get_db)):
    """Check if a discount code is valid and return the discount amount."""
    return discount_service.validate_discount(db, code=req.code, subtotal_cents=req.subtotal_cents)
