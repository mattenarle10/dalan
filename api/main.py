from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
import json
from datetime import datetime
import uuid
import logging
import os
from dotenv import load_dotenv

# Import our modules
from models import RoadCrackCreate, RoadCrackResponse, RoadCrackUpdate, User
import database as db
from utils import classify_crack_image, save_image, format_entry_response

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Dalan API",
    description="API for the Dalan Road Crack Mapping App",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    """Root endpoint that returns a welcome message"""
    return {"message": "Welcome to Dalan API", "status": "active"}

@app.get("/api/entries")
def get_entries(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    severity: Optional[str] = Query(None, description="Filter by severity (minor/major)"),
    type: Optional[str] = Query(None, description="Filter by crack type")
):
    """
    Get all road crack entries with optional filtering
    
    - **user_id**: Optional filter by user ID
    - **severity**: Optional filter by severity (minor/major)
    - **type**: Optional filter by crack type
    """
    try:
        entries = db.get_all_entries(user_id, severity, type)
        
        # Format response to match frontend expectations
        formatted_entries = []
        for entry in entries:
            user = db.get_user(entry["user_id"])
            if user:
                formatted_entry = format_entry_response(entry, user)
                if formatted_entry:
                    formatted_entries.append(formatted_entry)
        
        return formatted_entries
    except Exception as e:
        logger.error(f"Error in get_entries: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/entries/{entry_id}")
def get_entry(entry_id: str):
    """
    Get a specific road crack entry by ID
    
    - **entry_id**: ID of the entry to retrieve
    """
    try:
        entry = db.get_entry_by_id(entry_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Entry not found")
        
        user = db.get_user(entry["user_id"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        formatted_entry = format_entry_response(entry, user)
        if not formatted_entry:
            raise HTTPException(status_code=500, detail="Error formatting entry")
            
        return formatted_entry
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/entries")
async def create_entry(
    title: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    coordinates: str = Form(...),  # JSON string [lng, lat]
    severity: str = Form(...),
    user_id: str = Form(...),
    image: UploadFile = File(...)
):
    """
    Create a new road crack entry
    
    - **title**: Title of the entry
    - **description**: Description of the road crack
    - **location**: Location name
    - **coordinates**: JSON string of [longitude, latitude]
    - **severity**: Either "minor" or "major"
    - **user_id**: ID of the user creating the entry
    - **image**: Image file of the road crack
    """
    try:
        # Process the image
        image_data = await image.read()
        
        # Classify the image using AI
        crack_type = classify_crack_image(image_data)
        
        # Save the image and get URL
        image_url = save_image(image_data, user_id)
        
        # Parse coordinates from JSON string
        coords = json.loads(coordinates)
        
        # Create entry data
        entry_data = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "location": location,
            "coordinates": coords,
            "severity": severity,
            "type": crack_type,
            "image_url": image_url,
            "user_id": user_id,  # This should be a UUID in the database
            "created_at": datetime.now().isoformat()
        }
        
        # Save to database
        new_entry = db.create_entry(entry_data)
        if not new_entry:
            raise HTTPException(status_code=500, detail="Failed to create entry")
        
        # Get user info
        user = db.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        formatted_entry = format_entry_response(new_entry, user)
        if not formatted_entry:
            raise HTTPException(status_code=500, detail="Error formatting entry")
            
        return formatted_entry
    except Exception as e:
        logger.error(f"Error in create_entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/entries/{entry_id}")
def update_entry(entry_id: str, entry_update: RoadCrackUpdate):
    """
    Update an existing road crack entry
    
    - **entry_id**: ID of the entry to update
    - **entry_update**: Updated entry data
    """
    try:
        # Check if entry exists
        existing_entry = db.get_entry_by_id(entry_id)
        if not existing_entry:
            raise HTTPException(status_code=404, detail="Entry not found")
        
        # Update only provided fields
        update_data = {k: v for k, v in entry_update.dict().items() if v is not None}
        
        # Update entry
        updated_entry = db.update_entry(entry_id, update_data)
        if not updated_entry:
            raise HTTPException(status_code=500, detail="Failed to update entry")
        
        # Get user info
        user = db.get_user(updated_entry["user_id"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        formatted_entry = format_entry_response(updated_entry, user)
        if not formatted_entry:
            raise HTTPException(status_code=500, detail="Error formatting entry")
            
        return formatted_entry
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in update_entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/entries/{entry_id}")
def delete_entry(entry_id: str):
    """
    Delete a road crack entry
    
    - **entry_id**: ID of the entry to delete
    """
    try:
        # Check if entry exists
        existing_entry = db.get_entry_by_id(entry_id)
        if not existing_entry:
            raise HTTPException(status_code=404, detail="Entry not found")
        
        # Delete entry
        success = db.delete_entry(entry_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete entry")
        
        return {"message": "Entry deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/classify")
async def classify_image(image: UploadFile = File(...)):
    """
    Classify a road crack image
    
    - **image**: Image file to classify
    """
    try:
        image_data = await image.read()
        crack_type = classify_crack_image(image_data)
        return {"type": crack_type, "confidence": 0.92}  # Mock confidence score
    except Exception as e:
        logger.error(f"Error in classify_image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/me")
def get_current_user():
    """Get current user (mock implementation)"""
    # In a real app, this would use authentication
    return {
        "id": "user1",
        "name": "Matthew Enarle",
        "email": "matthew@example.com"
    }

# Run the application if executed directly
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(app, host=host, port=port)
