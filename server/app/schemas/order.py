from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import date, datetime

# Represents a single item in the shopping cart
class CartItem(BaseModel):
    variant_id: int
    quantity: int

class AddressSchema(BaseModel):
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str

# What the frontend sends when they click "Checkout"
class OrderCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    shipping_address: AddressSchema
    items: List[CartItem]
    discount_code: Optional[str] = None

class OrderResponse(BaseModel):
    id: int
    customer_name: str
    customer_email: EmailStr
    subtotal_cents: int
    shipping_cents: int
    discount_cents: int
    total_cents: int
    status: str
    
    model_config = {"from_attributes": True}

class CheckoutResponse(BaseModel):
    checkout_url: str
    order_id: int

class BlockedDateCreate(BaseModel):
    date: date
    reason: Optional[str] = None

class BlockedDateResponse(BaseModel):
    id: int
    date: date
    reason: Optional[str]
    created_at: datetime
    
    model_config = {"from_attributes": True}

# ----- ORDERS -----
class OrderStatusUpdate(BaseModel):
    status: str # e.g., "shipped", "delivered", "cancelled"