from uuid import UUID
from pydantic import BaseModel, EmailStr

class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    secret_key: str

class AdminResponse(BaseModel):
    id: UUID
    email: EmailStr
    is_active: bool
    
    model_config = {"from_attributes": True}