from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.system import ContactCreate, ContactResponse
from app.services import contact_service
from app.services.whatsapp import notify, NotificationEvent

router = APIRouter()


@router.post("/", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def submit_contact(contact_in: ContactCreate, db: Session = Depends(get_db)):
    """Save a customer contact message."""
    msg = contact_service.create_contact_message(db=db, contact_in=contact_in)

    excerpt = contact_in.message[:60] + ("…" if len(contact_in.message) > 60 else "")
    notify(
        NotificationEvent.NEW_CONTACT_MESSAGE,
        f"💬 New Message — {contact_in.name}\n"
        f"\"{excerpt}\"\n"
        f"pholarnatural.com/admin",
        db,
    )

    return msg
