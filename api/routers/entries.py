from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Query
from typing import Optional, List
import json
import logging
import uuid
from datetime import datetime
from models import RoadCrackUpdate
from database import get_all_entries, get_entry_by_id, get_detection_summary, create_entry as db_create_entry, update_entry as db_update_entry, delete_entry as db_delete_entry, get_user
from services.storage import save_image
from services.detection import queue_detection_job, classify_crack_image
from utils import format_entry_response
from routers.auth import get_current_user
from config import logger
import traceback

# Import detection database functions
from database.operations import (
    create_crack_detection, 
    create_detection_summary,
    get_detection_summary
)

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
            
        # Create entry data first
        entry_id = str(uuid.uuid4())
        entry_data = {
            "id": entry_id,
            "title": title,
            "description": description,
            "location": location,
            "coordinates": coords,
            "severity": severity,
            "type": "unknown",  # Will be updated after AI analysis
            "image_url": image_url,
            "user_id": user_id,
            "created_at": datetime.now().isoformat()
        }
        
        # Save entry to database immediately
        new_entry = db_create_entry(entry_data)
        if not new_entry:
            raise HTTPException(status_code=500, detail="Failed to create entry")
        
        # Run YOLO detection immediately for better UX
        from services.detection import classify_image
        
        # Save image temporarily for YOLO processing
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
            tmp_file.write(image_data)
            tmp_path = tmp_file.name
        
        try:
            # Run YOLO detection
            detection_result = classify_image(tmp_path, user_id)
            
            # Determine primary crack type from detections
            if detection_result["total_cracks"] > 0:
                # Get the most common crack type by count
                crack_types = detection_result["crack_types"]
                if crack_types:
                    # Find crack type with highest count
                    primary_crack_type = max(crack_types.keys(), key=lambda x: crack_types[x]["count"])
                else:
                    primary_crack_type = "unknown"
            else:
                primary_crack_type = "no_cracks"
            
            # Update entry with AI results
            update_data = {"type": primary_crack_type}
            if detection_result.get("classified_image_url"):
                update_data["classified_image_url"] = detection_result["classified_image_url"]
            
            updated_entry = db_update_entry(entry_id, update_data)
            if updated_entry:
                new_entry = updated_entry
                logger.info(f"Updated entry {entry_id} with detection results: type={primary_crack_type}, classified_image_url={detection_result.get('classified_image_url')}")
                
                # Save individual detections to database
                for detection in detection_result.get("detections", []):
                    detection_data = {
                        "id": str(uuid.uuid4()),
                        "road_crack_id": entry_id,
                        "crack_type": detection["label"],
                        "confidence": detection["confidence"],
                        "x1": detection["x1"],
                        "y1": detection["y1"],
                        "x2": detection["x2"],
                        "y2": detection["y2"],
                        "created_at": datetime.now().isoformat()
                    }
                    create_crack_detection(detection_data)
                    
                # Save detection summary to database
                summary_data = {
                    "id": str(uuid.uuid4()),
                    "road_crack_id": entry_id,
                    "total_cracks": detection_result["total_cracks"],
                    "crack_types": detection_result["crack_types"],
                    "created_at": datetime.now().isoformat()
                }
                create_detection_summary(summary_data)
                logger.info(f"Saved detection results to database for entry {entry_id}")
                
        except Exception as e:
            logger.error(f"Error running YOLO detection: {e}")
            logger.error(f"Exception details: {traceback.format_exc()}")
            # Fallback to simple classification
            from services.detection import classify_crack_image
            crack_type = classify_crack_image(image_data)
            update_data = {"type": crack_type}
            updated_entry = db_update_entry(entry_id, update_data)
            if updated_entry:
                new_entry = updated_entry
            # Set fallback detection result for response
            detection_result = {
                "total_cracks": 1,
                "crack_types": {crack_type: {"count": 1, "avg_confidence": 85.0}},
                "detections": [],
                "classified_image_url": None
            }
            
            # Save fallback detection summary to database
            summary_data = {
                "id": str(uuid.uuid4()),
                "road_crack_id": entry_id,
                "total_cracks": 1,
                "crack_types": {crack_type: {"count": 1, "avg_confidence": 85.0}},
                "created_at": datetime.now().isoformat()
            }
            create_detection_summary(summary_data)
            logger.info(f"Saved fallback detection summary for entry {entry_id}")
        finally:
            # Clean up temp file
            import os
            try:
                os.unlink(tmp_path)
            except:
                pass
        
        # Also queue YOLO processing job for async processing (backup)
        queue_detection_job(new_entry["id"], image_url, user_id)
        
        # Use current_user data instead of db lookup
        formatted_entry = format_entry_response(new_entry, current_user)
        if not formatted_entry:
            raise HTTPException(status_code=500, detail="Error formatting entry")
        
        # Return response with detection results if available
        if 'detection_result' in locals() and detection_result:
            formatted_entry["detection_info"] = {
                "total_cracks": detection_result["total_cracks"],
                "crack_types": detection_result["crack_types"],
                "detections": detection_result.get("detections", []),
                "status": "completed"
            }
        else:
            formatted_entry["detection_info"] = {
                "total_cracks": 0,
                "crack_types": {},
                "detections": [],
                "status": "processing"
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
        updated_entry = db_update_entry(entry_id, update_data)
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
        success = db_delete_entry(entry_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete entry")
        
        return {"message": "Entry deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))
