import boto3
import os
from botocore.exceptions import ClientError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_s3_bucket_and_upload_model():
    """
    Create S3 bucket and upload YOLO model
    """
    
    # AWS configuration - you'll need to set these
    bucket_name = "dalan-yolo-models"  # Change this to a unique name
    model_file_path = "../model/YOLOv8_Small_RDD.pt"
    s3_key = "models/YOLOv8_Small_RDD.pt"
    
    try:
        # Initialize S3 client
        s3_client = boto3.client('s3')
        
        # Create bucket
        try:
            s3_client.create_bucket(Bucket=bucket_name)
            logger.info(f"Created bucket: {bucket_name}")
        except ClientError as e:
            if e.response['Error']['Code'] == 'BucketAlreadyOwnedByYou':
                logger.info(f"Bucket {bucket_name} already exists and is owned by you")
            else:
                logger.error(f"Error creating bucket: {e}")
                return False
        
        # Upload model file
        model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), model_file_path))
        
        if not os.path.exists(model_path):
            logger.error(f"Model file not found: {model_path}")
            return False
        
        logger.info(f"Uploading model from: {model_path}")
        s3_client.upload_file(model_path, bucket_name, s3_key)
        logger.info(f"Model uploaded to s3://{bucket_name}/{s3_key}")
        
        # Make object publicly readable (optional - for testing)
        # s3_client.put_object_acl(Bucket=bucket_name, Key=s3_key, ACL='public-read')
        
        print(f"\n✅ SUCCESS!")
        print(f"Bucket: {bucket_name}")
        print(f"Model S3 URL: s3://{bucket_name}/{s3_key}")
        print(f"Set these environment variables:")
        print(f"MODEL_S3_BUCKET={bucket_name}")
        print(f"MODEL_S3_KEY={s3_key}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error in S3 setup: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Setting up S3 bucket and uploading YOLO model...")
    print("\nMake sure you have:")
    print("1. AWS CLI configured (aws configure)")
    print("2. Proper AWS credentials with S3 permissions")
    print("\nProceeding in 3 seconds...")
    
    import time
    time.sleep(3)
    
    success = create_s3_bucket_and_upload_model()
    
    if success:
        print("\n🎉 S3 setup complete!")
    else:
        print("\n❌ S3 setup failed. Check logs above.") 