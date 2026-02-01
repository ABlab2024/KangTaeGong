from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings

# Project Root: src/backend/app/core -> app/core -> app -> backend -> src -> KangTaeGong
ROOT_DIR = Path(__file__).resolve().parents[4]

class Settings(BaseSettings):
    PROJECT_NAME: str = "KangTaeGong API"
    
    # Database (SQLite by default)
    DATABASE_URL: str = "sqlite+aiosqlite:///./kangtaegong.db"
    
    # Security
    SECRET_KEY: str = "changethis"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Admin credentials (loaded from .env)
    ADMIN_EMAIL: str = "admin@example.com"  # Override in .env
    ADMIN_PASSWORD: str = "changeme"  # Override in .env
    
    # Gemini AI
    GEMINI_API_KEY: Optional[str] = None
    
    # SMTP (Gmail)
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: Optional[str] = None
    
    # Netlify (for dummy phishing pages)
    NETLIFY_API_TOKEN: Optional[str] = None

    class Config:
        case_sensitive = True
        env_file = str(ROOT_DIR / ".env") if (ROOT_DIR / ".env").exists() else None
        extra = "ignore"

settings = Settings()
