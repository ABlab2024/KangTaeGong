from fastapi import FastAPI
from app.core.config import settings
from app.api.v1.endpoints import threats

app = FastAPI(title=settings.PROJECT_NAME)

@app.get("/")
def root():
    return {"message": "KangTaeGong API is running"}

app.include_router(threats.router, prefix="/api/v1", tags=["threats"])
