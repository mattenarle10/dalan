"""
Service for processing images with YOLO model
"""
import os
import tempfile
import json
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np
from PIL import Image

from config.settings import logger
from domain.models.detection import Detection, DetectionSummary, DetectionResult
from services.detection.model_loader import get_model

def process_image(model: Any, image_path: str, road_crack_id: str) -> Optional[DetectionResult]:
    """
    Process image with YOLO model
    
    Args:
        model: YOLO model
        image_path: Path to image file
        road_crack_id: ID of the road crack entry
        
    Returns:
        Detection result or None if failed
    """
    try:
        logger.info(f"Processing image {image_path} for road crack ID {road_crack_id}")
        
        # Run YOLO detection
        results = model(image_path, verbose=False)
        
        if not results:
            logger.warning("No detection results returned by model")
            return None
            
        # Process results
        result = results[0]  # Get first result
        
        # Extract detections
        detections = []
        crack_types = {}
        total_cracks = 0
        
        # Process each detection
        for box in result.boxes:
            try:
                # Get box coordinates
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                
                # Get confidence and class
                confidence = float(box.conf[0].item())
                class_id = int(box.cls[0].item())
                
                # Get class label
                label = result.names[class_id]
                
                # Create detection object
                detection = Detection(
                    road_crack_id=road_crack_id,
                    crack_type=label,
                    confidence=confidence,
                    x1=x1,
                    y1=y1,
                    x2=x2,
                    y2=y2
                )
                
                detections.append(detection)
                
                # Update crack types summary
                if label not in crack_types:
                    crack_types[label] = {
                        "count": 0,
                        "confidence": 0
                    }
                    
                crack_types[label]["count"] += 1
                crack_types[label]["confidence"] += confidence
                total_cracks += 1
                
            except Exception as e:
                logger.error(f"Error processing detection: {e}")
                continue
                
        # Calculate average confidence for each crack type
        for crack_type in crack_types:
            if crack_types[crack_type]["count"] > 0:
                crack_types[crack_type]["confidence"] /= crack_types[crack_type]["count"]
                crack_types[crack_type]["confidence"] = round(crack_types[crack_type]["confidence"], 2)
        
        # Create summary
        summary = DetectionSummary(
            road_crack_id=road_crack_id,
            total_cracks=total_cracks,
            crack_types=crack_types
        )
        
        # Create result
        detection_result = DetectionResult(
            summary=summary,
            detections=detections
        )
        
        logger.info(f"Processed image with {total_cracks} detections")
        return detection_result
        
    except Exception as e:
        logger.error(f"Error processing image with YOLO model: {e}")
        return None

def draw_detections_on_image(image_data: bytes, detections: List[Detection]) -> Optional[bytes]:
    """
    Draw detection boxes on image
    
    Args:
        image_data: Original image data
        detections: List of detections
        
    Returns:
        Image data with detection boxes or None if failed
    """
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Define colors for different crack types
        colors = {
            "alligator": (0, 0, 255),    # Red
            "longitudinal": (0, 255, 0), # Green
            "transverse": (255, 0, 0),   # Blue
            "pothole": (255, 255, 0)     # Yellow
        }
        
        # Draw boxes for each detection
        for detection in detections:
            # Get box coordinates
            x1, y1, x2, y2 = detection.x1, detection.y1, detection.x2, detection.y2
            
            # Get crack type and confidence
            crack_type = detection.crack_type
            confidence = detection.confidence
            
            # Get color for crack type (default to white if not found)
            color = colors.get(crack_type.lower(), (255, 255, 255))
            
            # Draw rectangle
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
            
            # Draw label
            label = f"{crack_type}: {confidence:.2f}"
            cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
        # Convert back to bytes
        _, buffer = cv2.imencode('.jpg', img)
        return buffer.tobytes()
        
    except Exception as e:
        logger.error(f"Error drawing detections on image: {e}")
        return None
