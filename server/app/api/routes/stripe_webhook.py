from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_payment_gateway
from app.services import booking_service, order_service
from app.services.payment_gateway import PaymentGateway

router = APIRouter()


@router.post("/", include_in_schema=False)
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
    payment_gateway: PaymentGateway = Depends(get_payment_gateway),
):
    """
    Single endpoint for all Stripe webhooks.
    Registered in main.py at prefix /api/v1/webhooks/payments.
    Webhook path: POST /api/v1/webhooks/payments

    Handled events:
      checkout.session.completed    → confirm order + stock decrement + WhatsApp + email
      payment_intent.succeeded      → confirm booking deposit + WhatsApp + email
      payment_intent.payment_failed → mark booking payment_failed + WhatsApp
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = payment_gateway.verify_webhook_signature(payload, sig_header)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    event_type = event["type"]

    # ── Product order paid via Checkout Session ────────────────────────────────
    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata") or {}

        if metadata.get("type") == "product_order":
            from app.services.email import (  # noqa: PLC0415
                send_email, send_admin_email,
                order_confirmation_email, admin_order_notification_email,
            )
            order = order_service.confirm_order_payment(db=db, session_id=session["id"])
            if order:
                subj, html = order_confirmation_email(order)
                send_email(order.customer_email, subj, html)
                send_admin_email(*admin_order_notification_email(order))

    # ── Booking deposit paid via Payment Intent ────────────────────────────────
    elif event_type == "payment_intent.succeeded":
        pi = event["data"]["object"]
        metadata = pi.get("metadata") or {}

        if metadata.get("type") == "booking_deposit":
            from app.services.whatsapp import notify, NotificationEvent  # noqa: PLC0415
            from app.services.email import (  # noqa: PLC0415
                send_email, send_admin_email,
                booking_confirmation_email, admin_booking_notification_email,
            )

            booking = booking_service.confirm_booking_payment_intent(
                db=db, payment_intent_id=pi["id"]
            )
            if booking:
                service_name = booking.service.name if booking.service else "Service"
                booking_date = booking.booking_date.strftime("%a %d %b %Y")
                start_time = booking.start_time.strftime("%I:%M %p").lstrip("0")

                # WhatsApp — independent path
                notify(
                    NotificationEvent.NEW_BOOKING,
                    f"📅 New Booking — PN-{str(booking.id)[:8].upper()}\n"
                    f"{booking.customer_name} — {service_name}\n"
                    f"{booking_date} at {start_time}\n"
                    f"Deposit: CAD ${booking.deposit_cents / 100:.2f}\n"
                    f"pholarnatural.com/admin/bookings",
                    db,
                )

                # Email — independent path
                subj, html = booking_confirmation_email(booking)
                send_email(booking.customer_email, subj, html)
                send_admin_email(*admin_booking_notification_email(booking))

    # ── Booking deposit payment failed ─────────────────────────────────────────
    elif event_type == "payment_intent.payment_failed":
        pi = event["data"]["object"]
        metadata = pi.get("metadata") or {}

        if metadata.get("type") == "booking_deposit":
            from app.services.whatsapp import notify, NotificationEvent  # noqa: PLC0415

            booking = booking_service.fail_booking_payment(
                db=db, payment_intent_id=pi["id"]
            )
            if booking:
                service_name = booking.service.name if booking.service else "Service"
                booking_date = booking.booking_date.strftime("%a %d %b %Y")
                start_time = booking.start_time.strftime("%I:%M %p").lstrip("0")
                notify(
                    NotificationEvent.PAYMENT_FAILED,
                    f"💳 Payment Failed — PN-{str(booking.id)[:8].upper()}\n"
                    f"{booking.customer_name} — {service_name}\n"
                    f"{booking_date} at {start_time}\n"
                    f"pholarnatural.com/admin/bookings",
                    db,
                )

    return {"status": "ok"}
