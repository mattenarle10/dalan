import boto3
import os
import logging
from pathlib import Path
import tempfile
from botocore.exceptions import ClientError, NoCredentialsError

logger = logging.getLogger(__name__)

class S3ModelLoader:
    def __init__(self):
        self.s3_client = None
        self.bucket_name = os.getenv("MODEL_S3_BUCKET", "dalan-yolo-models")
        self.s3_key = os.getenv("MODEL_S3_KEY", "models/YOLOv8_Small_RDD.pt")
        self.local_model_path = None
        
    def _init_s3_client(self):
        """Initialize S3 client if not already done"""
        if self.s3_client is None:
            try:
                self.s3_client = boto3.client('s3')
                # Test connection by listing buckets
                self.s3_client.list_buckets()
                logger.info("S3 client initialized successfully")
            except NoCredentialsError:
                logger.error("AWS credentials not found")
                raise
            except Exception as e:
                logger.error(f"Error initializing S3 client: {e}")
                raise
    
    def download_model(self, force_download=False):
        """
        Download model from S3 to local temporary directory
        
        Args:
            force_download (bool): Force download even if file exists locally
            
        Returns:
            str: Path to local model file
        """
        try:
            # Create temporary directory for model if it doesn't exist
            temp_dir = Path(tempfile.gettempdir()) / "dalan_models"
            temp_dir.mkdir(exist_ok=True)
            
            local_model_path = temp_dir / "YOLOv8_Small_RDD.pt"
            
            # If file exists and not forcing download, return existing path
            if local_model_path.exists() and not force_download:
                logger.info(f"Using cached model: {local_model_path}")
                self.local_model_path = str(local_model_path)
                return str(local_model_path)
            
            # Initialize S3 client
            self._init_s3_client()
            
            # Download model from S3
            logger.info(f"Downloading model from S3: s3://{self.bucket_name}/{self.s3_key}")
            self.s3_client.download_file(
                self.bucket_name, 
                self.s3_key, 
                str(local_model_path)
            )
            
            logger.info(f"Model downloaded successfully to: {local_model_path}")
            self.local_model_path = str(local_model_path)
            return str(local_model_path)
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchBucket':
                logger.error(f"S3 bucket not found: {self.bucket_name}")
            elif error_code == 'NoSuchKey':
                logger.error(f"Model file not found in S3: {self.s3_key}")
            else:
                logger.error(f"S3 error downloading model: {e}")
            raise
        except Exception as e:
            logger.error(f"Error downloading model from S3: {e}")
            raise
    
    def get_local_fallback_path(self):
        """
        Get local fallback model path for development
        
        Returns:
            str: Path to local model file
        """
        local_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../model/YOLOv8_Small_RDD.pt")
        )
        
        if os.path.exists(local_path):
            logger.info(f"Using local fallback model: {local_path}")
            return local_path
        else:
            logger.error(f"Local fallback model not found: {local_path}")
            return None
    
    def get_model_path(self, prefer_s3=True):
        """
        Get model path, trying S3 first then local fallback
        
        Args:
            prefer_s3 (bool): Whether to prefer S3 over local files
            
        Returns:
            str: Path to model file
        """
        if prefer_s3:
            try:
                return self.download_model()
            except Exception as e:
                logger.warning(f"S3 download failed, trying local fallback: {e}")
                return self.get_local_fallback_path()
        else:
            # Try local first
            local_path = self.get_local_fallback_path()
            if local_path:
                return local_path
            else:
                logger.info("Local model not found, trying S3...")
                return self.download_model()

# Global instance
s3_loader = S3ModelLoader() 