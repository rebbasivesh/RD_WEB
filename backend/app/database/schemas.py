from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    user_id: str
    full_name: str
    login_id: str
    email: str
    phone: Optional[str] = None
    organization: Optional[str] = "NHAI HQ"
    department: Optional[str] = "Pavement Engineering"
    scope_region: Optional[str] = "All Regions"
    role: str
    status: str

class UserCreate(BaseModel):
    full_name: str
    login_id: str
    email: str
    phone: Optional[str] = None
    organization: Optional[str] = "NHAI HQ"
    department: Optional[str] = "Pavement Engineering"
    scope_region: Optional[str] = "All Regions"
    role: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True
