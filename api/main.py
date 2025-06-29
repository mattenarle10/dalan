from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import json
from datetime import datetime
import uuid
import logging
from typing import List
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
import numpy as np
import cv2
import os
import uuid
import base64
import aiohttp
import uvicorn 
from dotenv import load_dotenv
from models import RoadCrackCreate, RoadCrackResponse, RoadCrackUpdate, User
import database as db
from utils import classify_crack_image, save_image, format_entry_response

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set absolute path to the model file
model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../model/YOLOv8_Small_RDD.pt"))
logger.info(f"Loading YOLO model from: {model_path}")

# Try to load YOLO model
try:
    model = YOLO(model_path)
    USE_YOLO = True
    logger.info("YOLO model loaded successfully")
except Exception as e:
    logger.warning(f"Could not load YOLO model: {e}")
    model = None
    USE_YOLO = False

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
                    # Get detection summary from database
                    detection_summary = db.get_detection_summary(entry["id"])
                    
                    # Add detection information to the response if available
                    if detection_summary:
                        formatted_entry["detection_info"] = {
                            "total_cracks": detection_summary["total_cracks"],
                            "crack_types": {}
                        }
                        
                        # Format crack types information for the response
                        for crack_type, info in detection_summary["crack_types"].items():
                            formatted_entry["detection_info"]["crack_types"][crack_type] = {
                                "count": info["count"],
                                "avg_confidence": round(info["avg_confidence"] * 100, 2)  # Convert to percentage
                            }
                    
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
        
        # Get detection summary from database
        detection_summary = db.get_detection_summary(entry_id)
        
        # Add detection information to the response if available
        if detection_summary:
            formatted_entry["detection_info"] = {
                "total_cracks": detection_summary["total_cracks"],
                "crack_types": {}
            }
            
            # Format crack types information for the response
            for crack_type, info in detection_summary["crack_types"].items():
                formatted_entry["detection_info"]["crack_types"][crack_type] = {
                    "count": info["count"],
                    "avg_confidence": round(info["avg_confidence"] * 100, 2)  # Convert to percentage
                }
            
        return formatted_entry
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
async def classify_image(image: str, user_id: str = None):
    # """
    # Classify a road crack image
    
    # - **image**: Image file to classify
    # """
    # try:
    #     image_data = await image.read()
    #     crack_type = classify_crack_image(image_data)
    #     return {"type": crack_type, "confidence": 0.92}  # Mock confidence score
    # except Exception as e:
    #     logger.error(f"Error in classify_image: {e}")
    #     raise HTTPException(status_code=500, detail=str(e))
    # Download image from URL
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(image) as resp:
                if resp.status != 200:
                    return JSONResponse(content={"error": "Failed to download image"}, status_code=400)
                img_bytes = await resp.read()

        # Convert image bytes to OpenCV format
        img_array = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if img is None:
            return JSONResponse(content={"error": "Invalid image format"}, status_code=400)

        # Save image temporarily
        tmp_filename = f"temp_{uuid.uuid4().hex}.jpg"
        cv2.imwrite(tmp_filename, img)

        # Run YOLO prediction
        results = model.predict(source=tmp_filename, conf=0.25)
        os.remove(tmp_filename)

        detections = []
        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = model.names[class_id]

                # Draw bounding box and label
                cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 0), 2)
                label = f"{class_name} {confidence:.2f}"
                cv2.putText(img, label, (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)

                detections.append({
                    "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                    "confidence": confidence,
                    "class": class_id,
                    "label": class_name
                })

        # Encode result image to jpg and save it
        _, buffer = cv2.imencode('.jpg', img)
        classified_image_url = save_image(buffer.tobytes(), user_id)
        
        # Prepare detection summary
        detection_summary = {
            "classified_image_url": classified_image_url,
            "detections": detections,
            "total_cracks": len(detections),
            "crack_types": {}
        }
        
        # Count occurrences of each crack type and calculate average confidence
        for detection in detections:
            crack_type = detection["label"]
            confidence = detection["confidence"]
            
            if crack_type not in detection_summary["crack_types"]:
                detection_summary["crack_types"][crack_type] = {
                    "count": 1,
                    "confidences": [confidence],
                    "avg_confidence": confidence
                }
            else:
                detection_summary["crack_types"][crack_type]["count"] += 1
                detection_summary["crack_types"][crack_type]["confidences"].append(confidence)
                # Update average confidence
                confidences = detection_summary["crack_types"][crack_type]["confidences"]
                detection_summary["crack_types"][crack_type]["avg_confidence"] = sum(confidences) / len(confidences)
        
        return detection_summary

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

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

        # Classify the image and get the detection summary
        detection_summary = await classify_image(image_url, user_id)
        
        # Extract classified image URL and detection info
        classified_image_url = detection_summary["classified_image_url"]
        detections = detection_summary["detections"]
        crack_types = detection_summary["crack_types"]
        
        # Determine the primary crack type based on highest confidence
        primary_crack_type = "No cracks detected"  # Default for zero detections
        highest_confidence = 0
        
        # Only update if we have detections
        if len(crack_types) > 0:
            for crack_type, info in crack_types.items():
                if info["avg_confidence"] > highest_confidence:
                    highest_confidence = info["avg_confidence"]
                    primary_crack_type = crack_type
        
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
            "type": primary_crack_type,  # Use the primary crack type from detection
            "image_url": image_url,
            "classified_image_url": classified_image_url,
            "user_id": user_id,  # This should be a UUID in the database
            "created_at": datetime.now().isoformat()
        }
        
        # Save entry to database
        new_entry = db.create_entry(entry_data)
        if not new_entry:
            raise HTTPException(status_code=500, detail="Failed to create entry")
            
        # Save individual crack detections to database
        for detection in detections:
            detection_data = {
                "road_crack_id": new_entry["id"],
                "crack_type": detection["label"],
                "confidence": detection["confidence"],
                "x1": detection["x1"],
                "y1": detection["y1"],
                "x2": detection["x2"],
                "y2": detection["y2"]
            }
            db.create_crack_detection(detection_data)
            
        # Save detection summary to database
        summary_data = {
            "road_crack_id": new_entry["id"],
            "total_cracks": detection_summary["total_cracks"],
            "crack_types": crack_types
        }
        db.create_detection_summary(summary_data)
        
        # Get user info
        user = db.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        formatted_entry = format_entry_response(new_entry, user)
        if not formatted_entry:
            raise HTTPException(status_code=500, detail="Error formatting entry")
        
        # Add detection information to the response
        formatted_entry["detection_info"] = {
            "total_cracks": detection_summary["total_cracks"],
            "crack_types": {}
        }
        
        # Format crack types information for the response
        for crack_type, info in crack_types.items():
            formatted_entry["detection_info"]["crack_types"][crack_type] = {
                "count": info["count"],
                "avg_confidence": round(info["avg_confidence"] * 100, 2)  # Convert to percentage
            }
            
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
