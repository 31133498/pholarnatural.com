from uuid import UUID

from pydantic import BaseModel, EmailStr
from datetime import date, time, datetime
from typing import List, Optional

class BookingCreate(BaseModel):
    service_id: UUID
    customer_name: str
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    booking_date: date
    start_time: time

class BookingResponse(BaseModel):
    id: UUID
    service_id: UUID
    customer_name: str
    customer_email: EmailStr
    booking_date: date
    start_time: time
    end_time: time
    status: str
    deposit_cents: int

    model_config = {"from_attributes": True}

class BookingCreateResponse(BaseModel):
    """Phase 2 response — no Stripe checkout URL required."""
    id: UUID
    booking_date: date
    start_time: time
    end_time: time
    status: str
    deposit_cents: int

    model_config = {"from_attributes": True}

class CheckoutResponse(BaseModel):
    checkout_url: str
    booking_id: UUID

# ----- SLOTS -----

class SlotInfo(BaseModel):
    time: str
    available: bool

class SlotsResponse(BaseModel):
    date: date
    slots: List[SlotInfo]

# ----- BLOCKED DATES -----
class BlockedDateCreate(BaseModel):
    date: date
    reason: Optional[str] = None

class BlockedDateResponse(BaseModel):
    id: UUID
    date: date
    reason: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

# ----- CANCELLATION -----
class BookingCancelRequest(BaseModel):
    cancellation_reason: Optional[str] = None

class BookingCancelResponse(BaseModel):
    id: UUID
    status: str
    cancellation_reason: Optional[str]

    model_config = {"from_attributes": True}


# ----- ORDERS -----
class OrderStatusUpdate(BaseModel):
    status: str # e.g., "shipped", "delivered", "cancelled"