from fastapi import APIRouter

router = APIRouter(tags=["Health Check"])

@router.get("/health")
def health_check():
    return {"status": "ok", "service": "DATS Auth Backend"}
