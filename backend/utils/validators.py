"""
Utility functions for input validation
"""
import re
from typing import Dict, List, Optional, Any, Tuple
import json
from PIL import Image
import io

from config.settings import logger

def validate_email(email: str) -> bool:
    """
    Validate email format
    
    Args:
        email: Email address to validate
        
    Returns:
        True if valid, False otherwise
    """
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(email_pattern, email))

def validate_password(password: str) -> Tuple[bool, Optional[str]]:
    """
    Validate password strength
    
    Args:
        password: Password to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
        
    if not any(char.isdigit() for char in password):
        return False, "Password must contain at least one digit"
        
    if not any(char.isupper() for char in password):
        return False, "Password must contain at least one uppercase letter"
        
    if not any(char.islower() for char in password):
        return False, "Password must contain at least one lowercase letter"
        
    return True, None

def validate_coordinates(coordinates: List[float]) -> bool:
    """
    Validate geographic coordinates
    
    Args:
        coordinates: List of [longitude, latitude]
        
    Returns:
        True if valid, False otherwise
    """
    if not isinstance(coordinates, list) or len(coordinates) != 2:
        return False
        
    longitude, latitude = coordinates
    
    # Check if longitude is between -180 and 180
    if not isinstance(longitude, (int, float)) or longitude < -180 or longitude > 180:
        return False
        
    # Check if latitude is between -90 and 90
    if not isinstance(latitude, (int, float)) or latitude < -90 or latitude > 90:
        return False
        
    return True

def validate_image(image_data: bytes) -> Tuple[bool, Optional[str]]:
    """
    Validate image data
    
    Args:
        image_data: Image data as bytes
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        # Try to open image with PIL
        img = Image.open(io.BytesIO(image_data))
        
        # Check image format
        if img.format not in ['JPEG', 'PNG']:
            return False, f"Unsupported image format: {img.format}. Only JPEG and PNG are supported."
            
        # Check image size
        width, height = img.size
        
        if width < 100 or height < 100:
            return False, f"Image too small: {width}x{height}. Minimum size is 100x100 pixels."
            
        if width > 4000 or height > 4000:
            return False, f"Image too large: {width}x{height}. Maximum size is 4000x4000 pixels."
            
        # Check file size (max 10MB)
        if len(image_data) > 10 * 1024 * 1024:
            return False, f"Image file too large: {len(image_data) / (1024 * 1024):.2f} MB. Maximum size is 10 MB."
            
        return True, None
        
    except Exception as e:
        logger.error(f"Error validating image: {e}")
        return False, f"Invalid image data: {str(e)}"

def validate_json(json_str: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """
    Validate JSON string
    
    Args:
        json_str: JSON string to validate
        
    Returns:
        Tuple of (is_valid, parsed_json, error_message)
    """
    try:
        parsed_json = json.loads(json_str)
        return True, parsed_json, None
    except json.JSONDecodeError as e:
        return False, None, f"Invalid JSON: {str(e)}"
    except Exception as e:
        return False, None, f"Error parsing JSON: {str(e)}"
