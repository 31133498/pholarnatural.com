from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.dependencies import get_db
from app.schemas.service import ServiceResponse
from app.services import service_service

router = APIRouter()

@router.get("/", response_model=List[ServiceResponse])
def list_services(db: Session = Depends(get_db)):
    """Get all active services."""
    return service_service.get_active_services(db)

@router.get("/{slug}", response_model=ServiceResponse)
def get_service(slug: str, db: Session = Depends(get_db)):
    """Get a specific service by its slug."""
    service = service_service.get_service_by_slug(db, slug=slug)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return service