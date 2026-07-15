import os
import re
import shutil
import uuid

from app.services.storage_service import StorageService
from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException, status, UploadFile
from app.models.product import Product, ProductImage, ProductVariant
from app.schemas.product import ProductCreate, ProductUpdate, VariantCreate, VariantUpdate

def get_active_products(db: Session):
    """
    Fetches all active products, eager-loading their images and variants
    so we don't hit the database in a loop later.
    """
    return db.query(Product)\
        .filter(Product.is_active == True)\
        .options(
            selectinload(Product.images), 
            selectinload(Product.variants)
        )\
        .all()

def get_product_by_slug(db: Session, slug: str):
    """
    Fetches a single product by its URL-friendly slug.
    Throws a 404 error if not found.
    """
    product = db.query(Product)\
        .filter(Product.slug == slug, Product.is_active == True)\
        .options(
            selectinload(Product.images), 
            selectinload(Product.variants)
        )\
        .first()
        
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with slug '{slug}' not found"
        )
        
    return product

def create_product(db: Session, product_in: ProductCreate):
    """Create a new product and its initial variants."""
    
    # Check if slug exists
    unique_slug = generate_unique_slug(db, product_in.name)
        
    # Create the Product
    db_product = Product(
        name=product_in.name,
        slug=unique_slug,
        description=product_in.description,
        tagline=product_in.tagline,
        category=product_in.category,
        is_active=product_in.is_active
    )
    db.add(db_product)
    db.commit() # Commit to get the product ID
    db.refresh(db_product)
    
    # Create the Variants
    for var_in in product_in.variants:
        db_variant = ProductVariant(
            product_id=db_product.id,
            weight_grams=var_in.weight_grams,
            weight_label=var_in.weight_label,
            price_cents=var_in.price_cents,
            stock_count=var_in.stock_count,
            sku=var_in.sku,
            is_active=var_in.is_active
        )
        db.add(db_variant)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_in: ProductUpdate):
    """Update an existing product's top-level details."""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    update_data = product_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    """Delete a product (and cascade delete variants/images)."""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}

def add_variant_to_product(db: Session, product_id: int, variant_in: VariantCreate):
    """Add a new variant to an existing product."""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    db_variant = ProductVariant(
        product_id=product_id,
        weight_grams=variant_in.weight_grams,
        weight_label=variant_in.weight_label,
        price_cents=variant_in.price_cents,
        stock_count=variant_in.stock_count,
        sku=variant_in.sku,
        is_active=variant_in.is_active
    )
    db.add(db_variant)
    db.commit()
    db.refresh(db_variant)
    return db_variant


def update_variant(db: Session, variant_id: int, variant_in: VariantUpdate):
    """Update an existing variant."""
    db_variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not db_variant:
        raise HTTPException(status_code=404, detail="Variant not found")
        
    update_data = variant_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_variant, key, value)
        
    db.commit()
    db.refresh(db_variant)
    return db_variant

def delete_variant(db: Session, variant_id: int):
    """Delete a variant."""
    db_variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not db_variant:
        raise HTTPException(status_code=404, detail="Variant not found")
        
    db.delete(db_variant)
    db.commit()
    return {"message": "Variant deleted successfully"}

def upload_product_image(
    db: Session, 
    product_id: int, 
    file: UploadFile,
    storage: StorageService # INJECT HERE
):
    """Save an uploaded image via Cloudinary and add it to the database."""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Upload using the injected service
    try:
        # Pass the raw file bytes
        image_url = storage.upload_image(file.file, folder="products")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
    
    db_image = ProductImage(product_id=product_id, url=image_url, alt=db_product.name)
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image

def delete_product_image(
    db: Session, 
    product_id: int, 
    image_id: int,
    storage: StorageService # INJECT HERE
):
    """Delete an image record from the DB and Cloudinary."""
    db_image = db.query(ProductImage).filter(ProductImage.id == image_id, ProductImage.product_id == product_id).first()
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")
        
    # Delete from Cloudinary
    storage.delete_image(db_image.url)
    
    db.delete(db_image)
    db.commit()
    return {"message": "Image deleted successfully"}







def generate_unique_slug(db: Session, slug: str) -> str:
    """
    Generate a unique slug by appending a number if it already exists.
    Example:
        iphone -> iphone
        iphone -> iphone-1
        iphone -> iphone-2
    """
    base_slug = re.sub(r'[^a-zA-Z0-9-]', '', slug.replace(' ', '-')).strip('-').lower()

    # If the slug doesn't exist, return it
    if not db.query(Product).filter(Product.slug == base_slug).first():
        return base_slug

    counter = 1
    while True:
        new_slug = f"{base_slug}-{counter}"
        exists = db.query(Product).filter(Product.slug == new_slug).first()

        if not exists:
            return new_slug

        counter += 1