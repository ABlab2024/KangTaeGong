from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.v1.endpoints import threats, auth, users, simulation, survey, admin, tracking


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler - initialize DB on startup"""
    from app.db.init_db import init_db, seed_categories
    await init_db()
    await seed_categories()
    yield


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "KangTaeGong API is running", "version": "MVP 1.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# API Routes
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(threats.router, prefix="/api/v1", tags=["threats"])
app.include_router(simulation.router, prefix="/api/v1", tags=["simulation"])
app.include_router(survey.router, prefix="/api/v1/survey", tags=["survey"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(tracking.router, prefix="/api/v1/track", tags=["tracking"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8002, reload=True)
