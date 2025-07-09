from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Query
from typing import Optional, List
import json
import logging
import uuid
from datetime import datetime
from models import RoadCrackUpdate
from supabase import get_all_entries, get_entry_by_id, get_detection_summary, create_entry, update_entry, delete_entry, get_user
from services.storage import save_image
from services.detection import queue_detection_job, classify_crack_image
from utils import format_entry_response
from routers.auth import get_current_user
from config import logger

router = APIRouter(prefix="/api/entries", tags=["entries"])

@router.get("/")
async def get_entries(
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
        entries = get_all_entries(user_id, severity, type)
        
        # Format entries with user data
        formatted_entries = []
        for entry in entries:
            user = get_user(entry["user_id"])
            if not user:
                continue
                
            formatted_entry = format_entry_response(entry, user)
            if formatted_entry:
                formatted_entries.append(formatted_entry)
                
        return formatted_entries
    except Exception as e:
        logger.error(f"Error in get_entries: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{entry_id}")
async def get_entry(entry_id: str):
    """
    Get a specific road crack entry by ID
    
    - **entry_id**: ID of the entry to retrieve
    """
    try:
        # Get entry
        entry = get_entry_by_id(entry_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Entry not found")
            
        # Get user info
        user = get_user(entry["user_id"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Format entry
        formatted_entry = format_entry_response(entry, user)
        if not formatted_entry:
            raise HTTPException(status_code=500, detail="Error formatting entry")
            
        # Get detection summary
        detection_summary = get_detection_summary(entry_id)
        
        # Add detection info to response
        if detection_summary:
            formatted_entry["detection_info"] = {
                "total_cracks": detection_summary["total_cracks"],
                "crack_types": detection_summary["crack_types"],
                "status": "completed"
            }
        else:
            # No detection info yet
            formatted_entry["detection_info"] = {
                "total_cracks": 0,
                "crack_types": {},
                "status": "pending"
            }
            
        return formatted_entry
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_entry(
    title: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    coordinates: str = Form(...),  # JSON string [lng, lat]
    severity: str = Form(...),
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new road crack entry
    
    - **title**: Title of the entry
    - **description**: Description of the road crack
    - **location**: Location name
    - **coordinates**: JSON string of [longitude, latitude]
    - **severity**: Severity of the crack (minor/major)
    - **image**: Image file of the road crack
    """
    try:
        # Validate severity
        if severity not in ["minor", "major"]:
            raise HTTPException(status_code=400, detail="Severity must be 'minor' or 'major'")
            
        # Read image data
        image_data = await image.read()
        
        # Get user ID from current user
        user_id = current_user["id"]
        
        # Save image to S3
        image_url = save_image(image_data, user_id, "original")
        
        # Parse coordinates
        try:
            coords = json.loads(coordinates)
            if not isinstance(coords, list) or len(coords) != 2:
                raise ValueError("Coordinates must be a list of [longitude, latitude]")
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid coordinates format")
            
        # Classify crack type using simple classifier
        crack_type = classify_crack_image(image_data)
        
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
            "user_id": user_id,
            "created_at": datetime.now().isoformat()
        }
        
        # Save entry to database immediately
        new_entry = create_entry(entry_data)
        if not new_entry:
            raise HTTPException(status_code=500, detail="Failed to create entry")
        
        # Queue YOLO processing job
        queue_detection_job(new_entry["id"], image_url, user_id)
        
        # Use current_user data instead of db lookup
        formatted_entry = format_entry_response(new_entry, current_user)
        if not formatted_entry:
            raise HTTPException(status_code=500, detail="Error formatting entry")
        
        # Return response immediately (no detection info for now)
        formatted_entry["detection_info"] = {
            "total_cracks": 0,
            "crack_types": {},
            "status": "processing"  # Indicate YOLO is processing
        }
            
        return formatted_entry
    except Exception as e:
        logger.error(f"Error in create_entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{entry_id}")
async def update_entry(entry_id: str, entry_update: RoadCrackUpdate):
    """
    Update an existing road crack entry
    
    - **entry_id**: ID of the entry to update
    - **entry_update**: Updated entry data
    """
    try:
        # Check if entry exists
        existing_entry = get_entry_by_id(entry_id)
        if not existing_entry:
            raise HTTPException(status_code=404, detail="Entry not found")
        
        # Update only provided fields
        update_data = {k: v for k, v in entry_update.dict().items() if v is not None}
        
        # Update entry
        updated_entry = update_entry(entry_id, update_data)
        if not updated_entry:
            raise HTTPException(status_code=500, detail="Failed to update entry")
        
        # Get user info
        user = get_user(updated_entry["user_id"])
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

@router.delete("/{entry_id}")
async def delete_entry(entry_id: str):
    """
    Delete a road crack entry
    
    - **entry_id**: ID of the entry to delete
    """
    try:
        # Check if entry exists
        existing_entry = get_entry_by_id(entry_id)
        if not existing_entry:
            raise HTTPException(status_code=404, detail="Entry not found")
        
        # Delete entry
        success = delete_entry(entry_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete entry")
        
        return {"message": "Entry deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))
