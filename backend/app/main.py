from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, projects, dashboard, analysis

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Version
API_V1_PREFIX = "/api/v1"

# Include routers with v1 prefix
app.include_router(auth.router, prefix=f"{API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(projects.router, prefix=f"{API_V1_PREFIX}/projects", tags=["Projects"])
app.include_router(dashboard.router, prefix=f"{API_V1_PREFIX}/dashboard", tags=["Dashboard"])
app.include_router(analysis.router, prefix=f"{API_V1_PREFIX}/analysis", tags=["Analysis"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Visibility Tracker API",
        "version": "1.0.0",
        "api_version": "v1",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
