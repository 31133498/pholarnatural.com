import stripe
from app.services.payment_gateway import PaymentGateway
from app.core.config import settings
from typing import Dict, Any

class StripeGateway(PaymentGateway):
    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY
        self.webhook_secret = settings.STRIPE_WEBHOOK_SECRET

    def create_checkout_session(
        self, 
        line_items: list[Dict[str, Any]],
        success_url: str, 
        cancel_url: str, 
        metadata: Dict[str, str],
        customer_email: str = None
    ) -> Dict[str, Any]:
        
        session_params = {
            "payment_method_types": ['card'],
            "line_items": line_items,
            "mode": 'payment',
            "success_url": success_url,
            "cancel_url": cancel_url,
            "metadata": metadata
        }

        if customer_email:
            session_params["customer_email"] = customer_email

        session = stripe.checkout.Session.create(**session_params)
        
        return {
            "session_id": session.id,
            "url": session.url
        }

    def verify_webhook_signature(self, payload: bytes, signature: str) -> Dict[str, Any]:
        """Throws a ValueError or stripe.error.SignatureVerificationError if invalid."""
        return stripe.Webhook.construct_event(
            payload, signature, self.webhook_secret
        )