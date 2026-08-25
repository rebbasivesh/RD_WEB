from fastapi import Request, status
from fastapi.responses import JSONResponse

class HMAException(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

async def hma_exception_handler(request: Request, exc: HMAException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "status": "error"}
    )
