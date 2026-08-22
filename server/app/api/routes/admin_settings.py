from typing import Dict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_admin
from app.models.admin import AdminUser
from app.services import settings_service
from app.services import whatsapp

router = APIRouter()


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
    """Check whether the Evolution API instance 'pholar-notifier' is connected."""
    return whatsapp.get_whatsapp_connection_status()


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
