"""
Lambda handler for YOLO detection processing
"""
import json
import base64
import os
import tempfile
from typing import Dict, Any, Optional

from config.settings import logger
from utils.api_gateway import create_api_gateway_response, create_error_response
from domain.models.detection import DetectionResult
from services.detection import process_image, load_model
from services.storage import save_classified_image
from repositories.detection import save_detection_results
from utils.image_processing import decode_base64_image, save_temp_image, cleanup_temp_files

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handler for processing images with YOLO model
    This handler is triggered by SQS events
    
    Args:
        event: SQS event
        context: Lambda context
        
    Returns:
        Processing result
    """
    logger.info("Processing YOLO detection request")
    temp_file_path = None
    
    try:
        # Extract message from SQS event
        records = event.get('Records', [])
        
        if not records:
            logger.error("No records found in SQS event")
            return create_error_response(400, "No records found in event")
            
        # Process the first record
        record = records[0]
        body = json.loads(record.get('body', '{}'))
        
        # Extract data from message
        road_crack_id = body.get('road_crack_id')
        image_data_base64 = body.get('image_data')
        user_id = body.get('user_id')
        
        if not road_crack_id or not image_data_base64 or not user_id:
            logger.error("Missing required fields in message")
            return create_error_response(400, "Missing required fields in message")
            
        # Decode base64 image
        image_data = decode_base64_image(image_data_base64)
        
        if not image_data:
            logger.error("Failed to decode image data")
            return create_error_response(400, "Invalid image data")
            
        # Save image to temporary file
        temp_file_path = save_temp_image(image_data)
        
        if not temp_file_path:
            logger.error("Failed to save temporary image file")
            return create_error_response(500, "Failed to save temporary image")
            
        # Load YOLO model
        model = load_model()
        
        if not model:
            logger.error("Failed to load YOLO model")
            return create_error_response(500, "Failed to load detection model")
            
        # Process image with YOLO model
        detection_result = process_image(model, temp_file_path, road_crack_id)
        
        if not detection_result:
            logger.error("Failed to process image with YOLO model")
            return create_error_response(500, "Failed to process image")
            
        # Save classified image to S3
        classified_image_url = save_classified_image(
            image_data, 
            user_id, 
            detection_result.detections
        )
        
        # Update detection result with classified image URL
        detection_result.classified_image_url = classified_image_url
        
        # Save detection results to database
        save_detection_results(detection_result)
        
        # Return success response
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Image processed successfully",
                "road_crack_id": road_crack_id,
                "classified_image_url": classified_image_url,
                "detection_summary": detection_result.summary.dict()
            })
        }
        
    except Exception as e:
        logger.error(f"Error in YOLO processing handler: {e}")
        return create_error_response(500, f"Internal server error: {str(e)}")
        
    finally:
        # Clean up temporary files
        if temp_file_path:
            cleanup_temp_files(temp_file_path)
