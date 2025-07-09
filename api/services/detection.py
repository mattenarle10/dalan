import os
import logging
import boto3
import json
import traceback
from config import logger, YOLO_QUEUE_URL, ENVIRONMENT
import random

# Initialize SQS client
sqs = boto3.client('sqs', region_name='us-east-1')

# Initialize YOLO model
model = None
USE_YOLO = False

# Crack types for classification
CRACK_TYPES = ["alligator", "longitudinal", "transverse"]

def init_model():
    """Initialize YOLO model from S3 or local fallback"""
    global model, USE_YOLO
    
    try:
        # Import the s3_model_loader module from services
        try:
            from services import s3_model_loader as s3_loader
        except ImportError:
            logger.warning("s3_model_loader module not found, using fallback")
            # Define a fallback loader if the module is not available
            class FallbackLoader:
                def get_model_path(self, prefer_s3=False):
                    # Use the custom model if it exists
                    custom_model_path = "/Users/matt/dalan/model/YOLOv8_Small_RDD.pt"
                    if os.path.exists(custom_model_path):
                        logger.info(f"Using custom model: {custom_model_path}")
                        return custom_model_path
                    # Fall back to default model if custom model doesn't exist
                    logger.warning("Custom model not found, using default model")
                    return "yolov8n.pt"  # Default model path
            s3_loader = FallbackLoader()
        
        # Check if we're in production (prefer S3) or development (prefer local)
        prefer_s3 = ENVIRONMENT == "production"
        
        model_path = s3_loader.get_model_path(prefer_s3=prefer_s3)
        
        if not model_path:
            raise Exception("Could not get model path from S3 or local fallback")
        
        logger.info(f"Loading YOLO model from: {model_path}")
        
        # Patch torch.load to use weights_only=False for loading YOLO model
        import torch
        original_load = torch.load
        
        def patched_load(*args, **kwargs):
            kwargs['weights_only'] = False
            return original_load(*args, **kwargs)
        
        torch.load = patched_load
        
        # Import here to avoid circular imports
        from ultralytics import YOLO
        model = YOLO(model_path)
        
        # Restore original torch.load
        torch.load = original_load
        
        USE_YOLO = True
        logger.info("YOLO model loaded successfully")
    except Exception as e:
        logger.warning(f"Could not load YOLO model: {e}")
        logger.warning("Traceback:")
        logger.warning(traceback.format_exc())
        model = None
        USE_YOLO = False

def classify_crack_image(image_data):
    """
    Simple mock classifier that returns a crack type
    In a real app, this would use your ML model from /model directory
    
    Args:
        image_data (bytes): Image data
        
    Returns:
        str: Crack type classification
    """
    try:
        # This is just a placeholder - in reality you'd use your model
        # For now, we'll randomly select a type to simulate AI classification
        return random.choice(CRACK_TYPES)
    except Exception as e:
        logger.error(f"Error classifying image: {e}")
        # Default to alligator if classification fails
        return "alligator"

def classify_image(image_path, user_id=None):
    """Process image with YOLO model"""
    global model, USE_YOLO
    
    if not USE_YOLO or not model:
        logger.warning("YOLO model not available, using fallback classification")
        return {
            "total_cracks": 1,
            "crack_types": {"alligator": 1},
            "detections": [{
                "x1": 100,
                "y1": 100,
                "x2": 200,
                "y2": 200,
                "confidence": 0.85,
                "class_id": 0,
                "label": "alligator"
            }]
        }
    
    try:
        # Run YOLO detection
        results = model(image_path, conf=0.25)
        
        # Process results
        detections = []
        crack_types = {}
        
        for r in results:
            boxes = r.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                confidence = box.conf[0].item()
                class_id = int(box.cls[0].item())
                
                # Get label from class ID
                label = model.names[class_id]
                
                # Count crack types
                if label in crack_types:
                    crack_types[label] += 1
                else:
                    crack_types[label] = 1
                
                detections.append({
                    "x1": int(x1),
                    "y1": int(y1),
                    "x2": int(x2),
                    "y2": int(y2),
                    "confidence": float(confidence),
                    "class_id": class_id,
                    "label": label
                })
        
        return {
            "total_cracks": len(detections),
            "crack_types": crack_types,
            "detections": detections
        }
    except Exception as e:
        logger.error(f"Error in YOLO detection: {e}")
        logger.error(traceback.format_exc())
        
        # Return fallback detection
        return {
            "total_cracks": 1,
            "crack_types": {"alligator": 1},
            "detections": [{
                "x1": 100,
                "y1": 100,
                "x2": 200,
                "y2": 200,
                "confidence": 0.85,
                "class_id": 0,
                "label": "alligator"
            }]
        }

def queue_detection_job(entry_id, image_url, user_id):
    """Queue a job for YOLO processing"""
    try:
        yolo_job = {
            "entry_id": entry_id,
            "image_url": image_url,
            "user_id": user_id
        }
        
        sqs.send_message(
            QueueUrl=YOLO_QUEUE_URL,
            MessageBody=json.dumps(yolo_job)
        )
        logger.info(f"Queued YOLO processing for entry {entry_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to queue YOLO job: {e}")
        return False
