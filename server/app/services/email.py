"""
Email notification service using Resend.

Public API (fire-and-forget, never raises):
  send_email(to, subject, html)

Template builders — call synchronously while the DB session is open,
pass the returned (subject, html) strings to send_email:
  order_confirmation_email(order)            -> (subject, html)
  booking_confirmation_email(booking)        -> (subject, html)
  admin_order_notification_email(order)      -> (subject, html)
  admin_booking_notification_email(booking)  -> (subject, html)
"""

import json
import logging
import threading
import urllib.error
import urllib.request
from datetime import date, time

from app.core.config import settings

logger = logging.getLogger(__name__)

_RESEND_URL = "https://api.resend.com/emails"
_FONT = "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
_SITE = "https://pholarnatural.com"
_SUPPORT = "hello@pholarnatural.com"
_ADDRESS = "Studio 104 &middot; Botanical District &middot; Toronto, Canada"
_HOURS = "Mon&ndash;Sat, 10:00 AM &ndash; 5:00 PM"


# ── Low-level send ─────────────────────────────────────────────────────────────

def _do_send(to: "str | list[str]", subject: str, html: str) -> None:
    """Blocking HTTP call — always invoked from a daemon thread."""
    recipients = [to] if isinstance(to, str) else to
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured; skipping email to %s", recipients)
        return
    payload = json.dumps({
        "from": settings.DEFAULT_FROM_EMAIL,
        "to": recipients,
        "subject": subject,
        "html": html,
    }).encode()
    req = urllib.request.Request(
        _RESEND_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            logger.info("Email sent to %s (status %s)", to, resp.status)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        logger.error("Resend HTTP error %s for %s: %s", exc.code, to, body)
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to, exc)


def send_email(to: "str | list[str]", subject: str, html: str) -> None:
    """Fire-and-forget. Build the HTML before calling. Never raises, never blocks."""
    threading.Thread(target=_do_send, args=(to, subject, html), daemon=True).start()


def send_admin_email(subject: str, html: str) -> None:
    """Send to all addresses in settings.ADMIN_EMAIL (comma-separated). No-op if unset."""
    if not settings.ADMIN_EMAIL:
        return
    recipients = [e.strip() for e in settings.ADMIN_EMAIL.split(",") if e.strip()]
    if recipients:
        threading.Thread(target=_do_send, args=(recipients, subject, html), daemon=True).start()


# ── Helpers ────────────────────────────────────────────────────────────────────

def _cad(cents: int) -> str:
    return f"CAD ${cents / 100:,.2f}"


def _fmt_date(d: date) -> str:
    return d.strftime(f"%A, %B {d.day}, %Y")


def _fmt_time(t: time) -> str:
    hour = t.hour % 12 or 12
    return f"{hour}:{t.strftime('%M')} {'AM' if t.hour < 12 else 'PM'}"


# ── Base template ──────────────────────────────────────────────────────────────

def _base(preheader: str, content: str) -> str:
    spacer = "&nbsp;&#847;" * 50
    return f"""<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Pholar Natural</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#F4F4F6;font-family:{_FONT};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;color:#F4F4F6;font-size:1px;mso-hide:all;">{preheader}{spacer}</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#F4F4F6;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;">
        <tr><td style="background-color:#1B1D2F;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
          <a href="{_SITE}" style="text-decoration:none;">
            <span style="font-family:{_FONT};font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;">Pholar Natural</span>
          </a>
        </td></tr>
        <tr><td style="background-color:#FFFFFF;padding:40px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
          {content}
        </td></tr>
        <tr><td style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#9CA3AF;font-family:{_FONT};">Pholar Natural &nbsp;&middot;&nbsp; {_ADDRESS}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#9CA3AF;font-family:{_FONT};">{_HOURS}</p>
          <p style="margin:0;font-size:12px;color:#9CA3AF;font-family:{_FONT};">Questions?&nbsp;<a href="mailto:{_SUPPORT}" style="color:#2563EB;text-decoration:none;">{_SUPPORT}</a>&nbsp;&middot;&nbsp;<a href="{_SITE}/refund-policy" style="color:#2563EB;text-decoration:none;">Refund policy</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


# ── Order confirmation (customer) ──────────────────────────────────────────────

def order_confirmation_email(order) -> tuple[str, str]:
    """Returns (subject, html). Call while the DB session is open."""
    order_num = f"PN-{str(order.id)[:8].upper()}"

    items_rows = ""
    for item in order.items:
        items_rows += (
            f'<tr>'
            f'<td style="padding:10px 0;border-bottom:1px solid #F3F4F6;font-size:14px;color:#1B1D2F;font-family:{_FONT};">'
            f'{item.product_name}'
            f'<span style="display:block;font-size:12px;color:#9CA3AF;">{item.variant_label}</span>'
            f'</td>'
            f'<td style="padding:10px 0;border-bottom:1px solid #F3F4F6;font-size:14px;color:#6B7280;text-align:center;white-space:nowrap;font-family:{_FONT};">&times;{item.quantity}</td>'
            f'<td style="padding:10px 0;border-bottom:1px solid #F3F4F6;font-size:14px;color:#1B1D2F;font-weight:600;text-align:right;white-space:nowrap;font-family:{_FONT};">{_cad(item.unit_price_cents * item.quantity)}</td>'
            f'</tr>'
        )

    discount_row = ""
    if order.discount_cents:
        discount_row = (
            f'<tr>'
            f'<td colspan="2" style="padding:4px 0;font-size:14px;color:#059669;font-family:{_FONT};">Discount</td>'
            f'<td style="padding:4px 0;font-size:14px;color:#059669;text-align:right;font-weight:600;font-family:{_FONT};">&minus;{_cad(order.discount_cents)}</td>'
            f'</tr>'
        )

    addr = order.shipping_address or {}
    addr_parts = [
        addr.get("full_name", ""),
        addr.get("address_line1", ""),
        addr.get("address_line2") or "",
        f"{addr.get('city', '')}, {addr.get('province', '')} {addr.get('postal_code', '')}".strip(", "),
        addr.get("country", ""),
    ]
    addr_html = "<br>".join(p for p in addr_parts if p and p.strip(", "))

    shipping_display = "Free" if order.shipping_cents == 0 else _cad(order.shipping_cents)

    content = (
        f'<p style="margin:0 0 6px;font-size:24px;font-weight:700;color:#1B1D2F;font-family:{_FONT};">Order confirmed</p>'
        f'<p style="margin:0 0 28px;font-size:15px;color:#6B7280;font-family:{_FONT};">Reference <strong style="color:#1B1D2F;">{order_num}</strong></p>'
        f'<p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;font-family:{_FONT};">Hi {order.customer_name},<br><br>Your order is confirmed and is now being processed. We&apos;ll send tracking information once your order has shipped.</p>'
        f'<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-top:2px solid #1B1D2F;">'
        f'<tr>'
        f'<th style="padding:10px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;text-align:left;font-family:{_FONT};">Item</th>'
        f'<th style="padding:10px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;text-align:center;font-family:{_FONT};">Qty</th>'
        f'<th style="padding:10px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;text-align:right;font-family:{_FONT};">Price</th>'
        f'</tr>'
        f'{items_rows}'
        f'<tr><td colspan="2" style="padding:12px 0 4px;font-size:14px;color:#6B7280;border-top:1px solid #E5E7EB;font-family:{_FONT};">Subtotal</td><td style="padding:12px 0 4px;font-size:14px;color:#1B1D2F;text-align:right;border-top:1px solid #E5E7EB;font-family:{_FONT};">{_cad(order.subtotal_cents)}</td></tr>'
        f'{discount_row}'
        f'<tr><td colspan="2" style="padding:4px 0;font-size:14px;color:#6B7280;font-family:{_FONT};">Shipping</td><td style="padding:4px 0;font-size:14px;color:#1B1D2F;text-align:right;font-family:{_FONT};">{shipping_display}</td></tr>'
        f'<tr><td colspan="2" style="padding:4px 0;font-size:14px;color:#6B7280;font-family:{_FONT};">HST</td><td style="padding:4px 0;font-size:14px;color:#1B1D2F;text-align:right;font-family:{_FONT};">{_cad(order.tax_cents)}</td></tr>'
        f'<tr><td colspan="2" style="padding:14px 0 0;font-size:17px;font-weight:700;color:#1B1D2F;border-top:2px solid #1B1D2F;font-family:{_FONT};">Total</td><td style="padding:14px 0 0;font-size:17px;font-weight:700;color:#2563EB;text-align:right;border-top:2px solid #1B1D2F;font-family:{_FONT};">{_cad(order.total_cents)}</td></tr>'
        f'</table>'
        f'<div style="margin:28px 0 0;padding:20px;background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;">'
        f'<p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;font-family:{_FONT};">Shipping to</p>'
        f'<p style="margin:0;font-size:14px;color:#1B1D2F;line-height:1.7;font-family:{_FONT};">{addr_html}</p>'
        f'</div>'
        f'<p style="margin:28px 0 0;font-size:13px;color:#9CA3AF;text-align:center;line-height:1.5;font-family:{_FONT};">Processing 1&ndash;2 business days, then 3&ndash;7 business days in transit.<br>All prices in CAD.</p>'
    )

    subject = f"Order confirmed — {order_num}"
    return subject, _base(preheader=f"Your Pholar Natural order {order_num} is confirmed.", content=content)


# ── Booking confirmation (customer) ───────────────────────────────────────────

def booking_confirmation_email(booking) -> tuple[str, str]:
    """Returns (subject, html). Call while the DB session is open."""
    ref = f"PN-{str(booking.id)[:8].upper()}"
    service_name = booking.service.name if booking.service else "Appointment"
    date_str = _fmt_date(booking.booking_date)
    start_str = _fmt_time(booking.start_time)
    end_str = _fmt_time(booking.end_time)

    b = "border-top:1px solid #DBEAFE;padding-top:14px;padding-bottom:14px;"

    content = (
        f'<p style="margin:0 0 6px;font-size:24px;font-weight:700;color:#1B1D2F;font-family:{_FONT};">Booking confirmed</p>'
        f'<p style="margin:0 0 28px;font-size:15px;color:#6B7280;font-family:{_FONT};">Reference <strong style="color:#1B1D2F;">{ref}</strong></p>'
        f'<p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;font-family:{_FONT};">Hi {booking.customer_name},<br><br>Your appointment is confirmed. We look forward to seeing you.</p>'
        f'<div style="background-color:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:24px;">'
        f'<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">'
        f'<tr><td style="padding-bottom:14px;font-size:14px;color:#6B7280;width:40%;font-family:{_FONT};">Service</td><td style="padding-bottom:14px;font-size:14px;color:#1B1D2F;font-weight:600;text-align:right;font-family:{_FONT};">{service_name}</td></tr>'
        f'<tr><td style="{b}font-size:14px;color:#6B7280;font-family:{_FONT};">Date</td><td style="{b}font-size:14px;color:#1B1D2F;font-weight:600;text-align:right;font-family:{_FONT};">{date_str}</td></tr>'
        f'<tr><td style="{b}font-size:14px;color:#6B7280;font-family:{_FONT};">Time</td><td style="{b}font-size:14px;color:#1B1D2F;font-weight:600;text-align:right;font-family:{_FONT};">{start_str} &ndash; {end_str}</td></tr>'
        f'<tr><td style="border-top:1px solid #DBEAFE;padding-top:14px;font-size:14px;color:#6B7280;font-family:{_FONT};">Deposit paid</td><td style="border-top:1px solid #DBEAFE;padding-top:14px;font-size:16px;font-weight:700;color:#2563EB;text-align:right;font-family:{_FONT};">{_cad(booking.deposit_cents)}</td></tr>'
        f'</table>'
        f'</div>'
        f'<div style="margin:16px 0 0;padding:16px 20px;background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;">'
        f'<p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;font-family:{_FONT};">Location</p>'
        f'<p style="margin:0;font-size:14px;color:#1B1D2F;font-family:{_FONT};">Studio 104 &middot; Botanical District &middot; Toronto, Canada</p>'
        f'</div>'
        f'<div style="margin:16px 0 0;padding:16px 20px;background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;">'
        f'<p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#92400E;font-family:{_FONT};">Cancellation policy</p>'
        f'<p style="margin:0;font-size:13px;color:#78350F;line-height:1.6;font-family:{_FONT};">Cancel within <strong>30 minutes</strong> of booking for a full deposit refund.<br>The deposit is <strong>non-refundable</strong> within 24 hours of the appointment.<br>To cancel or rebook, contact us at <a href="mailto:{_SUPPORT}" style="color:#92400E;">{_SUPPORT}</a>.</p>'
        f'</div>'
        f'<p style="margin:28px 0 0;font-size:13px;color:#9CA3AF;text-align:center;font-family:{_FONT};">Please arrive 5 minutes early. All prices in CAD. See our <a href="{_SITE}/refund-policy" style="color:#2563EB;text-decoration:none;">refund policy</a>.</p>'
    )

    subject = f"Booking confirmed — {service_name} on {_fmt_date(booking.booking_date)}"
    return subject, _base(preheader=f"Your {service_name} appointment on {date_str} at {start_str} is confirmed.", content=content)


# ── Order status update (customer) ────────────────────────────────────────────

_STATUS_COPY: dict[str, tuple[str, str, str, str]] = {
    # status: (headline, body, preheader, accent_hex)
    "confirmed": (
        "We're preparing your order",
        "Great news — we've confirmed your order and are getting it packed up. We'll send you another email as soon as it ships.",
        "Your order is confirmed and being prepared.",
        "#2563EB",
    ),
    "processing": (
        "Your order is being packed",
        "Your items are being picked and packed right now. Expect a shipping notification shortly.",
        "Your order is being packed and will ship soon.",
        "#D97706",
    ),
    "shipped": (
        "Your order is on its way!",
        "Your package has been dispatched. Depending on your location, delivery typically takes 3&ndash;7 business days from the ship date.",
        "Your Pholar Natural order has shipped — it's on the way!",
        "#7C3AED",
    ),
    "delivered": (
        "Your order has been delivered",
        "We hope you love your new products! If anything isn't right, reply to this email or reach out to us at <a href=\"mailto:{support}\" style=\"color:#059669;\">{support}</a> and we'll make it right.",
        "Your order has arrived — enjoy!",
        "#059669",
    ),
}


def order_status_update_email(order, new_status: str) -> tuple[str, str] | None:
    """
    Returns (subject, html) for a customer status-update email, or None if the
    status has no customer-facing email (e.g. 'paid' — that's the confirmation email).
    Call while the DB session is open.
    """
    copy = _STATUS_COPY.get(new_status)
    if not copy:
        return None

    headline, body_text, preheader, accent = copy
    body_text = body_text.replace("{support}", _SUPPORT)

    order_num = f"PN-{str(order.id)[:8].upper()}"

    items_rows = ""
    for item in order.items:
        items_rows += (
            f'<tr>'
            f'<td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:14px;color:#1B1D2F;font-family:{_FONT};">'
            f'{item.product_name}'
            f'<span style="display:block;font-size:12px;color:#9CA3AF;">{item.variant_label}</span>'
            f'</td>'
            f'<td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:14px;color:#6B7280;text-align:center;font-family:{_FONT};">&times;{item.quantity}</td>'
            f'<td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:14px;font-weight:600;color:#1B1D2F;text-align:right;font-family:{_FONT};">{_cad(item.unit_price_cents * item.quantity)}</td>'
            f'</tr>'
        )

    status_label = new_status.upper()

    content = (
        f'<div style="margin:0 0 24px;padding:16px 20px;background-color:{accent}14;border-left:4px solid {accent};border-radius:4px;">'
        f'<p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:{accent};font-family:{_FONT};">Order {status_label}</p>'
        f'<p style="margin:4px 0 0;font-size:13px;color:#6B7280;font-family:{_FONT};">Reference <strong style="color:#1B1D2F;">{order_num}</strong></p>'
        f'</div>'
        f'<p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1B1D2F;font-family:{_FONT};">{headline}</p>'
        f'<p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;font-family:{_FONT};">Hi {order.customer_name},<br><br>{body_text}</p>'
        f'<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-top:2px solid #1B1D2F;">'
        f'<tr>'
        f'<th style="padding:10px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;text-align:left;font-family:{_FONT};">Item</th>'
        f'<th style="padding:10px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;text-align:center;font-family:{_FONT};">Qty</th>'
        f'<th style="padding:10px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;text-align:right;font-family:{_FONT};">Price</th>'
        f'</tr>'
        f'{items_rows}'
        f'<tr><td colspan="3" style="padding:14px 0 0;border-top:2px solid #1B1D2F;font-size:17px;font-weight:700;color:#1B1D2F;font-family:{_FONT};">'
        f'Total &nbsp;<span style="color:{accent};">{_cad(order.total_cents)}</span></td></tr>'
        f'</table>'
        f'<p style="margin:28px 0 0;font-size:13px;color:#9CA3AF;text-align:center;line-height:1.5;font-family:{_FONT};">Questions? <a href="mailto:{_SUPPORT}" style="color:#2563EB;text-decoration:none;">{_SUPPORT}</a><br>All prices in CAD.</p>'
    )

    subject = f"Order {new_status} — {order_num}"
    return subject, _base(preheader=preheader, content=content)


# ── Admin: order notification ──────────────────────────────────────────────────

def admin_order_notification_email(order) -> tuple[str, str]:
    """Returns (subject, html) for the admin new-order alert."""
    order_num = f"PN-{str(order.id)[:8].upper()}"
    items_summary = ", ".join(
        f"{item.quantity}&times; {item.product_name} ({item.variant_label})"
        for item in order.items
    )
    addr = order.shipping_address or {}
    ship_line = ", ".join(filter(None, [
        addr.get("address_line1"), addr.get("city"), addr.get("province"), addr.get("country"),
    ]))

    r = "border-top:1px solid #F3F4F6;padding-top:12px;padding-bottom:12px;"

    content = (
        f'<p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1B1D2F;font-family:{_FONT};">New order &mdash; {order_num}</p>'
        f'<p style="margin:0 0 28px;font-size:14px;color:#059669;font-weight:600;font-family:{_FONT};">Paid &middot; {_cad(order.total_cents)}</p>'
        f'<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">'
        f'<tr><td style="padding-bottom:12px;font-size:14px;color:#6B7280;width:30%;vertical-align:top;font-family:{_FONT};">Customer</td><td style="padding-bottom:12px;font-size:14px;color:#1B1D2F;font-weight:600;font-family:{_FONT};">{order.customer_name}<br><span style="font-weight:400;color:#6B7280;">{order.customer_email}</span></td></tr>'
        f'<tr><td style="{r}font-size:14px;color:#6B7280;vertical-align:top;font-family:{_FONT};">Items</td><td style="{r}font-size:14px;color:#1B1D2F;font-family:{_FONT};">{items_summary}</td></tr>'
        f'<tr><td style="{r}font-size:14px;color:#6B7280;vertical-align:top;font-family:{_FONT};">Ship to</td><td style="{r}font-size:14px;color:#1B1D2F;font-family:{_FONT};">{ship_line}</td></tr>'
        f'<tr><td style="border-top:1px solid #F3F4F6;padding-top:12px;font-size:14px;color:#6B7280;font-family:{_FONT};">Total</td><td style="border-top:1px solid #F3F4F6;padding-top:12px;font-size:18px;font-weight:700;color:#2563EB;font-family:{_FONT};">{_cad(order.total_cents)}</td></tr>'
        f'</table>'
        f'<div style="margin:28px 0 0;text-align:center;"><a href="{_SITE}/admin/orders" style="display:inline-block;padding:14px 32px;background-color:#1B1D2F;color:#FFFFFF;text-decoration:none;border-radius:100px;font-size:14px;font-weight:600;font-family:{_FONT};">View in admin &rarr;</a></div>'
    )

    subject = f"New order — {order_num} · {_cad(order.total_cents)}"
    return subject, _base(preheader=f"New paid order from {order.customer_name}: {_cad(order.total_cents)}", content=content)


# ── Admin: booking notification ────────────────────────────────────────────────

def admin_booking_notification_email(booking) -> tuple[str, str]:
    """Returns (subject, html) for the admin new-booking alert."""
    ref = f"PN-{str(booking.id)[:8].upper()}"
    service_name = booking.service.name if booking.service else "Appointment"
    date_str = _fmt_date(booking.booking_date)
    start_str = _fmt_time(booking.start_time)

    phone_row = ""
    if booking.customer_phone:
        phone_row = f'<br><span style="font-weight:400;color:#6B7280;">{booking.customer_phone}</span>'

    r = "border-top:1px solid #F3F4F6;padding-top:12px;padding-bottom:12px;"

    content = (
        f'<p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1B1D2F;font-family:{_FONT};">New booking &mdash; {ref}</p>'
        f'<p style="margin:0 0 28px;font-size:14px;color:#059669;font-weight:600;font-family:{_FONT};">Deposit paid &middot; {_cad(booking.deposit_cents)}</p>'
        f'<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">'
        f'<tr><td style="padding-bottom:12px;font-size:14px;color:#6B7280;width:30%;vertical-align:top;font-family:{_FONT};">Customer</td><td style="padding-bottom:12px;font-size:14px;color:#1B1D2F;font-weight:600;font-family:{_FONT};">{booking.customer_name}<br><span style="font-weight:400;color:#6B7280;">{booking.customer_email}</span>{phone_row}</td></tr>'
        f'<tr><td style="{r}font-size:14px;color:#6B7280;font-family:{_FONT};">Service</td><td style="{r}font-size:14px;color:#1B1D2F;font-weight:600;font-family:{_FONT};">{service_name}</td></tr>'
        f'<tr><td style="{r}font-size:14px;color:#6B7280;font-family:{_FONT};">Date</td><td style="{r}font-size:14px;color:#1B1D2F;font-weight:600;font-family:{_FONT};">{date_str}</td></tr>'
        f'<tr><td style="{r}font-size:14px;color:#6B7280;font-family:{_FONT};">Time</td><td style="{r}font-size:14px;color:#1B1D2F;font-weight:600;font-family:{_FONT};">{start_str}</td></tr>'
        f'<tr><td style="border-top:1px solid #F3F4F6;padding-top:12px;font-size:14px;color:#6B7280;font-family:{_FONT};">Deposit</td><td style="border-top:1px solid #F3F4F6;padding-top:12px;font-size:18px;font-weight:700;color:#2563EB;font-family:{_FONT};">{_cad(booking.deposit_cents)}</td></tr>'
        f'</table>'
        f'<div style="margin:28px 0 0;text-align:center;"><a href="{_SITE}/admin/bookings" style="display:inline-block;padding:14px 32px;background-color:#1B1D2F;color:#FFFFFF;text-decoration:none;border-radius:100px;font-size:14px;font-weight:600;font-family:{_FONT};">View in admin &rarr;</a></div>'
    )

    subject = f"New booking — {service_name} · {date_str}"
    return subject, _base(preheader=f"New booking from {booking.customer_name}: {service_name} on {date_str} at {start_str}", content=content)
