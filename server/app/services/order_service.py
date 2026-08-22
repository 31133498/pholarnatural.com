from typing import Optional

from app.services.payment_gateway import PaymentGateway
from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException
from datetime import datetime, timezone

from app.models.order import Order, OrderItem, Discount
from app.models.product import ProductVariant, Product
from app.schemas.order import OrderCreate
from app.core.config import settings
from app.schemas.order import OrderStatusUpdate

def get_orders(db: Session, status: Optional[str] = None):
    """Fetch all orders with items eagerly loaded, optionally filtering by status."""
    query = db.query(Order).options(selectinload(Order.items))
    if status:
        query = query.filter(Order.status == status)
    return query.order_by(Order.created_at.desc()).all()

def get_order_detail(db: Session, order_id):
    """Fetch a single order with items eagerly loaded."""
    order = db.query(Order).options(selectinload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

def update_order_status(db: Session, order_id, status_in: OrderStatusUpdate):
    """Update the fulfillment status of an order."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status_in.status
    db.commit()

# Shipping defaults (overridden by admin_settings keys of the same name)
_SHIPPING_DEFAULTS: dict[str, int] = {
    "shipping_rate_domestic_cents": 995,    # Canada
    "shipping_rate_us_cents": 1499,         # United States
    "shipping_rate_uk_cents": 1999,         # United Kingdom
    "shipping_rate_international_cents": 2499,
}
_TAX_RATE_DEFAULT = 13  # Ontario HST %


def _get_shipping_cents(db: Session, country: str) -> int:
    from app.services.settings_service import get_setting  # noqa: PLC0415
    c = (country or "").strip().lower()
    if c in ("canada", "ca"):
        key = "shipping_rate_domestic_cents"
    elif c in ("united states", "us", "usa"):
        key = "shipping_rate_us_cents"
    elif c in ("united kingdom", "uk", "gb", "great britain"):
        key = "shipping_rate_uk_cents"
    else:
        key = "shipping_rate_international_cents"
    return int(get_setting(db, key, str(_SHIPPING_DEFAULTS[key])))


def _get_tax_rate(db: Session) -> float:
    from app.services.settings_service import get_setting  # noqa: PLC0415
    return float(get_setting(db, "tax_rate_percent", str(_TAX_RATE_DEFAULT)))


def create_order_phase2(db: Session, order_in: OrderCreate):
    """Phase 2: create a pending order without Stripe. Returns the new Order row."""
    variant_ids = [item.variant_id for item in order_in.items]
    variants = db.query(ProductVariant).join(Product).filter(
        ProductVariant.id.in_(variant_ids),
        ProductVariant.is_active == True,
        Product.is_active == True,
    ).all()
    variant_map = {v.id: v for v in variants}

    subtotal_cents = 0
    db_order_items = []
    for cart_item in order_in.items:
        variant = variant_map.get(cart_item.variant_id)
        if not variant:
            raise HTTPException(status_code=400, detail=f"Variant {cart_item.variant_id} is invalid or inactive.")
        if variant.stock_count < cart_item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {variant.product.name}.")
        line_total = variant.price_cents * cart_item.quantity
        subtotal_cents += line_total
        db_order_items.append(OrderItem(
            product_variant_id=variant.id,
            product_name=variant.product.name,
            variant_label=variant.weight_label,
            quantity=cart_item.quantity,
            unit_price_cents=variant.price_cents,
        ))

    discount_cents = 0
    db_discount = None
    if order_in.discount_code:
        db_discount = db.query(Discount).filter(
            Discount.code == order_in.discount_code.upper(),
            Discount.is_active == True,
        ).first()
        if not db_discount:
            raise HTTPException(status_code=400, detail="Invalid discount code.")
        if db_discount.expires_at and db_discount.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Discount code expired.")
        if db_discount.max_uses and db_discount.used_count >= db_discount.max_uses:
            raise HTTPException(status_code=400, detail="Discount code usage limit reached.")
        if db_discount.min_order_cents and subtotal_cents < db_discount.min_order_cents:
            raise HTTPException(status_code=400, detail="Order minimum not met for this code.")
        if db_discount.discount_type == "percentage":
            discount_cents = int(subtotal_cents * (db_discount.value / 100))
        elif db_discount.discount_type == "fixed":
            discount_cents = db_discount.value
        discount_cents = min(discount_cents, subtotal_cents)

    discounted_subtotal = subtotal_cents - discount_cents
    shipping_cents = _get_shipping_cents(db, order_in.shipping_address.country)
    tax_cents = round(discounted_subtotal * _get_tax_rate(db) / 100)
    total_cents = discounted_subtotal + shipping_cents + tax_cents

    db_order = Order(
        customer_name=order_in.customer_name,
        customer_email=order_in.customer_email,
        shipping_address=order_in.shipping_address.model_dump(),
        subtotal_cents=subtotal_cents,
        shipping_cents=shipping_cents,
        discount_cents=discount_cents,
        tax_cents=tax_cents,
        total_cents=total_cents,
        status="pending",
        discount_id=db_discount.id if db_discount else None,
        items=db_order_items,
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


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

    # 4. Calculate Totals
    discounted_subtotal_ph2 = subtotal_cents - discount_cents
    shipping_cents = _get_shipping_cents(db, order_in.shipping_address.country)
    tax_cents_ph2 = round(discounted_subtotal_ph2 * _get_tax_rate(db) / 100)
    total_cents = discounted_subtotal_ph2 + shipping_cents + tax_cents_ph2

    # 5. Create the Pending Order in the DB
    db_order = Order(
        customer_name=order_in.customer_name,
        customer_email=order_in.customer_email,
        shipping_address=order_in.shipping_address.model_dump(),
        subtotal_cents=subtotal_cents,
        shipping_cents=shipping_cents,
        discount_cents=discount_cents,
        tax_cents=tax_cents_ph2,
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

def create_order_checkout(db: Session, order_in: OrderCreate, payment_gateway: PaymentGateway):
    """
    Phase 9: validate cart, create a pending Order row, then open a Stripe
    Checkout Session (single CAD line item to avoid negative-amount restrictions).
    Returns (db_order, checkout_url).
    """
    variant_ids = [item.variant_id for item in order_in.items]
    variants = db.query(ProductVariant).join(Product).filter(
        ProductVariant.id.in_(variant_ids),
        ProductVariant.is_active == True,
        Product.is_active == True,
    ).all()
    variant_map = {v.id: v for v in variants}

    subtotal_cents = 0
    db_order_items = []
    item_descriptions = []
    for cart_item in order_in.items:
        variant = variant_map.get(cart_item.variant_id)
        if not variant:
            raise HTTPException(status_code=400, detail=f"Variant {cart_item.variant_id} is invalid or inactive.")
        if variant.stock_count < cart_item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {variant.product.name}.")
        line_total = variant.price_cents * cart_item.quantity
        subtotal_cents += line_total
        db_order_items.append(OrderItem(
            product_variant_id=variant.id,
            product_name=variant.product.name,
            variant_label=variant.weight_label,
            quantity=cart_item.quantity,
            unit_price_cents=variant.price_cents,
        ))
        item_descriptions.append(
            f"{cart_item.quantity}× {variant.product.name} ({variant.weight_label})"
        )

    discount_cents = 0
    db_discount = None
    if order_in.discount_code:
        db_discount = db.query(Discount).filter(
            Discount.code == order_in.discount_code.upper(),
            Discount.is_active == True,
        ).first()
        if not db_discount:
            raise HTTPException(status_code=400, detail="Invalid discount code.")
        if db_discount.expires_at and db_discount.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Discount code expired.")
        if db_discount.max_uses and db_discount.used_count >= db_discount.max_uses:
            raise HTTPException(status_code=400, detail="Discount code usage limit reached.")
        if db_discount.min_order_cents and subtotal_cents < db_discount.min_order_cents:
            raise HTTPException(status_code=400, detail="Order minimum not met for this code.")
        if db_discount.discount_type == "percentage":
            discount_cents = int(subtotal_cents * (db_discount.value / 100))
        elif db_discount.discount_type == "fixed":
            discount_cents = db_discount.value
        discount_cents = min(discount_cents, subtotal_cents)

    discounted_subtotal = subtotal_cents - discount_cents
    shipping_cents = _get_shipping_cents(db, order_in.shipping_address.country)
    tax_cents = round((discounted_subtotal + shipping_cents) * _get_tax_rate(db) / 100)
    total_cents = discounted_subtotal + shipping_cents + tax_cents

    db_order = Order(
        customer_name=order_in.customer_name,
        customer_email=order_in.customer_email,
        shipping_address=order_in.shipping_address.model_dump(),
        subtotal_cents=subtotal_cents,
        shipping_cents=shipping_cents,
        discount_cents=discount_cents,
        tax_cents=tax_cents,
        total_cents=total_cents,
        status="pending",
        discount_id=db_discount.id if db_discount else None,
        items=db_order_items,
    )
    db.add(db_order)
    db.flush()  # get ID before the Stripe call

    description = ", ".join(item_descriptions)
    if discount_cents and db_discount:
        description += f" — {db_discount.code} applied"
    if shipping_cents:
        description += f" + CAD ${shipping_cents / 100:.2f} shipping"
    description += f" + CAD ${tax_cents / 100:.2f} HST"

    stripe_line_items = [{
        "price_data": {
            "currency": "cad",
            "unit_amount": total_cents,
            "product_data": {
                "name": "Pholar Natural Order",
                "description": description,
            },
        },
        "quantity": 1,
    }]

    try:
        session_data = payment_gateway.create_checkout_session(
            line_items=stripe_line_items,
            success_url=f"{settings.DOMAIN}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.DOMAIN}/cart",
            metadata={"order_id": str(db_order.id), "type": "product_order"},
            customer_email=order_in.customer_email,
        )
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=502, detail=f"Stripe checkout failed: {exc}")

    db_order.stripe_session_id = session_data["session_id"]
    db.commit()
    db.refresh(db_order)
    return db_order, session_data["url"]


def confirm_order_payment(db: Session, session_id: str):
    """Called by Stripe webhook to finalize the order."""
    # Local imports avoid loading whatsapp/settings at module startup.
    from app.services.settings_service import get_setting  # noqa: PLC0415
    from app.services.whatsapp import notify, NotificationEvent  # noqa: PLC0415

    order = db.query(Order).filter(Order.stripe_session_id == session_id).first()
    if order and order.status == "pending":
        order.status = "paid"

        low_stock_threshold = int(get_setting(db, "low_stock_threshold", "5"))

        # Decrement stock for each item; fire low_stock alert if threshold crossed.
        item_count = 0
        for item in order.items:
            item_count += item.quantity
            variant = db.query(ProductVariant).filter(ProductVariant.id == item.product_variant_id).first()
            if variant:
                variant.stock_count = max(0, variant.stock_count - item.quantity)
                if 0 < variant.stock_count <= low_stock_threshold:
                    product = db.query(Product).filter(Product.id == variant.product_id).first()
                    product_name = product.name if product else item.product_name
                    variant_label = variant.weight_label or item.variant_label or "Default"
                    units = variant.stock_count
                    notify(
                        NotificationEvent.LOW_STOCK,
                        f"⚠️ Low Stock — {product_name}\n"
                        f"Variant: {variant_label} · {units} unit{'s' if units != 1 else ''} remaining\n"
                        f"pholarnatural.com/admin/products",
                        db,
                    )

        # Increment discount usage; fire discount_maxed_out if limit just reached.
        if order.discount_id:
            discount = db.query(Discount).filter(Discount.id == order.discount_id).first()
            if discount:
                discount.used_count += 1
                if discount.max_uses and discount.used_count >= discount.max_uses:
                    notify(
                        NotificationEvent.DISCOUNT_MAXED_OUT,
                        f"🎟️ Code Maxed Out — {discount.code}\n"
                        f"Reached usage limit: {discount.used_count} / {discount.max_uses}\n"
                        f"pholarnatural.com/admin/discounts",
                        db,
                    )

        # Fire new_order alert here — after payment confirmed, not at order creation.
        order_number = f"PN-{str(order.id)[:8].upper()}"
        notify(
            NotificationEvent.NEW_ORDER,
            f"🛍️ New Order — {order_number}\n"
            f"Customer: {order.customer_name} · {item_count} item{'s' if item_count != 1 else ''}\n"
            f"Total: CAD ${order.total_cents / 100:.2f}\n"
            f"pholarnatural.com/admin/orders",
            db,
        )

        db.commit()
        return order
    return None