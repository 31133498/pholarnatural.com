from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException, status
from app.models.product import Product, ProductVariant
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
    if db.query(Product).filter(Product.slug == product_in.slug).first():
        raise HTTPException(status_code=400, detail="Product with this slug already exists.")
        
    # Create the Product
    db_product = Product(
        name=product_in.name,
        slug=product_in.slug,
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