from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class PaymentGateway(ABC):
    """Abstract contract for any payment provider (Stripe, etc.)."""

    @abstractmethod
    def create_checkout_session(
        self,
        line_items: list[Dict[str, Any]],
        success_url: str,
        cancel_url: str,
        metadata: Dict[str, str],
        customer_email: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a hosted Checkout Session.
        Returns at least {"session_id": str, "url": str}.
        """

    @abstractmethod
    def create_payment_intent(
        self,
        amount_cents: int,
        currency: str,
        metadata: Dict[str, str],
        customer_email: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a Payment Intent for inline Payment Element flows.
        Returns {"payment_intent_id": str, "client_secret": str}.
        """

    @abstractmethod
    def create_refund(
        self,
        payment_intent_id: str,
        amount_cents: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Refund a Payment Intent in full (or partially if amount_cents given).
        Returns {"refund_id": str, "status": str}. Raises on failure.
        """

    @abstractmethod
    def verify_webhook_signature(self, payload: bytes, signature: str) -> Dict[str, Any]:
        """
        Verify webhook signature and return the parsed Stripe event dict.
        Raises on invalid signature.
        """
