from uuid import UUID

from pydantic import BaseModel
from typing import Optional

class ServiceBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    duration_minutes: int
    price_cents: int
    image_url: Optional[str] = None
    is_active: bool = True

class ServiceResponse(ServiceBase):
    id: UUID

    # This tells Pydantic to read the data from SQLAlchemy models
    model_config = {"from_attributes": True}

class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int
    price_cents: int
    image_url: Optional[str] = None
    is_active: bool = True

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    price_cents: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None