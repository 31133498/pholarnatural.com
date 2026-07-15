from uuid import UUID

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DiscountCreate(BaseModel):
    code: str
    discount_type: str # "percentage" or "fixed"
    value: int
    max_uses: Optional[int] = None
    min_order_cents: Optional[int] = None
    expires_at: Optional[datetime] = None
    is_active: bool = True

class DiscountUpdate(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[str] = None
    value: Optional[int] = None
    max_uses: Optional[int] = None
    min_order_cents: Optional[int] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None

class DiscountResponse(DiscountCreate):
    id: UUID
    used_count: int

    model_config = {"from_attributes": True}