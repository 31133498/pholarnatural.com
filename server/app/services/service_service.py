from sqlalchemy.orm import Session
from app.models.service import Service

def get_active_services(db: Session):
    """Fetch all active services."""
    return db.query(Service).filter(Service.is_active == True).all()

def get_service_by_slug(db: Session, slug: str):
    """Fetch a single service by its slug."""
    return db.query(Service).filter(Service.slug == slug, Service.is_active == True).first()