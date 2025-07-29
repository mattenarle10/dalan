"""
Service for S3 storage operations
"""
import io
import uuid
import boto3
from botocore.exceptions import ClientError
from typing import Dict, List, Optional, Any, Tuple

from config.settings import logger, S3_BUCKET
from domain.models.detection import Detection

def save_image(image_data: bytes, user_id: str, image_type: str = "original") -> Optional[str]:
    """
    Save image to S3 storage
    
    Args:
        image_data: Image data as bytes
        user_id: User ID for filename
        image_type: "original" or "classified"
        
    Returns:
        URL to the saved image or None if failed
    """
    try:
        # Generate a unique filename
        unique_id = str(uuid.uuid4())
        s3_key = f"images/{image_type}/{user_id}/{unique_id}.jpg"
        
        logger.info(f"Saving {image_type} image - size: {len(image_data)} bytes")
        
        # Create BytesIO object from bytes
        image_file = io.BytesIO(image_data)
        
        # Create S3 client
        s3_client = boto3.client('s3')
        
        # Upload to S3
        s3_client.upload_fileobj(
            image_file,
            S3_BUCKET,
            s3_key,
            ExtraArgs={
                'ContentType': 'image/jpeg'
            }
        )
        
        # Generate public URL
        image_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"
        
        logger.info(f"Successfully uploaded {image_type} image: {image_url}")
        return image_url
        
    except ClientError as e:
        logger.error(f"S3 error saving {image_type} image: {e}")
        return None
    except Exception as e:
        logger.error(f"Error saving {image_type} image to S3: {e}")
        return None

def save_classified_image(image_data: bytes, user_id: str, detections: List[Detection]) -> Optional[str]:
    """
    Save classified image with detection boxes to S3
    
    Args:
        image_data: Original image data
        user_id: User ID for filename
        detections: List of detections
        
    Returns:
        URL to the saved classified image or None if failed
    """
    try:
        # Draw detection boxes on image
        from services.detection.processor import draw_detections_on_image
        
        classified_image_data = draw_detections_on_image(image_data, detections)
        
        if not classified_image_data:
            logger.error("Failed to draw detections on image")
            return None
            
        # Save classified image to S3
        return save_image(classified_image_data, user_id, "classified")
        
    except Exception as e:
        logger.error(f"Error saving classified image: {e}")
        return None

def delete_image(image_url: str) -> bool:
    """
    Delete image from S3
    
    Args:
        image_url: URL of the image to delete
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Extract S3 key from URL
        s3_key = image_url.split(f"https://{S3_BUCKET}.s3.amazonaws.com/")[1]
        
        # Create S3 client
        s3_client = boto3.client('s3')
        
        # Delete object
        s3_client.delete_object(
            Bucket=S3_BUCKET,
            Key=s3_key
        )
        
        logger.info(f"Successfully deleted image: {image_url}")
        return True
        
    except ClientError as e:
        logger.error(f"S3 error deleting image: {e}")
        return False
    except Exception as e:
        logger.error(f"Error deleting image from S3: {e}")
        return False
