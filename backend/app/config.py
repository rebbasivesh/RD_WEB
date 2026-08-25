import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    BACKEND_ROOT: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATA_ROOT: str = os.getenv("DATA_ROOT", os.path.join(BACKEND_ROOT, "data"))
    LOG_DIR: str = os.getenv("LOG_DIR", os.path.join(BACKEND_ROOT, "logs"))
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BACKEND_ROOT, 'hma_auth.db')}")
    
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
        extra = "ignore"

settings = Settings()
