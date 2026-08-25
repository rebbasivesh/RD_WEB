from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.database import get_db
from app.database.models import User, UserPermission, AuditLog
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.utils.logger import logger

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    login_id: str
    password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

def get_current_user_from_token(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authentication header")
    
    token = authorization.replace("Bearer ", "").strip()
    payload = decode_access_token(token)
    if not payload or "login_id" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session token")
    
    user = db.query(User).filter(User.login_id == payload["login_id"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found")
    
    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Account is currently {user.status}")
    
    return user

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    login_id_clean = req.login_id.strip()
    user = db.query(User).filter((User.login_id == login_id_clean) | (User.email == login_id_clean)).first()
    
    if not user:
        logger.warning(f"Auth: Login attempt failed for non-existent user '{login_id_clean}'")
        raise HTTPException(status_code=400, detail="Invalid user ID or password")
    
    if user.status == "locked":
        raise HTTPException(status_code=403, detail="Account is temporarily locked due to multiple failed login attempts. Contact Super Admin.")
    
    if user.status == "inactive":
        raise HTTPException(status_code=403, detail="Account is inactive/suspended. Access denied.")
    
    if not verify_password(req.password, user.password_hash):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.status = "locked"
            user.locked_until = datetime.utcnow()
            logger.warning(f"Auth: Account '{user.login_id}' locked due to 5 failed login attempts.")
            
            audit = AuditLog(
                actor_user_id=user.user_id,
                actor_login_id=user.login_id,
                action="ACCOUNT_LOCKED",
                target_user_id=user.user_id,
                details="Account locked after 5 consecutive failed login attempts."
            )
            db.add(audit)
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid user ID or password")
    
    user.failed_login_attempts = 0
    user.last_login_at = datetime.utcnow()
    db.commit()
    
    token = create_access_token({"user_id": user.user_id, "login_id": user.login_id, "role": user.role})
    
    perms = db.query(UserPermission.permission_code).filter(UserPermission.user_id == user.user_id).all()
    perm_codes = [p[0] for p in perms]
    
    audit = AuditLog(
        actor_user_id=user.user_id,
        actor_login_id=user.login_id,
        action="LOGIN_SUCCESS",
        target_user_id=user.user_id,
        details="User authenticated successfully."
    )
    db.add(audit)
    db.commit()
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user.user_id,
            "full_name": user.full_name,
            "login_id": user.login_id,
            "email": user.email,
            "role": user.role,
            "organization": user.organization,
            "department": user.department,
            "scope_region": user.scope_region,
            "permissions": perm_codes
        }
    }

@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    perms = db.query(UserPermission.permission_code).filter(UserPermission.user_id == current_user.user_id).all()
    perm_codes = [p[0] for p in perms]
    
    return {
        "user_id": current_user.user_id,
        "full_name": current_user.full_name,
        "login_id": current_user.login_id,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
        "organization": current_user.organization,
        "department": current_user.department,
        "scope_region": current_user.scope_region,
        "status": current_user.status,
        "permissions": perm_codes,
        "last_login_at": current_user.last_login_at.isoformat() if current_user.last_login_at else None
    }

@router.post("/change-password")
def change_password(req: ChangePasswordRequest, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    if not verify_password(req.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password entered is incorrect.")
    
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")
    
    current_user.password_hash = hash_password(req.new_password)
    current_user.force_password_change = 0
    db.commit()
    
    audit = AuditLog(
        actor_user_id=current_user.user_id,
        actor_login_id=current_user.login_id,
        action="PASSWORD_CHANGE",
        target_user_id=current_user.user_id,
        details="User successfully changed password."
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Password changed successfully."}
