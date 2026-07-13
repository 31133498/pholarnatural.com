from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.api.dependencies import get_db, get_current_admin
from app.core import security
from app.core.config import settings
from app.models.admin import AdminUser
from pydantic import BaseModel

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/login", response_model=Token)
def login_for_access_token(
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends() # FastAPI's built-in form handler
):
    """Admin Login. Expects form-data with 'username' (email) and 'password'."""
    
    # 1. Find the user by email (form_data.username is used for email here)
    admin = db.query(AdminUser).filter(AdminUser.email == form_data.username).first()
    
    # 2. Verify password
    if not admin or not security.verify_password(form_data.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 3. Create the JWT
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": admin.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def get_admin_profile(current_admin: AdminUser = Depends(get_current_admin)):
    """A protected test route to verify the token works."""
    return {"email": current_admin.email, "is_active": current_admin.is_active}