from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, nullable=False) # e.g. USR-001
    full_name = Column(String, nullable=False)
    login_id = Column(String, unique=True, index=True, nullable=False) # e.g. anoop.admin
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    organization = Column(String, default="NHAI HQ")
    department = Column(String, default="Pavement Engineering")
    scope_region = Column(String, default="All Regions")
    role = Column(String, default="VIEWER") # SUPER_ADMIN, SUPERVISOR, OPERATOR, VIEWER
    status = Column(String, default="active") # active, inactive, locked, pending
    password_hash = Column(String, nullable=False)
    force_password_change = Column(Integer, default=0) # 0 = false, 1 = true
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    last_login_ip = Column(String, default="127.0.0.1")
    created_by = Column(String, default="SYSTEM")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False) # SUPER_ADMIN, ADMIN, SUPERVISOR, OPERATOR, VIEWER
    description = Column(String, nullable=True)

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False) # e.g. SURVEY_RECORD, AUDIT_LOG_VIEW
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=True)

class UserPermission(Base):
    __tablename__ = "user_permissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    permission_code = Column(String, nullable=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, server_default=func.now())
    actor_user_id = Column(String, nullable=False)
    actor_login_id = Column(String, nullable=False)
    action = Column(String, nullable=False) # LOGIN, LOGOUT, CREATE_USER, CHANGE_ROLE, etc.
    target_user_id = Column(String, nullable=True)
    details = Column(String, nullable=True)
    ip_address = Column(String, default="127.0.0.1")
