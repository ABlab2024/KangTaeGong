from fastapi import FastAPI
from app.core.config import settings
from app.api.v1.endpoints import threats, auth, users

app = FastAPI(title=settings.PROJECT_NAME)

@app.get("/")
def root():
    return {"message": "KangTaeGong API is running"}

app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(threats.router, prefix="/api/v1", tags=["threats"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8002, reload=True)
