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
    id: int

    # This tells Pydantic to read the data from SQLAlchemy models
    model_config = {"from_attributes": True}