from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.database.database import get_db
from app.database.models import User, UserPermission, Role, Permission, AuditLog
from app.api.auth import get_current_user_from_token

router = APIRouter(prefix="/permissions", tags=["Permissions & Roles"])

class UpdateUserPermissionsRequest(BaseModel):
    permissions: List[str]

@router.get("/roles")
def get_all_roles(db: Session = Depends(get_db)):
    roles = db.query(Role).all()
    if not roles:
        return [
            {"id": 1, "name": "SUPER_ADMIN", "description": "Full System Access"},
            {"id": 2, "name": "SUPERVISOR", "description": "Regional Reviewer & Approver"},
            {"id": 3, "name": "OPERATOR", "description": "Field Survey Operator"},
            {"id": 4, "name": "VIEWER", "description": "Read Only View Access"}
        ]
    return [{"id": r.id, "name": r.name, "description": r.description} for r in roles]

@router.get("/user/{user_id}")
def get_user_permissions(user_id: str, db: Session = Depends(get_db)):
    perms = db.query(UserPermission.permission_code).filter(UserPermission.user_id == user_id).all()
    return {"user_id": user_id, "permissions": [p[0] for p in perms]}

@router.put("/user/{user_id}")
def update_user_permissions(user_id: str, req: UpdateUserPermissionsRequest, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    if current_user.role not in ["SUPER_ADMIN", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Permission denied. Only Super Admin can modify user permissions.")
    
    db.query(UserPermission).filter(UserPermission.user_id == user_id).delete()
    
    for perm_code in req.permissions:
        up = UserPermission(user_id=user_id, permission_code=perm_code)
        db.add(up)
    
    db.commit()
    
    audit = AuditLog(
        actor_user_id=current_user.user_id,
        actor_login_id=current_user.login_id,
        action="UPDATE_PERMISSIONS",
        target_user_id=user_id,
        details=f"Updated permissions for user {user_id}"
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Permissions updated successfully.", "user_id": user_id, "permissions": req.permissions}
