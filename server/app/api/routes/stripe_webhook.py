from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_payment_gateway
from app.services.payment_gateway import PaymentGateway
from app.services import order_service, booking_service

router = APIRouter()

@router.post("/", include_in_schema=False)
async def stripe_unified_webhook(
    request: Request, 
    db: Session = Depends(get_db),
    payment_gateway: PaymentGateway = Depends(get_payment_gateway)
):
    """Single endpoint for ALL Stripe webhooks (Orders & Bookings)."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        # Verify the signature using our injected gateway
        event = payment_gateway.verify_webhook_signature(payload, sig_header)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Handle successful payments
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        metadata = session.get('metadata', {})
        
        # Route to the correct service based on metadata!
        if metadata.get('type') == 'product_order':
            order_service.confirm_order_payment(db=db, session_id=session.get("id"))
            
        elif metadata.get('booking_id'):
            booking_service.confirm_booking_payment(db=db, session_id=session.get("id"))

    return {"status": "success"}