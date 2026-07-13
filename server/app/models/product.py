from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    tagline = Column(String(255), nullable=True)
    category = Column(String(100), index=True, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # func.now() lets the database handle the timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")

class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    url = Column(String(500), nullable=False)
    alt = Column(String(255), nullable=True)
    sort_order = Column(Integer, default=0)

    # Relationship back to Product
    product = relationship("Product", back_populates="images")

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    weight_grams = Column(Integer, nullable=True)
    weight_label = Column(String(50), nullable=True)  # e.g., "250g", "16oz"
    price_cents = Column(Integer, nullable=False)     # Always store currency as integers (cents)
    stock_count = Column(Integer, default=0)
    sku = Column(String(100), unique=True, index=True, nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationship back to Product
    product = relationship("Product", back_populates="variants")