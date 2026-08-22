from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.system import ContactCreate, ContactResponse
from app.services import contact_service

router = APIRouter()


@router.post("/", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def submit_contact(contact_in: ContactCreate, db: Session = Depends(get_db)):
    """Save a customer contact message."""
    return contact_service.create_contact_message(db=db, contact_in=contact_in)
