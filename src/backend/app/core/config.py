from pathlib import Path
from pydantic_settings import BaseSettings

# Project Root: src/backend/app/core -> app/core -> app -> backend -> src -> KangTaeGong
ROOT_DIR = Path(__file__).resolve().parents[4]

class Settings(BaseSettings):
    PROJECT_NAME: str = "KangTaeGong API"
    DATABASE_URL: str
    SECRET_KEY: str = "changethis"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days

    class Config:
        case_sensitive = True
        env_file = str(ROOT_DIR / ".env")
        extra = "ignore"

settings = Settings()
