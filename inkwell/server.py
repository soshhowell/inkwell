"""FastAPI backend server for Inkwell"""

from pathlib import Path
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from .database import init_database
from .config import config
from .api import discover_and_register_routers


# Create FastAPI app
app = FastAPI(
    title="Inkwell API",
    description="Backend API for Inkwell application",
    version="0.1.9"
)

# Add CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.frontend_dev_url, config.backend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auto-discover and register API routes
discover_and_register_routers(app)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup"""
    init_database()


# Static file serving for production
package_dir = Path(__file__).parent
frontend_build_dir = package_dir / "frontend" / "build"

if frontend_build_dir.exists():
    # Serve static files from the React build
    app.mount("/static", StaticFiles(directory=frontend_build_dir / "static"), name="static")
    
    # Catch-all route to serve React app for client-side routing
    @app.get("/{full_path:path}")
    async def serve_react_app(request: Request, full_path: str):
        """Serve React app for all non-API routes"""
        # Don't serve React app for API routes
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        # Serve specific files if they exist
        requested_file = frontend_build_dir / full_path
        if requested_file.is_file():
            return FileResponse(requested_file)
        
        # Otherwise, serve index.html for client-side routing
        index_file = frontend_build_dir / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        else:
            raise HTTPException(status_code=404, detail="Frontend build not found")
else:
    # Development route when frontend build doesn't exist
    @app.get("/")
    async def root():
        """Root endpoint when no frontend build exists"""
        return {
            "message": "Inkwell API is running",
            "frontend": "Frontend build not found - run in development mode or build the frontend",
            "api_docs": f"{config.backend_url}/docs"
        }