from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import AuditLog
from app.api.auth import get_current_user_from_token

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("/logs")
def get_audit_logs(limit: int = 100, current_user = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
            "actor_user_id": l.actor_user_id,
            "actor_login_id": l.actor_login_id,
            "action": l.action,
            "target_user_id": l.target_user_id,
            "details": l.details,
            "ip_address": l.ip_address
        }
        for l in logs
    ]
