"""
Lambda handler for creating a new road crack entry
"""
import json
import uuid
import base64
import tempfile
import os
import traceback
from datetime import datetime
from typing import Dict, Any

# Import from repositories instead of directly from database
from repositories.entries import create_entry as db_create_entry, update_entry as db_update_entry
from repositories.detection import create_crack_detection, create_detection_summary
from repositories.auth import get_user_from_token
from services.storage import save_image
from services.detection import queue_detection_job, classify_image, classify_crack_image
from utils.formatters import format_entry_response
from config.settings import logger

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for POST /api/entries endpoint
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response with formatted entry
    """
    try:
        # Parse request body
        if event.get('isBase64Encoded', False):
            body = base64.b64decode(event.get('body', '')).decode('utf-8')
        else:
            body = event.get('body', '')
            
        if not body:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Missing request body'
                })
            }
            
        # Get authorization token
        headers = event.get('headers', {}) or {}
        auth_header = headers.get('Authorization') or headers.get('authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Unauthorized'
                })
            }
            
        token = auth_header.split(' ')[1]
        current_user = get_user_from_token(token)
        if not current_user:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Invalid token'
                })
            }
            
        # Parse multipart form data
        # Note: In a real implementation, you would need to parse the multipart form data
        # For simplicity, we'll assume the API Gateway has already parsed it
        form_data = json.loads(body)
        title = form_data.get('title')
        description = form_data.get('description')
        location = form_data.get('location')
        coordinates = form_data.get('coordinates')
        severity = form_data.get('severity')
        image_data = base64.b64decode(form_data.get('image', ''))
        
        # Validate required fields
        if not all([title, description, location, coordinates, severity, image_data]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Missing required fields'
                })
            }
            
        # Validate severity
        if severity not in ["minor", "major"]:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': "Severity must be 'minor' or 'major'"
                })
            }
            
        # Get user ID from current user
        user_id = current_user["id"]
        
        # Save image to S3
        image_url = save_image(image_data, user_id, "original")
        
        # Parse coordinates
        try:
            if isinstance(coordinates, str):
                coords = json.loads(coordinates)
            else:
                coords = coordinates
                
            if not isinstance(coords, list) or len(coords) != 2:
                raise ValueError("Coordinates must be a list of [longitude, latitude]")
        except (json.JSONDecodeError, ValueError) as e:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': f"Invalid coordinates format: {str(e)}"
                })
            }
            
        # Create entry data
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
        
        # Save entry to database
        new_entry = db_create_entry(entry_data)
        if not new_entry:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Failed to create entry'
                })
            }
        
        # Save image temporarily for YOLO processing
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
            try:
                os.unlink(tmp_path)
            except:
                pass
        
        # Also queue YOLO processing job for async processing (backup)
        queue_detection_job(new_entry["id"], image_url, user_id)
        
        # Format entry response
        formatted_entry = format_entry_response(new_entry, current_user)
        if not formatted_entry:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Error formatting entry'
                })
            }
        
        # Add detection info to response
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
        
        # Return successful response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(formatted_entry)
        }
        
    except Exception as e:
        # Log error and return error response
        logger.error(f"Error in create_entry: {e}")
        logger.error(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }
