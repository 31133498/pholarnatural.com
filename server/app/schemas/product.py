from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ProductImageBase(BaseModel):
    id: int
    url: str
    alt: Optional[str] = None
    sort_order: int

    model_config = ConfigDict(from_attributes=True)

class ProductVariantBase(BaseModel):
    id: int
    weight_grams: Optional[int] = None
    weight_label: Optional[str] = None
    price_cents: int
    stock_count: int
    sku: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class ProductResponse(BaseModel):
    """
    This is the exact JSON structure the frontend will receive.
    Notice how it nests the images and variants automatically.
    """
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    tagline: Optional[str] = None
    category: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    images: List[ProductImageBase] = []
    variants: List[ProductVariantBase] = []

    model_config = ConfigDict(from_attributes=True)

# ----- VARIANTS -----
class VariantCreate(BaseModel):
    weight_grams: Optional[int] = None
    weight_label: Optional[str] = None
    price_cents: int
    stock_count: int = 0
    sku: Optional[str] = None
    is_active: bool = True

class VariantUpdate(BaseModel):
    weight_grams: Optional[int] = None
    weight_label: Optional[str] = None
    price_cents: Optional[int] = None
    stock_count: Optional[int] = None
    sku: Optional[str] = None
    is_active: Optional[bool] = None

# ----- PRODUCTS -----
class ProductCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    tagline: Optional[str] = None
    category: Optional[str] = None
    is_active: bool = True
    # Allow creating variants at the same time as the product
    variants: List[VariantCreate] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    tagline: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None