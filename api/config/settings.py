import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API Configuration
API_TITLE = "Dalan API"
API_DESCRIPTION = "API for the Dalan Road Crack Mapping App"
API_VERSION = "0.1.0"

# Database Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# S3 Configuration
S3_BUCKET = "dalan-yolo-models"

# SQS Configuration
YOLO_QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/888184096163/dalan-yolo-processing"

# Table names
ROAD_CRACKS_TABLE = "road_cracks"
CRACK_DETECTIONS_TABLE = "crack_detections"
DETECTION_SUMMARIES_TABLE = "detection_summaries"

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
