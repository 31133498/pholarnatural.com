from uuid import UUID

from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# ----- CONTACT MESSAGES -----
class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    subject: Optional[str] = None
    message: str

class ContactResponse(ContactCreate):
    id: UUID
    is_read: bool
    created_at: datetime
    model_config = {"from_attributes": True}

# ----- SETTINGS -----
class SettingItem(BaseModel):
    key: str
    value: str
    model_config = {"from_attributes": True}

class TestMessage(BaseModel):
    target: str # email address or phone number
    message: str

# ----- DASHBOARD -----
class DashboardStats(BaseModel):
    orders_today: int
    revenue_today_cents: int
    bookings_today: int
    recent_orders: List[dict] # We'll return simplified dicts for the dashboard
    upcoming_bookings: List[dict]