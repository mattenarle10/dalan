"""
Service for loading YOLO model from S3
"""
import os
import tempfile
import boto3
from botocore.exceptions import ClientError
from typing import Any, Optional

from config.settings import logger, S3_BUCKET, YOLO_MODEL_KEY

# Global model cache
_model_cache = None

def download_model_from_s3() -> Optional[str]:
    """
    Download YOLO model from S3
    
    Returns:
        Path to downloaded model file or None if failed
    """
    try:
        logger.info(f"Downloading model from s3://{S3_BUCKET}/{YOLO_MODEL_KEY}")
        
        # Create S3 client
        s3_client = boto3.client('s3')
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pt')
        temp_file_path = temp_file.name
        temp_file.close()
        
        # Download model file
        s3_client.download_file(
            S3_BUCKET,
            YOLO_MODEL_KEY,
            temp_file_path
        )
        
        logger.info(f"Model downloaded successfully to {temp_file_path}")
        return temp_file_path
        
    except ClientError as e:
        logger.error(f"Error downloading model from S3: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error downloading model: {e}")
        return None

def load_model_from_path(model_path: str) -> Any:
    """
    Load YOLO model from file path
    
    Args:
        model_path: Path to model file
        
    Returns:
        Loaded model or None if failed
    """
    try:
        # Import here to avoid loading ultralytics unless needed
        from ultralytics import YOLO
        
        logger.info(f"Loading YOLO model from {model_path}")
        model = YOLO(model_path)
        logger.info("Model loaded successfully")
        return model
        
    except ImportError as e:
        logger.error(f"Error importing ultralytics: {e}")
        return None
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return None

def get_model() -> Any:
    """
    Get YOLO model, using cache if available
    
    Returns:
        Loaded model or None if failed
    """
    global _model_cache
    
    # Return cached model if available
    if _model_cache is not None:
        logger.info("Using cached model")
        return _model_cache
        
    # Download model from S3
    model_path = download_model_from_s3()
    
    if not model_path:
        logger.error("Failed to download model from S3")
        return None
        
    # Load model from file
    _model_cache = load_model_from_path(model_path)
    
    # Clean up temporary file
    try:
        os.remove(model_path)
        logger.info(f"Removed temporary model file {model_path}")
    except Exception as e:
        logger.warning(f"Failed to remove temporary model file: {e}")
        
    return _model_cache

def clear_model_cache() -> None:
    """
    Clear model cache to force reloading
    """
    global _model_cache
    _model_cache = None
    logger.info("Model cache cleared")
