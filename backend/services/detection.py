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
CRACK_TYPES = ["alligator", "longitudinal", "transverse", "pothole"]

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
    """Process image with YOLO model and generate annotated image"""
    global model, USE_YOLO
    
    if not USE_YOLO or not model:
        logger.warning("YOLO model not available, using fallback classification")
        return {
            "total_cracks": 1,
            "crack_types": {"alligator": {"count": 1, "avg_confidence": 85.0}},
            "detections": [{
                "x1": 100,
                "y1": 100,
                "x2": 200,
                "y2": 200,
                "confidence": 0.85,
                "class_id": 0,
                "label": "alligator"
            }],
            "classified_image_url": None
        }
    
    try:
        # Run YOLO detection
        results = model(image_path, conf=0.25)
        
                        # Process results
        detections = []
        crack_types = {}
        classified_image_url = None
        
        for r in results:
            boxes = r.boxes
            if boxes is not None and len(boxes) > 0:
                # Generate annotated image if detections found
                import tempfile
                import cv2
                import numpy as np
                from services.storage import save_image
                
                # Load original image
                img = cv2.imread(image_path)
                
                # Get image dimensions for adaptive scaling
                img_height, img_width = img.shape[:2]
                
                # Calculate adaptive line thickness and font scale based on image size
                line_thickness = max(2, int(min(img_width, img_height) / 300))
                font_scale = max(0.6, min(img_width, img_height) / 800)
                text_thickness = max(1, line_thickness // 2)
                
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    confidence = box.conf[0].item()
                    class_id = int(box.cls[0].item())
                    
                    # Get label from class ID
                    label = model.names[class_id]
                    
                    # Count crack types and track confidences
                    if label in crack_types:
                        crack_types[label]["count"] += 1
                        crack_types[label]["confidences"].append(confidence)
                    else:
                        crack_types[label] = {
                            "count": 1,
                            "confidences": [confidence]
                        }
                    
                    # Choose color based on crack type for better distinction
                    color_map = {
                        "alligator": (0, 255, 255),      # Yellow
                        "longitudinal": (255, 0, 255),   # Magenta
                        "transverse": (0, 255, 0),       # Green
                        "pothole": (255, 165, 0),        # Orange
                        "Alligator Crack": (0, 255, 255),      # Yellow
                        "Longitudinal Crack": (255, 0, 255),   # Magenta
                        "Transverse Crack": (0, 255, 0),       # Green
                        "Potholes": (255, 165, 0),        # Orange
                    }
                    # Get color for this crack type
                    color = color_map.get(label, (0, 255, 0))  # Default to green
                    
                    # Create label without confidence percentage - just the crack type
                    label = model.names[class_id]
                    
                    # Calculate text size for smaller, cleaner labels
                    text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale * 0.7, text_thickness)[0]
                    text_width, text_height = text_size
                    
                    # Draw filled rectangle behind text for better readability
                    text_bg_pt1 = (int(x1), int(y1) - text_height - 8)
                    text_bg_pt2 = (int(x1) + text_width + 8, int(y1))
                    cv2.rectangle(img, text_bg_pt1, text_bg_pt2, (0, 0, 0), -1)
                    
                    # Draw the detection box with increased thickness
                    cv2.rectangle(img, (int(x1), int(y1)), (int(x2), int(y2)), color, line_thickness)
                    
                    # Draw the label text (smaller and cleaner)
                    cv2.putText(img, label, (int(x1) + 4, int(y1) - 4), 
                              cv2.FONT_HERSHEY_SIMPLEX, font_scale * 0.7, (255, 255, 255), text_thickness)
                    
                    detections.append({
                        "x1": int(x1),
                        "y1": int(y1),
                        "x2": int(x2),
                        "y2": int(y2),
                        "confidence": float(confidence),
                        "class_id": class_id,
                        "label": label
                    })
                
                # Save annotated image to S3 with higher quality
                if len(detections) > 0:
                    # Use higher quality JPEG encoding
                    encode_params = [cv2.IMWRITE_JPEG_QUALITY, 95]  # Higher quality
                    _, buffer = cv2.imencode('.jpg', img, encode_params)
                    image_bytes = buffer.tobytes()
                    
                    # Upload classified image to S3
                    classified_image_url = save_image(image_bytes, user_id, "classified")
                    logger.info(f"Generated classified image: {classified_image_url}")
        
        # Convert crack_types to frontend format with average confidence
        formatted_crack_types = {}
        for label, data in crack_types.items():
            avg_confidence = sum(data["confidences"]) / len(data["confidences"]) * 100  # Convert to percentage
            formatted_crack_types[label] = {
                "count": data["count"],
                "avg_confidence": round(avg_confidence, 1)
            }
        
        return {
            "total_cracks": len(detections),
            "crack_types": formatted_crack_types,
            "detections": detections,
            "classified_image_url": classified_image_url
        }
    except Exception as e:
        logger.error(f"Error in YOLO detection: {e}")
        logger.error(traceback.format_exc())
        
        # Return fallback detection
        return {
            "total_cracks": 1,
            "crack_types": {"alligator": {"count": 1, "avg_confidence": 85.0}},
            "detections": [{
                "x1": 100,
                "y1": 100,
                "x2": 200,
                "y2": 200,
                "confidence": 0.85,
                "class_id": 0,
                "label": "alligator"
            }],
            "classified_image_url": None
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
