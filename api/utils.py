import os
import uuid
import logging
from datetime import datetime
from PIL import Image
import io
import base64
import random
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure S3 client
s3_client = boto3.client('s3')
S3_BUCKET = "dalan-yolo-models"  # Using your existing bucket

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crack types for classification
CRACK_TYPES = ["alligator", "longitudinal", "transverse"]

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

def save_image(image_data, user_id, image_type="original"):
    """
    Save image to S3 storage
    
    Args:
        image_data (bytes): Image data
        user_id (str): User ID for filename
        image_type (str): "original" or "classified"
        
    Returns:
        str: URL to the saved image
    """
    try:
        # Generate a unique filename
        unique_id = str(uuid.uuid4())
        s3_key = f"images/{image_type}/{user_id}/{unique_id}.jpg"
        
        logger.info(f"Saving {image_type} image - type: {type(image_data)}, size: {len(image_data)} bytes")
        
        # Create BytesIO object from bytes
        image_file = io.BytesIO(image_data)
        
        # Upload to S3
        s3_client.upload_fileobj(
            image_file,
            S3_BUCKET,
            s3_key,
            ExtraArgs={
                'ContentType': 'image/jpeg'
                # Removed ACL since bucket doesn't allow ACLs
            }
        )
        
        # Generate public URL
        image_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"
        
        logger.info(f"Successfully uploaded {image_type} image: {image_url}")
        return image_url
        
    except ClientError as e:
        logger.error(f"S3 error saving {image_type} image: {e}")
        return "https://placehold.co/400x300/cccccc/666666/png?text=Upload+Failed"
    except Exception as e:
        logger.error(f"Error saving {image_type} image to S3: {e}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error details: {str(e)}")
        return "https://placehold.co/400x300/cccccc/666666/png?text=Upload+Failed"

def format_entry_response(entry, user):
    """
    Format the entry response to match frontend expectations
    
    Args:
        entry (dict): Entry data from database
        user (dict): User data from database
        
    Returns:
        dict: Formatted entry response
    """
    try:
        return {
            "id": entry["id"],
            "title": entry["title"],
            "description": entry["description"],
            "location": entry["location"],
            "coordinates": entry["coordinates"],
            "date": entry["created_at"],
            "severity": entry["severity"],
            "type": entry["type"],
            "image": entry["image_url"],
            "classified_image": entry.get("classified_image_url"),
            "user": {
                "id": user["id"],
                "name": user["name"],
                "avatar": user.get("avatar_url"),
                "isCurrentUser": False  # This would be set by the frontend
            }
        }
    except Exception as e:
        logger.error(f"Error formatting entry response: {e}")
        return None
