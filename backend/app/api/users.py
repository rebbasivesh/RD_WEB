from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database.database import get_db
from app.database.models import User, AuditLog
from app.database.schemas import UserResponse, UserCreate
from app.api.auth import get_current_user_from_token
from app.core.security import hash_password

router = APIRouter(prefix="/users", tags=["Users"])

class UpdateSelfProfileRequest(BaseModel):
    full_name: str
    phone: Optional[str] = None
    email: str

@router.get("", response_model=List[UserResponse])
def get_all_users(current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.id.asc()).all()

@router.post("", response_model=UserResponse)
def create_user(req: UserCreate, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    if current_user.role not in ["SUPER_ADMIN", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Permission denied. Only Admins can create user accounts.")
    
    existing = db.query(User).filter((User.login_id == req.login_id) | (User.email == req.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this Login ID or Email already exists.")
    
    count = db.query(User).count() + 1
    new_user_id = f"USR-{count:03d}"
    
    user = User(
        user_id=new_user_id,
        full_name=req.full_name,
        login_id=req.login_id,
        email=req.email,
        phone=req.phone,
        organization=req.organization or "NHAI HQ",
        department=req.department or "Pavement Engineering",
        scope_region=req.scope_region or "All Regions",
        role=req.role,
        status="active",
        password_hash=hash_password(req.password),
        created_by=current_user.login_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    audit = AuditLog(
        actor_user_id=current_user.user_id,
        actor_login_id=current_user.login_id,
        action="USER_CREATED",
        target_user_id=user.user_id,
        details=f"Created user account {user.login_id} with role {user.role}"
    )
    db.add(audit)
    db.commit()
    
    return user

@router.put("/profile/self")
def update_self_profile(req: UpdateSelfProfileRequest, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    current_user.full_name = req.full_name.strip()
    current_user.email = req.email.strip()
    current_user.phone = req.phone.strip() if req.phone else None
    db.commit()
    
    return {"message": "Profile updated successfully."}
