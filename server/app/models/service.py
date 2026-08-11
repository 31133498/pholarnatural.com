import uuid
from sqlalchemy import Column, Integer, String, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base

class Service(Base):
    __tablename__ = "services"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=False)
    price_cents = Column(Integer, nullable=False) # Store price in cents for Stripe compatibility
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)