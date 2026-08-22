from typing import Dict

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_admin
from app.models.admin import AdminUser
from app.services import settings_service
from app.services import whatsapp

router = APIRouter()

# ── Public (no auth) ──────────────────────────────────────────────────────────

_PUBLIC_KEYS = [
    "shipping_rate_domestic_cents",
    "shipping_rate_us_cents",
    "shipping_rate_uk_cents",
    "shipping_rate_international_cents",
    "tax_rate_percent",
    "instagram_url",
    "facebook_url",
    "tiktok_url",
    "featured_product_ids",
    "featured_service_ids",
    "hero_image_url",
    "featured_image_url",
]

_PUBLIC_DEFAULTS = {
    "shipping_rate_domestic_cents": "995",
    "shipping_rate_us_cents": "1499",
    "shipping_rate_uk_cents": "1999",
    "shipping_rate_international_cents": "2499",
    "tax_rate_percent": "13",
    "instagram_url": "",
    "facebook_url": "",
    "tiktok_url": "",
    "featured_product_ids": "",
    "featured_service_ids": "",
    "hero_image_url": "",
    "featured_image_url": "",
}


@router.get("/settings/public")
def get_public_settings(db: Session = Depends(get_db)):
    """Public settings — no auth required. Returns shipping rates, tax rate, social links."""
    all_s = settings_service.get_all_settings(db)
    return {k: all_s.get(k, _PUBLIC_DEFAULTS.get(k, "")) for k in _PUBLIC_KEYS}


# ── Admin (auth required) ─────────────────────────────────────────────────────


@router.post("/settings/upload-image")
async def upload_settings_image(
    file: UploadFile = File(...),
    current_admin: AdminUser = Depends(get_current_admin),
):
    """Upload a hero or featured image to Cloudinary. Returns {url: str}."""
    from app.services.storage_service import CloudinaryStorageService  # noqa: PLC0415
    try:
        storage = CloudinaryStorageService()
        contents = await file.read()
        url = storage.upload_image(contents, folder="settings")
        return {"url": url}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload failed: {exc}")


@router.get("/settings")
def get_settings(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    """Return all admin_settings key/value pairs."""
    return settings_service.get_all_settings(db)


@router.put("/settings")
def update_settings(
    updates: Dict[str, str],
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    """Batch-upsert admin_settings. Send only the keys you want to change."""
    settings_service.upsert_settings(db, updates)
    return {"ok": True}


@router.get("/whatsapp/status")
def whatsapp_status(
    current_admin: AdminUser = Depends(get_current_admin),
):
    """
    Check whether the Evolution API instance is connected.
    Returns {connected: bool, state: str, phone: str | None}.
    """
    return whatsapp.get_whatsapp_connection_status()


@router.get("/whatsapp/qr")
def whatsapp_qr(
    current_admin: AdminUser = Depends(get_current_admin),
):
    """
    Fetch a fresh QR code from Evolution API for pairing a WhatsApp account.
    Returns {base64: str | None, code: str | None}.
    base64 is a full data URI ready for <img src>.
    """
    return whatsapp.get_whatsapp_qr()


@router.post("/whatsapp/logout")
def whatsapp_logout(
    current_admin: AdminUser = Depends(get_current_admin),
):
    """Disconnect the linked WhatsApp account so a new number can be paired."""
    try:
        whatsapp.logout_whatsapp()
        return {"ok": True}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Logout failed: {exc}")


@router.post("/whatsapp/test")
def whatsapp_test(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    """Send a test WhatsApp message to the configured notifier number."""
    number = settings_service.get_setting(db, "notifier_whatsapp_number", "")
    if not number:
        raise HTTPException(
            status_code=400,
            detail="No notifier number configured. Enter a number in Settings and save first.",
        )
    try:
        whatsapp.send_whatsapp_notification(
            number=number,
            message=(
                "🧪 Test from Pholar Natural admin panel.\n"
                "If you see this, WhatsApp alerts are working correctly."
            ),
        )
        return {"ok": True}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"WhatsApp send failed: {exc}")
