from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from app.core.config import settings
from app.api.v1.endpoints import threats, auth, users, simulation, survey, admin, tracking


app = FastAPI(title=settings.PROJECT_NAME)

# CORS for frontend (Updated for Netlify)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8520",
        "http://127.0.0.1:8520",
    ],
    allow_origin_regex=r"https://.*\.netlify\.app|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "KangTaeGong API is running (Serverless)", "version": "MVP 1.0"}


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


# Debugging: Catch-all route to inspect paths on Netlify
@app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def catch_all(request: Request, path_name: str):
    return {
        "status": "404 Main Catch-all",
        "message": "The requested path was not found in defined routers.",
        "received_path": path_name,
        "method": request.method,
        "original_scope_path": request.scope.get("path"),
        "root_path": request.scope.get("root_path"),
        "headers": dict(request.headers),
    }


# Netlify Functions Handler
handler = Mangum(app, lifespan="off")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8002, reload=True)
