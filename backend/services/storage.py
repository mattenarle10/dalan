import os
import uuid
import logging
import io
import boto3
from botocore.exceptions import ClientError
from config import logger, S3_BUCKET

# Configure S3 client
s3_client = boto3.client('s3')

def save_image(image_data, user_id, image_type="original"):
    """
    Save image to S3 storage with public access
    
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
        
        # Upload to S3 (ACLs disabled due to bucket owner enforced setting)
        extra_args = {
            'ContentType': 'image/jpeg',
            'CacheControl': 'max-age=31536000',  # Cache for 1 year
        }
        
        # Note: ACLs are disabled for this bucket (owner enforced setting)
        # Public access is controlled by bucket policy instead
        s3_client.upload_fileobj(
            image_file,
            S3_BUCKET,
            s3_key,
            ExtraArgs=extra_args
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
