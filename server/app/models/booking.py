import uuid
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Time, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from app.db.database import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False)
    
    # Customer Info
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=False)
    customer_phone = Column(String(50), nullable=True)
    
    # Scheduling Info
    booking_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Payment & Status
    # Valid statuses: pending, confirmed, cancelled, completed
    status = Column(String(50), default="pending", index=True) 
    deposit_cents = Column(Integer, nullable=False)
    stripe_session_id = Column(String(255), nullable=True, unique=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    service = relationship("Service")

class BlockedDate(Base):
    __tablename__ = "blocked_dates"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    date = Column(Date, nullable=False, unique=True, index=True)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())