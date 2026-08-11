from abc import ABC, abstractmethod
from typing import Dict, Any

class PaymentGateway(ABC):
    """
    Abstract Base Class defining the contract for any payment gateway 
    we use (Stripe, PayPal, Flutterwave, etc.)
    """

    @abstractmethod
    def create_checkout_session(
        self, 
        line_items: list[Dict[str, Any]],
        success_url: str, 
        cancel_url: str, 
        metadata: Dict[str, str],
        customer_email: str = None
    ) -> Dict[str, Any]:
        """
        Creates a checkout session and returns a dictionary containing 
        at least 'session_id' and 'url'.
        """
        pass

    @abstractmethod
    def verify_webhook_signature(self, payload: bytes, signature: str) -> Dict[str, Any]:
        """
        Verifies the incoming webhook signature to ensure it came from the payment provider.
        Returns the parsed event object.
        """
        pass