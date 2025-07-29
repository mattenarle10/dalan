import os
from dotenv import load_dotenv
from utils.logger import setup_logger

# Load environment variables from .env file
load_dotenv()

# Configure logger
logger = setup_logger("dalan")

# API Configuration
API_TITLE = "Dalan API"
API_DESCRIPTION = "API for the Dalan Road Crack Mapping App"
API_VERSION = "0.1.0"

# Database Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", SUPABASE_JWT_SECRET)
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# S3 Configuration
S3_BUCKET = os.getenv("S3_BUCKET", "dalan")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
MODEL_S3_KEY = os.getenv("MODEL_S3_KEY", "model/YOLOv8_Small_RDD.pt")
USE_S3_MODEL = os.getenv("USE_S3_MODEL", "true").lower() == "true"
IMAGE_PREFIX = "images/"
CLASSIFIED_IMAGE_PREFIX = "classified/"

# SQS Configuration
YOLO_QUEUE_URL = os.getenv("YOLO_QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/888184096163/dalan-yolo-processing")

# Table names
ROAD_CRACKS_TABLE = "road_cracks"
CRACK_DETECTIONS_TABLE = "crack_detections"
DETECTION_SUMMARIES_TABLE = "detection_summaries"
USERS_TABLE = "users"

# CORS Configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# API Gateway stage
API_STAGE = os.getenv("API_STAGE", "dev")
