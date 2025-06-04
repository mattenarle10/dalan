import os
import uuid
import logging
from datetime import datetime
from PIL import Image
import io
import base64
import random
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

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

def save_image(image_data, user_id):
    """
    Save image to Cloudinary storage
    
    Args:
        image_data (bytes): Image data
        user_id (str): User ID for filename
        
    Returns:
        str: URL to the saved image
    """
    try:
        # Generate a unique public_id for Cloudinary
        unique_id = str(uuid.uuid4())
        
        # Upload to Cloudinary
        # The folder structure will be: dalan/user_id/unique_id
        result = cloudinary.uploader.upload(
            image_data,
            public_id=f"dalan/{user_id}/{unique_id}",
            overwrite=True,
            resource_type="image"
        )
        
        # Return the secure URL from Cloudinary
        return result["secure_url"]
    except Exception as e:
        logger.error(f"Error saving image to Cloudinary: {e}")
        # If upload fails, return a placeholder image
        return "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg"

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
            "user": {
                "id": user["id"],
                "name": user["name"],
                "isCurrentUser": False  # This would be set by the frontend
            }
        }
    except Exception as e:
        logger.error(f"Error formatting entry response: {e}")
        return None
