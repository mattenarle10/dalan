# Import and expose all configuration settings
from config.settings import (
    # API metadata
    API_TITLE,
    API_DESCRIPTION,
    API_VERSION,
    
    # Environment variables
    ENVIRONMENT,
    SUPABASE_URL,
    SUPABASE_KEY,
    SUPABASE_JWT_SECRET,
    SUPABASE_SERVICE_ROLE_KEY,
    S3_BUCKET,
    MODEL_S3_KEY,
    USE_S3_MODEL,
    YOLO_QUEUE_URL,
    
    # Table names
    ROAD_CRACKS_TABLE,
    CRACK_DETECTIONS_TABLE,
    DETECTION_SUMMARIES_TABLE,
    
    # Logging
    logger
)