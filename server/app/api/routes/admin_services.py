from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.api.dependencies import get_db, get_current_admin
from app.models.admin import AdminUser
from app.schemas.service import ServiceCreate, ServiceUpdate
from app.schemas.service import ServiceResponse # Reusing public schema for response
from app.services import service_service

router = APIRouter()

@router.get("/", response_model=List[ServiceResponse])
def list_all_services(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """List all services, including inactive ones (Admin only)."""
    return service_service.get_all_services(db)

@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    service_in: ServiceCreate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Create a new service."""
    return service_service.create_service(db, service_in)

@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: UUID,
    service_in: ServiceUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Update a service."""
    return service_service.update_service(db, service_id, service_in)

@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: UUID,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Delete a service."""
    service_service.delete_service(db, service_id)
    return None