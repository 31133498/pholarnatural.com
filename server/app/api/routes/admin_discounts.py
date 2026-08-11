from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.api.dependencies import get_db, get_current_admin
from app.models.admin import AdminUser
from app.schemas.discount import DiscountCreate, DiscountUpdate, DiscountResponse
from app.services import discount_service

router = APIRouter()

@router.get("/", response_model=List[DiscountResponse])
def list_discounts(db: Session = Depends(get_db), current_admin: AdminUser = Depends(get_current_admin)):
    return discount_service.get_all_discounts(db)

@router.post("/", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
def create_discount(discount_in: DiscountCreate, db: Session = Depends(get_db), current_admin: AdminUser = Depends(get_current_admin)):
    return discount_service.create_discount(db, discount_in)

@router.put("/{discount_id}", response_model=DiscountResponse)
def update_discount(discount_id: UUID, discount_in: DiscountUpdate, db: Session = Depends(get_db), current_admin: AdminUser = Depends(get_current_admin)):
    return discount_service.update_discount(db, discount_id, discount_in)

@router.delete("/{discount_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_discount(discount_id: UUID, db: Session = Depends(get_db), current_admin: AdminUser = Depends(get_current_admin)):
    discount_service.delete_discount(db, discount_id)
    return None