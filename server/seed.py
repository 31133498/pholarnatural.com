#!/usr/bin/env python3
"""
Seed the Pholar Natural database with the 2 products (variants + images)
and 7 services defined in IMPLEMENTATION-DOC.md §3.2 / lib/data.ts.

Run from inside the running API container:
    docker compose exec api python seed.py

Idempotent — checks for existing slugs and skips them, so it's safe to
run multiple times without creating duplicates.
"""

import sys
import uuid
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(__file__))

from app.db.database import SessionLocal
from app.models.product import Product, ProductVariant, ProductImage
from app.models.service import Service
from app.models.order import Discount
from sqlalchemy.orm import Session


# ─── Seed data ────────────────────────────────────────────────────────────────
# Matches lib/data.ts exactly. Prices in cents, durations in minutes.

PRODUCTS = [
    {
        "slug": "restorative-hair-oil",
        "name": "Restorative Hair Oil",
        "tagline": "African Marula & Argan",
        "category": "Hair Oil",
        "description": (
            "A featherweight restorative oil pressed from hand-harvested marula and argan, "
            "blended with hibiscus and rosemary extract. It absorbs without residue, sealing "
            "moisture into the hair shaft while soothing the scalp. Formulated for coily, curly "
            "and textured hair that needs sustained nourishment rather than a surface shine.\n\n"
            "Use three to five drops on damp hair from mid-length to ends, or massage directly "
            "into the scalp before washing. Cold-pressed in small batches and bottled in amber "
            "glass to protect the botanicals from light."
        ),
        "is_active": True,
        "variants": [
            {"weight_grams": 30,  "weight_label": "30ml",  "price_cents": 2_500,  "stock_count": 42, "sku": "PN-RHO-030", "is_active": True},
            {"weight_grams": 100, "weight_label": "100ml", "price_cents": 7_000,  "stock_count": 8,  "sku": "PN-RHO-100", "is_active": True},
            {"weight_grams": 250, "weight_label": "250ml", "price_cents": 15_000, "stock_count": 0,  "sku": "PN-RHO-250", "is_active": True},
        ],
        "images": [
            {"url": "/images/products/restorative-hair-oil-hero.webp", "alt": "Amber glass dropper bottle of Restorative Hair Oil on a linen surface",  "sort_order": 0},
            {"url": "/images/products/restorative-hair-oil.webp",      "alt": "Restorative Hair Oil beside dried botanical ingredients",                  "sort_order": 1},
            {"url": "/images/products/restorative-hair-oil-alt.webp",  "alt": "Close-up of the gold dropper of the Restorative Hair Oil",                "sort_order": 2},
            {"url": "/images/products/gallery-thumb-1.webp",           "alt": "Restorative Hair Oil styled with fresh botanicals",                        "sort_order": 3},
        ],
    },
    {
        "slug": "botanical-cleanse-shampoo",
        "name": "Botanical Cleanse Shampoo",
        "tagline": "Shea Butter & Coconut",
        "category": "Shampoo",
        "description": (
            "A sulfate-free cleanser built around shea butter, virgin coconut and aloe. It lifts "
            "product build-up and scalp oil without stripping the natural lipids that keep textured "
            "hair soft, so hair is left clean but never squeaking.\n\n"
            "The low-foam formula is gentle enough for daily use and safe on colour-treated and "
            "chemically relaxed hair. Work a small amount through wet hair, focusing on the scalp, "
            "then rinse thoroughly and follow with the Restorative Hair Oil."
        ),
        "is_active": True,
        "variants": [
            {"weight_grams": 100, "weight_label": "100ml", "price_cents": 1_100, "stock_count": 60, "sku": "PN-BCS-100", "is_active": True},
            {"weight_grams": 250, "weight_label": "250ml", "price_cents": 2_000, "stock_count": 31, "sku": "PN-BCS-250", "is_active": True},
            {"weight_grams": 500, "weight_label": "500ml", "price_cents": 3_600, "stock_count": 5,  "sku": "PN-BCS-500", "is_active": True},
        ],
        "images": [
            {"url": "/images/products/botanical-cleanse-shampoo-hero.webp", "alt": "White bottle of Botanical Cleanse Shampoo on a marble surface",  "sort_order": 0},
            {"url": "/images/products/botanical-cleanse-shampoo.webp",      "alt": "Botanical Cleanse Shampoo surrounded by fresh green leaves",      "sort_order": 1},
            {"url": "/images/products/gallery-thumb-2.webp",                "alt": "Detail of the Botanical Cleanse Shampoo pump",                    "sort_order": 2},
            {"url": "/images/products/gallery-thumb-3.webp",                "alt": "Botanical Cleanse Shampoo styled in a bathroom setting",          "sort_order": 3},
        ],
    },
]

DISCOUNTS = [
    {
        "code": "WELCOME10",
        "discount_type": "percentage",
        "value": 10,
        "max_uses": 500,
        "min_order_cents": 3_000,
        "expires_at": datetime(2026, 12, 31, 23, 59, 59, tzinfo=timezone.utc),
        "is_active": True,
    },
    {
        "code": "SAVE15",
        "discount_type": "percentage",
        "value": 15,
        "max_uses": 200,
        "min_order_cents": 5_000,
        "expires_at": None,
        "is_active": True,
    },
]

SERVICES = [
    {
        "slug": "french-braids",
        "name": "French Braids",
        "description": "Classic plaited braids worked over the scalp, protective and neat enough to last.",
        "duration_minutes": 180,
        "price_cents": 12_000,
        "image_url": "/images/services/french-braids.webp",
        "is_active": True,
    },
    {
        "slug": "cornrows",
        "name": "Cornrows",
        "description": "Traditional braids laid flat to the scalp in clean, even rows.",
        "duration_minutes": 180,
        "price_cents": 10_000,
        "image_url": "/images/services/cornrows.webp",
        "is_active": True,
    },
    {
        "slug": "cornrow-mix-twist",
        "name": "Cornrow Mix Twist",
        "description": "Cornrows combined with twisted sections for a patterned, textured finish.",
        "duration_minutes": 240,
        "price_cents": 13_000,
        "image_url": "/images/services/cornrow-mix-twist.webp",
        "is_active": True,
    },
    {
        "slug": "natural-twist",
        "name": "Natural Twist",
        "description": "Two-strand twists that define texture and protect length, with no heat.",
        "duration_minutes": 120,
        "price_cents": 9_000,
        "image_url": "/images/services/natural-twist.webp",
        "is_active": True,
    },
    {
        "slug": "wash-and-blow-dry",
        "name": "Wash and Blow Dry",
        "description": "Deep botanical cleanse followed by a smooth, controlled blow dry.",
        "duration_minutes": 60,
        "price_cents": 6_500,
        "image_url": "/images/services/wash-and-blow-dry.webp",
        "is_active": True,
    },
    {
        "slug": "hair-treatment",
        "name": "Hair Treatment",
        "description": "Intensive protein and hydration therapy using our signature botanical blends.",
        "duration_minutes": 90,
        "price_cents": 16_000,
        "image_url": "/images/services/hair-treatment.webp",
        "is_active": True,
    },
    {
        "slug": "hair-waxing",
        "name": "Hair Waxing",
        "description": "Gentle, natural hair removal using sugar and sage botanical waxes.",
        "duration_minutes": 45,
        "price_cents": 8_000,
        "image_url": "/images/services/hair-waxing.webp",
        "is_active": True,
    },
]


# ─── Seed functions ───────────────────────────────────────────────────────────

def seed_products(db: Session) -> None:
    for p_data in PRODUCTS:
        if db.query(Product).filter(Product.slug == p_data["slug"]).first():
            print(f"  [skip] {p_data['slug']} — already exists")
            continue

        product = Product(
            id=uuid.uuid4(),
            name=p_data["name"],
            slug=p_data["slug"],
            tagline=p_data["tagline"],
            category=p_data["category"],
            description=p_data["description"],
            is_active=p_data["is_active"],
        )
        db.add(product)
        db.flush()  # flush to get product.id before inserting children

        for v in p_data["variants"]:
            db.add(ProductVariant(id=uuid.uuid4(), product_id=product.id, **v))

        for img in p_data["images"]:
            db.add(ProductImage(id=uuid.uuid4(), product_id=product.id, **img))

        print(
            f"  [ok]   {p_data['slug']}"
            f" — {len(p_data['variants'])} variants, {len(p_data['images'])} images"
        )

    db.commit()


def seed_discounts(db: Session) -> None:
    for d_data in DISCOUNTS:
        if db.query(Discount).filter(Discount.code == d_data["code"]).first():
            print(f"  [skip] {d_data['code']} — already exists")
            continue
        db.add(Discount(id=uuid.uuid4(), used_count=0, **d_data))
        print(f"  [ok]   {d_data['code']} — {d_data['value']}{'%' if d_data['discount_type'] == 'percentage' else '¢'} off")
    db.commit()


def seed_services(db: Session) -> None:
    for s_data in SERVICES:
        if db.query(Service).filter(Service.slug == s_data["slug"]).first():
            print(f"  [skip] {s_data['slug']} — already exists")
            continue

        db.add(Service(id=uuid.uuid4(), **s_data))
        print(f"  [ok]   {s_data['slug']}")

    db.commit()


# ─── Entry point ──────────────────────────────────────────────────────────────

def main() -> None:
    print("Pholar Natural — database seed")
    print("=" * 40)

    db: Session = SessionLocal()
    try:
        print("\nProducts:")
        seed_products(db)

        print("\nServices:")
        seed_services(db)

        print("\nDiscounts:")
        seed_discounts(db)

        print("\nDone.")
    except Exception as exc:
        db.rollback()
        print(f"\nError: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
