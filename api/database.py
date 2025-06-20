import os
from dotenv import load_dotenv
from supabase import create_client, Client
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get Supabase credentials from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Supabase client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {e}")
    supabase = None

# Table names
ROAD_CRACKS_TABLE = "road_cracks"
USERS_TABLE = "users"
CRACK_DETECTIONS_TABLE = "crack_detections"
DETECTION_SUMMARIES_TABLE = "detection_summaries"

# Road crack entries functions
def get_all_entries(user_id=None, severity=None, crack_type=None):
    """
    Get all road crack entries with optional filtering
    
    Args:
        user_id (str, optional): Filter by user ID
        severity (str, optional): Filter by severity (minor/major)
        crack_type (str, optional): Filter by crack type
        
    Returns:
        list: List of road crack entries
    """
    try:
        query = supabase.table(ROAD_CRACKS_TABLE).select("*")
        
        if user_id:
            query = query.eq("user_id", user_id)
        if severity:
            query = query.eq("severity", severity)
        if crack_type:
            query = query.eq("type", crack_type)
            
        response = query.execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching entries: {e}")
        return []

def get_entry_by_id(entry_id):
    """
    Get a road crack entry by ID
    
    Args:
        entry_id (str): Entry ID
        
    Returns:
        dict: Road crack entry or None if not found
    """
    try:
        response = supabase.table(ROAD_CRACKS_TABLE).select("*").eq("id", entry_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error fetching entry {entry_id}: {e}")
        return None
        
def get_crack_detections(road_crack_id):
    """
    Get all crack detections for a road crack entry
    
    Args:
        road_crack_id (str): Road crack entry ID
        
    Returns:
        list: List of crack detections
    """
    try:
        response = supabase.table(CRACK_DETECTIONS_TABLE).select("*").eq("road_crack_id", road_crack_id).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching crack detections for {road_crack_id}: {e}")
        return []
        
def get_detection_summary(road_crack_id):
    """
    Get detection summary for a road crack entry
    
    Args:
        road_crack_id (str): Road crack entry ID
        
    Returns:
        dict: Detection summary or None if not found
    """
    try:
        response = supabase.table(DETECTION_SUMMARIES_TABLE).select("*").eq("road_crack_id", road_crack_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error fetching detection summary for {road_crack_id}: {e}")
        return None

def create_entry(entry_data):
    """
    Create a new road crack entry
    
    Args:
        entry_data (dict): Entry data
        
    Returns:
        dict: Created entry or None if failed
    """
    try:
        response = supabase.table(ROAD_CRACKS_TABLE).insert(entry_data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error creating entry: {e}")
        return None
        
def create_crack_detection(detection_data):
    """
    Create a new crack detection entry
    
    Args:
        detection_data (dict): Detection data including road_crack_id, crack_type, confidence, and bounding box coordinates
        
    Returns:
        dict: Created detection or None if failed
    """
    try:
        response = supabase.table(CRACK_DETECTIONS_TABLE).insert(detection_data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error creating crack detection: {e}")
        return None
        
def create_detection_summary(summary_data):
    """
    Create a new detection summary entry
    
    Args:
        summary_data (dict): Summary data including road_crack_id, total_cracks, and crack_types summary
        
    Returns:
        dict: Created summary or None if failed
    """
    try:
        response = supabase.table(DETECTION_SUMMARIES_TABLE).insert(summary_data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error creating detection summary: {e}")
        return None

def update_entry(entry_id, entry_data):
    """
    Update an existing road crack entry
    
    Args:
        entry_id (str): Entry ID
        entry_data (dict): Updated entry data
        
    Returns:
        dict: Updated entry or None if failed
    """
    try:
        response = supabase.table(ROAD_CRACKS_TABLE).update(entry_data).eq("id", entry_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error updating entry {entry_id}: {e}")
        return None

def delete_entry(entry_id):
    """
    Delete a road crack entry
    
    Args:
        entry_id (str): Entry ID
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        response = supabase.table(ROAD_CRACKS_TABLE).delete().eq("id", entry_id).execute()
        return True if response.data else False
    except Exception as e:
        logger.error(f"Error deleting entry {entry_id}: {e}")
        return False

# User functions
def get_user(user_id):
    """
    Get a user by ID
    
    Args:
        user_id (str): User ID
        
    Returns:
        dict: User data or None if not found
    """
    try:
        response = supabase.table(USERS_TABLE).select("*").eq("id", user_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error fetching user {user_id}: {e}")
        return None
