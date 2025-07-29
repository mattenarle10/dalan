"""
Utility functions for image processing and handling
"""
import os
import base64
import tempfile
from typing import Optional, Tuple, Dict, Any
import io
from config.settings import logger

def decode_base64_image(base64_string: str) -> Optional[bytes]:
    """
    Decode base64 encoded image
    
    Args:
        base64_string: Base64 encoded image string
        
    Returns:
        Decoded image bytes or None if error
    """
    try:
        # Check if the string has a data URL prefix (e.g., "data:image/jpeg;base64,")
        if "base64," in base64_string:
            # Extract the actual base64 content
            base64_string = base64_string.split("base64,")[1]
            
        # Decode the base64 string
        image_data = base64.b64decode(base64_string)
        return image_data
    except Exception as e:
        logger.error(f"Error decoding base64 image: {e}")
        return None

def save_temp_image(image_data: bytes) -> Optional[str]:
    """
    Save image data to a temporary file
    
    Args:
        image_data: Image data in bytes
        
    Returns:
        Path to the temporary file or None if error
    """
    try:
        # Create a temporary file with .jpg extension
        fd, temp_path = tempfile.mkstemp(suffix='.jpg')
        
        # Write the image data to the file
        with os.fdopen(fd, 'wb') as temp_file:
            temp_file.write(image_data)
            
        logger.info(f"Saved temporary image to {temp_path}")
        return temp_path
    except Exception as e:
        logger.error(f"Error saving temporary image: {e}")
        return None

def cleanup_temp_file(file_path: str) -> bool:
    """
    Clean up a temporary file
    
    Args:
        file_path: Path to the temporary file
        
    Returns:
        True if successful, False otherwise
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Removed temporary file: {file_path}")
            return True
        return False
    except Exception as e:
        logger.error(f"Error removing temporary file {file_path}: {e}")
        return False

def get_image_dimensions(image_data: bytes) -> Tuple[int, int]:
    """
    Get image dimensions (width, height)
    
    Args:
        image_data: Image data in bytes
        
    Returns:
        Tuple of (width, height) or (0, 0) if error
    """
    try:
        from PIL import Image
        image = Image.open(io.BytesIO(image_data))
        return image.size
    except Exception as e:
        logger.error(f"Error getting image dimensions: {e}")
        return (0, 0)

def validate_image(image_data: bytes, max_size_mb: float = 10.0) -> Dict[str, Any]:
    """
    Validate image data
    
    Args:
        image_data: Image data in bytes
        max_size_mb: Maximum allowed size in MB
        
    Returns:
        Dict with validation results
    """
    try:
        # Check image size
        size_mb = len(image_data) / (1024 * 1024)
        if size_mb > max_size_mb:
            return {
                "valid": False,
                "error": f"Image size ({size_mb:.2f} MB) exceeds maximum allowed size ({max_size_mb} MB)"
            }
            
        # Check if it's a valid image
        try:
            from PIL import Image
            image = Image.open(io.BytesIO(image_data))
            width, height = image.size
            format = image.format
            
            return {
                "valid": True,
                "width": width,
                "height": height,
                "format": format,
                "size_mb": size_mb
            }
        except Exception as e:
            return {
                "valid": False,
                "error": f"Invalid image format: {str(e)}"
            }
            
    except Exception as e:
        logger.error(f"Error validating image: {e}")
        return {
            "valid": False,
            "error": f"Error validating image: {str(e)}"
        }
