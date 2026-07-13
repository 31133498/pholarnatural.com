from pydantic import BaseModel, EmailStr
from datetime import date, time, datetime
from typing import Optional

class BookingCreate(BaseModel):
    service_id: int
    customer_name: str
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    booking_date: date
    start_time: time

class BookingResponse(BaseModel):
    id: int
    service_id: int
    customer_name: str
    customer_email: EmailStr
    booking_date: date
    start_time: time
    end_time: time
    status: str
    deposit_cents: int
    
    model_config = {"from_attributes": True}

class CheckoutResponse(BaseModel):
    checkout_url: str
    booking_id: int

# ----- BLOCKED DATES -----
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