"""
WhatsApp notification service using Evolution API instance "pholar-notifier".

Public API — the ONLY entry points other code should use:
  notify(event, message, db)          fire-and-forget alert, never raises
  get_whatsapp_connection_status()    check Evolution API connection health

Never call send_whatsapp_notification() directly from route handlers.
"""

import json
import logging
import threading
import urllib.request
import urllib.error
from enum import Enum

from sqlalchemy.orm import Session

from app.core.config import settings

logger = logging.getLogger(__name__)


class NotificationEvent(str, Enum):
    NEW_ORDER = "new_order"
    NEW_BOOKING = "new_booking"
    BOOKING_CANCELLED = "booking_cancelled"
    # NOTE: PAYMENT_FAILED is defined here but intentionally defaults to OFF
    # until Phase 9 (Stripe) is live. Flip _DEFAULT_ON[PAYMENT_FAILED] to True
    # and wire notify() into the Stripe webhook when going live.
    PAYMENT_FAILED = "payment_failed"
    NEW_CONTACT_MESSAGE = "new_contact_message"
    LOW_STOCK = "low_stock"
    DISCOUNT_MAXED_OUT = "discount_maxed_out"


_TOGGLE_KEY: dict[NotificationEvent, str] = {
    NotificationEvent.NEW_ORDER: "notify_new_order",
    NotificationEvent.NEW_BOOKING: "notify_new_booking",
    NotificationEvent.BOOKING_CANCELLED: "notify_booking_cancelled",
    NotificationEvent.PAYMENT_FAILED: "notify_payment_failed",
    NotificationEvent.NEW_CONTACT_MESSAGE: "notify_new_contact_message",
    NotificationEvent.LOW_STOCK: "notify_low_stock",
    NotificationEvent.DISCOUNT_MAXED_OUT: "notify_discount_maxed_out",
}

# Default value used when the key has never been saved to admin_settings.
# Matches the spec (confirmed with user 2026-08-22):
#   ON  — new_order, new_booking, booking_cancelled, new_contact_message, low_stock
#   OFF — payment_failed (flip to True when Stripe Phase 9 goes live), discount_maxed_out
_DEFAULT_ON: dict[NotificationEvent, bool] = {
    NotificationEvent.NEW_ORDER: True,
    NotificationEvent.NEW_BOOKING: True,
    NotificationEvent.BOOKING_CANCELLED: True,
    NotificationEvent.PAYMENT_FAILED: False,
    NotificationEvent.NEW_CONTACT_MESSAGE: True,
    NotificationEvent.LOW_STOCK: True,
    NotificationEvent.DISCOUNT_MAXED_OUT: False,
}


def _evolution_base() -> str:
    return (settings.EVOLUTION_API_URL or "http://evolution-api:8080").rstrip("/")


def send_whatsapp_notification(number: str, message: str) -> None:
    """
    POST text message to Evolution API.
    Raises urllib.error.URLError / RuntimeError on failure — callers handle it.
    Never call this directly from route handlers; use notify() instead.
    """
    if not settings.EVOLUTION_API_KEY:
        raise RuntimeError("EVOLUTION_API_KEY is not configured.")

    url = f"{_evolution_base()}/message/sendText/pholar-notifier"
    payload = json.dumps({"number": number, "text": message}).encode()
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "apikey": settings.EVOLUTION_API_KEY,
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        resp.read()


def get_whatsapp_connection_status() -> dict:
    """
    GET /instance/connectionState/pholar-notifier.
    Returns {"connected": bool, "state": str}. Never raises.
    """
    if not settings.EVOLUTION_API_KEY:
        return {"connected": False, "state": "unconfigured"}

    url = f"{_evolution_base()}/instance/connectionState/pholar-notifier"
    try:
        req = urllib.request.Request(
            url,
            headers={"apikey": settings.EVOLUTION_API_KEY},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
            state = data.get("instance", {}).get("state", "unknown")
            return {"connected": state == "open", "state": state}
    except Exception as exc:
        logger.error("WhatsApp status check failed: %s", exc)
        return {"connected": False, "state": "error"}


def notify(event: NotificationEvent, message: str, db: Session) -> None:
    """
    Fire-and-forget WhatsApp notification — the sole entry point for alerts.

    Reads the per-event toggle and notifier number from admin_settings
    synchronously (in the request thread, fast DB lookup), then spawns
    a daemon thread for the actual HTTP call so it never delays the response.

    Never raises, never blocks the caller.
    """
    # Local import avoids any circular-import risk at module load time.
    from app.services.settings_service import get_setting  # noqa: PLC0415

    try:
        default = "true" if _DEFAULT_ON[event] else "false"
        if get_setting(db, _TOGGLE_KEY[event], default) != "true":
            return

        number = get_setting(db, "notifier_whatsapp_number", "")
        if not number:
            return
    except Exception as exc:
        logger.error("notify: failed reading settings for %s: %s", event, exc)
        return

    def _send() -> None:
        try:
            send_whatsapp_notification(number=number, message=message)
            logger.debug("WhatsApp sent for %s", event)
        except Exception as exc:
            logger.error("WhatsApp send failed for %s: %s", event, exc)

    threading.Thread(target=_send, daemon=True).start()
