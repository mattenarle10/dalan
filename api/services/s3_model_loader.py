import os
import boto3
import logging
from botocore.exceptions import ClientError, NoCredentialsError
from config import logger, S3_BUCKET, MODEL_S3_KEY, USE_S3_MODEL

# Initialize S3 client
try:
    s3_client = boto3.client('s3', region_name='us-east-1')
    logger.info("S3 client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize S3 client: {e}")
    s3_client = None

def get_model_path(prefer_s3=True):
    """
    Get the path to the YOLO model, either from S3 or local fallback
    
    Args:
        prefer_s3 (bool): Whether to prefer downloading from S3
        
    Returns:
        str: Path to the model file, or None if not available
    """
    
    # Local model path as fallback
    local_model_path = "/Users/matt/dalan/model/YOLOv8_Small_RDD.pt"
    
    # If S3 is disabled or not preferred, use local model
    if not USE_S3_MODEL or not prefer_s3:
        if os.path.exists(local_model_path):
            logger.info(f"Using local model: {local_model_path}")
            return local_model_path
        else:
            logger.warning("Local model not found, falling back to S3")
    
    # Try to download from S3
    if s3_client and USE_S3_MODEL:
        try:
            # Create temp directory if it doesn't exist
            temp_dir = "/tmp"
            if not os.path.exists(temp_dir):
                os.makedirs(temp_dir)
            
            # Download path in temp directory
            download_path = os.path.join(temp_dir, "YOLOv8_Small_RDD.pt")
            
            # Check if model already exists in temp (Lambda container reuse)
            if os.path.exists(download_path):
                logger.info(f"Using cached model from: {download_path}")
                return download_path
            
            # Download model from S3
            logger.info(f"Downloading model from S3: s3://{S3_BUCKET}/{MODEL_S3_KEY}")
            s3_client.download_file(S3_BUCKET, MODEL_S3_KEY, download_path)
            
            if os.path.exists(download_path):
                logger.info(f"Successfully downloaded model to: {download_path}")
                return download_path
            else:
                raise Exception("Downloaded file not found")
                
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchBucket':
                logger.error(f"S3 bucket '{S3_BUCKET}' does not exist")
            elif error_code == 'NoSuchKey':
                logger.error(f"Model file '{MODEL_S3_KEY}' not found in bucket '{S3_BUCKET}'")
            else:
                logger.error(f"S3 ClientError downloading model: {e}")
        except NoCredentialsError:
            logger.error("AWS credentials not found")
        except Exception as e:
            logger.error(f"Error downloading model from S3: {e}")
    
    # Final fallback to local model
    if os.path.exists(local_model_path):
        logger.info(f"Falling back to local model: {local_model_path}")
        return local_model_path
    
    # No model available
    logger.error("No model available - neither S3 nor local model found")
    return None

def upload_model_to_s3(local_model_path=None):
    """
    Upload the local YOLO model to S3 bucket
    
    Args:
        local_model_path (str): Path to local model file
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not s3_client:
        logger.error("S3 client not initialized")
        return False
    
    if not local_model_path:
        local_model_path = "/Users/matt/dalan/model/YOLOv8_Small_RDD.pt"
    
    if not os.path.exists(local_model_path):
        logger.error(f"Local model file not found: {local_model_path}")
        return False
    
    try:
        logger.info(f"Uploading model to S3: s3://{S3_BUCKET}/{MODEL_S3_KEY}")
        s3_client.upload_file(local_model_path, S3_BUCKET, MODEL_S3_KEY)
        logger.info("Model uploaded successfully to S3")
        return True
        
    except ClientError as e:
        logger.error(f"S3 ClientError uploading model: {e}")
        return False
    except Exception as e:
        logger.error(f"Error uploading model to S3: {e}")
        return False

def check_s3_setup():
    """
    Check if S3 bucket and model are properly set up
    
    Returns:
        dict: Status information about S3 setup
    """
    status = {
        "s3_client": s3_client is not None,
        "bucket_exists": False,
        "model_exists": False,
        "local_model_exists": os.path.exists("/Users/matt/dalan/model/YOLOv8_Small_RDD.pt")
    }
    
    if not s3_client:
        return status
    
    try:
        # Check if bucket exists
        s3_client.head_bucket(Bucket=S3_BUCKET)
        status["bucket_exists"] = True
        
        # Check if model exists in bucket
        s3_client.head_object(Bucket=S3_BUCKET, Key=MODEL_S3_KEY)
        status["model_exists"] = True
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == '404':
            logger.warning(f"S3 bucket '{S3_BUCKET}' or model '{MODEL_S3_KEY}' not found")
        else:
            logger.error(f"Error checking S3 setup: {e}")
    except Exception as e:
        logger.error(f"Error checking S3 setup: {e}")
    
    return status 