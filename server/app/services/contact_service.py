from sqlalchemy.orm import Session

from app.models.system import ContactMessage
from app.schemas.system import ContactCreate


def create_contact_message(db: Session, contact_in: ContactCreate):
    db_message = ContactMessage(
        name=contact_in.name,
        email=contact_in.email,
        subject=contact_in.subject,
        message=contact_in.message,
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message
