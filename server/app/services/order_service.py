from typing import Optional

from app.services.payment_gateway import PaymentGateway
from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timezone

from app.models.order import Order, OrderItem, Discount
from app.models.product import ProductVariant, Product
from app.schemas.order import OrderCreate
from app.core.config import settings
from app.schemas.order import OrderStatusUpdate

def get_orders(db: Session, status: Optional[str] = None):
    """Fetch all orders, optionally filtering by status."""
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    return query.order_by(Order.created_at.desc()).all()

def get_order_detail(db: Session, order_id: int):
    """Fetch a single order and eagerly load its items."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

def update_order_status(db: Session, order_id: int, status_in: OrderStatusUpdate):
    """Update the fulfillment status of an order (e.g., 'shipped')."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order.status = status_in.status
    db.commit()
    db.refresh(order)
    return order

def calculate_cart_and_checkout(db: Session, order_in: OrderCreate, payment_gateway: PaymentGateway):
    """Processes a cart, calculates totals, applies discounts, and creates a Stripe Checkout."""
    
    # 1. Fetch all variants in the cart from the DB to get accurate pricing
    variant_ids = [item.variant_id for item in order_in.items]
    
    # Fetch variants and eagerly load the parent product
    variants = db.query(ProductVariant).join(Product).filter(
        ProductVariant.id.in_(variant_ids),
        ProductVariant.is_active == True,
        Product.is_active == True
    ).all()
    
    variant_map = {v.id: v for v in variants}
    
    # 2. Calculate Subtotal and build order items
    subtotal_cents = 0
    db_order_items = []
    stripe_line_items = []
    
    for cart_item in order_in.items:
        variant = variant_map.get(cart_item.variant_id)
        if not variant:
            raise HTTPException(status_code=400, detail=f"Variant ID {cart_item.variant_id} is invalid or inactive.")
        
        # Check stock (Basic check, you might want more robust inventory locking later)
        if variant.stock_count < cart_item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {variant.product.name}.")
            
        line_total = variant.price_cents * cart_item.quantity
        subtotal_cents += line_total
        
        # Prepare DB item
        db_order_items.append(OrderItem(
            product_variant_id=variant.id,
            product_name=variant.product.name,
            variant_label=variant.weight_label,
            quantity=cart_item.quantity,
            unit_price_cents=variant.price_cents
        ))
        
        # Prepare Stripe item
        stripe_line_items.append({
            'price_data': {
                'currency': 'usd',
                'unit_amount': variant.price_cents,
                'product_data': {
                    'name': f"{variant.product.name} ({variant.weight_label})",
                },
            },
            'quantity': cart_item.quantity,
        })

    # 3. Handle Discounts
    discount_cents = 0
    db_discount = None
    
    if order_in.discount_code:
        db_discount = db.query(Discount).filter(
            Discount.code == order_in.discount_code.upper(),
            Discount.is_active == True
        ).first()
        
        if not db_discount:
            raise HTTPException(status_code=400, detail="Invalid discount code.")
            
        # Validate Expiration and Uses
        if db_discount.expires_at and db_discount.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Discount code expired.")
        if db_discount.max_uses and db_discount.used_count >= db_discount.max_uses:
            raise HTTPException(status_code=400, detail="Discount code usage limit reached.")
        if db_discount.min_order_cents and subtotal_cents < db_discount.min_order_cents:
            raise HTTPException(status_code=400, detail=f"Order minimum not met for this code.")
            
        # Calculate discount amount
        if db_discount.discount_type == "percentage":
            discount_cents = int(subtotal_cents * (db_discount.value / 100))
        elif db_discount.discount_type == "fixed":
            discount_cents = db_discount.value
            
        # Ensure we don't discount more than the subtotal
        discount_cents = min(discount_cents, subtotal_cents)

    # 4. Calculate Totals (Let's assume flat $5 shipping for now)
    shipping_cents = 500 
    total_cents = (subtotal_cents - discount_cents) + shipping_cents

    # 5. Create the Pending Order in the DB
    db_order = Order(
        customer_name=order_in.customer_name,
        customer_email=order_in.customer_email,
        shipping_address=order_in.shipping_address.model_dump(), # Convert Pydantic to dict for JSONB
        subtotal_cents=subtotal_cents,
        shipping_cents=shipping_cents,
        discount_cents=discount_cents,
        total_cents=total_cents,
        status="pending",
        discount_id=db_discount.id if db_discount else None,
        items=db_order_items
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # 6. Apply Stripe Discount/Shipping using Coupons/Shipping Rates (Simplified Approach)
    # Alternatively, you can use Stripe Coupons, but passing explicit line items is easier for custom logic.
    if discount_cents > 0:
        stripe_line_items.append({
             'price_data': {
                'currency': 'usd',
                'unit_amount': -discount_cents, # Negative amount for discount
                'product_data': { 'name': f"Discount ({db_discount.code})", },
            },
            'quantity': 1,
        })
        
    if shipping_cents > 0:
        stripe_line_items.append({
             'price_data': {
                'currency': 'usd',
                'unit_amount': shipping_cents,
                'product_data': { 'name': "Shipping", },
            },
            'quantity': 1,
        })

    # 7. Create Stripe Checkout Session
    try:
        session_data = payment_gateway.create_checkout_session(
            line_items=stripe_line_items,
            customer_email=order_in.customer_email,
            success_url=f"{settings.DOMAIN}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.DOMAIN}/checkout/cancel",
            metadata={"order_id": str(db_order.id), "type": "product_order"} 
        )
        
        db_order.stripe_session_id = session_data["session_id"]
        db.commit()
        
        return session_data["url"], db_order.id

    except Exception as e:
        db.delete(db_order)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

def confirm_order_payment(db: Session, session_id: str):
    """Called by Stripe webhook to finalize the order."""
    order = db.query(Order).filter(Order.stripe_session_id == session_id).first()
    if order and order.status == "pending":
        order.status = "paid"
        
        # Decrement stock for each item
        for item in order.items:
            variant = db.query(ProductVariant).filter(ProductVariant.id == item.product_variant_id).first()
            if variant:
                variant.stock_count = max(0, variant.stock_count - item.quantity)
        
        # Increment discount usage
        if order.discount_id:
            discount = db.query(Discount).filter(Discount.id == order.discount_id).first()
            if discount:
                discount.used_count += 1
                
        db.commit()
        return order
    return None