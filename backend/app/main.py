from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.api import auth, users, permissions, audit, health
from app.database.database import engine, Base, SessionLocal
from app.database.models import User, UserPermission, AuditLog
from app.core.security import hash_password
from app.utils.logger import logger

logger.info("Initializing Auth Backend database schemas...")
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Auth Database tables initialized.")
except Exception as e:
    logger.error(f"Failed to auto-create database tables: {e}")

def seed_initial_users():
    db = SessionLocal()
    try:
        super_admin = db.query(User).filter((User.login_id == "anoop.admin") | (User.user_id == "USR-001")).first()
        if not super_admin:
            hashed = hash_password("admin123")
            admin_user = User(
                user_id="USR-001",
                full_name="Anoop Kumar",
                login_id="anoop.admin",
                email="a.kumar@nhai.gov.in",
                phone="+91 98765 43210",
                organization="NHAI HQ",
                department="Pavement Engineering & Edge AI",
                role="SUPER_ADMIN",
                status="active",
                password_hash=hashed,
                force_password_change=0
            )
            db.add(admin_user)
            db.commit()
            
            audit_entry = AuditLog(
                actor_user_id="SYSTEM",
                actor_login_id="system.seed",
                action="INITIAL_SUPER_ADMIN_CREATED",
                target_user_id="USR-001",
                details="Seeded initial Super Admin account (anoop.admin)."
            )
            db.add(audit_entry)
            db.commit()
            logger.info("Seeded initial Super Admin account 'anoop.admin' (USR-001).")

        if db.query(User).count() < 3:
            sample_users = [
                ("USR-002", "Sivesh Jha", "sivesh.jha", "sivesh.jha@nhai.gov.in", "NHAI AP", "Field Operations", "OPERATOR", "active"),
                ("USR-003", "Prasad Mandava", "p.mandava", "p.mandava@pwd.ap.gov.in", "AP PWD", "Road Safety Dept", "SUPERVISOR", "active"),
                ("USR-004", "Ramesh G.", "ramesh.g", "ramesh.g@dats.ai", "DATS Contractor", "AI Inspections", "OPERATOR", "inactive"),
                ("USR-005", "Director General", "dg.morth", "dg@morth.gov.in", "MoRTH", "Executive Council", "VIEWER", "active")
            ]
            for uid, name, lid, email, org, dept, role, st in sample_users:
                if not db.query(User).filter((User.login_id == lid) | (User.user_id == uid)).first():
                    u = User(
                        user_id=uid,
                        full_name=name,
                        login_id=lid,
                        email=email,
                        organization=org,
                        department=dept,
                        role=role,
                        status=st,
                        password_hash=hash_password("password123"),
                        force_password_change=0
                    )
                    db.add(u)
            db.commit()
            logger.info("Seeded initial sample user accounts.")
    except Exception as e:
        logger.error(f"Error seeding initial database users: {e}")
    finally:
        db.close()

seed_initial_users()

app = FastAPI(
    title="DATS NIRIKSHAN Authentication Service",
    description="Authentication & User Management API service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(permissions.router, prefix="/api")
app.include_router(audit.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "DATS NIRIKSHAN Auth API Service", "status": "running"}
