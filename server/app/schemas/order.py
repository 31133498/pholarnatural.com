from uuid import UUID
from typing import Any, List, Optional

from pydantic import BaseModel, EmailStr, model_validator
from datetime import date, datetime

# Represents a single item in the shopping cart
class CartItem(BaseModel):
    variant_id: UUID
    quantity: int

class AddressSchema(BaseModel):
    full_name: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    province: str
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
    id: UUID
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
    order_id: UUID

class OrderCreateResponse(BaseModel):
    """Phase 2 response — no Stripe checkout URL required."""
    id: UUID
    subtotal_cents: int
    shipping_cents: int
    discount_cents: int
    total_cents: int
    status: str

    model_config = {"from_attributes": True}

class BlockedDateCreate(BaseModel):
    date: date
    reason: Optional[str] = None

class BlockedDateResponse(BaseModel):
    id: UUID
    date: date
    reason: Optional[str]
    created_at: datetime
    
    model_config = {"from_attributes": True}

class OrderItemResponse(BaseModel):
    id: UUID
    product_name: str
    variant_label: Optional[str] = None
    quantity: int
    unit_price_cents: int

    model_config = {"from_attributes": True}


class AdminOrderResponse(BaseModel):
    id: UUID
    order_number: str
    customer_name: str
    customer_email: str
    shipping_address: Any
    subtotal_cents: int
    shipping_cents: int
    discount_cents: int
    total_cents: int
    status: str
    created_at: datetime
    items: List[OrderItemResponse]

    model_config = {"from_attributes": True}

    @model_validator(mode='before')
    @classmethod
    def _from_orm(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return data
        return {
            'id': data.id,
            'order_number': f"PN-{str(data.id)[:8].upper()}",
            'customer_name': data.customer_name,
            'customer_email': data.customer_email,
            'shipping_address': data.shipping_address or {},
            'subtotal_cents': data.subtotal_cents,
            'shipping_cents': data.shipping_cents,
            'discount_cents': data.discount_cents,
            'total_cents': data.total_cents,
            'status': data.status,
            'created_at': data.created_at,
            'items': [
                {
                    'id': item.id,
                    'product_name': item.product_name,
                    'variant_label': item.variant_label,
                    'quantity': item.quantity,
                    'unit_price_cents': item.unit_price_cents,
                }
                for item in data.items
            ],
        }


# ----- ORDERS -----
class OrderStatusUpdate(BaseModel):
    status: str # e.g., "shipped", "delivered", "cancelled"