from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import entries, auth, users
from services.detection import init_model
from config import API_TITLE, API_DESCRIPTION, API_VERSION, logger
import logging

# Configure logging for main module
logging.basicConfig(level=logging.INFO)

# Create FastAPI app
app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize YOLO model
init_model()

# Include routers
app.include_router(entries.router)
app.include_router(auth.router)
app.include_router(users.router)

# Root endpoint
@app.get("/")
def read_root():
    """Root endpoint that returns a welcome message"""
    return {"message": "Welcome to Dalan API"}

# Run the application if executed directly
if __name__ == "__main__":
    import uvicorn
    import os
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
