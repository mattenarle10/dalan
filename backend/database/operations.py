# Import the external supabase package
from supabase import create_client, Client
import os
from config import (
    logger, 
    SUPABASE_URL, 
    SUPABASE_KEY, 
    SUPABASE_SERVICE_ROLE_KEY,
    ROAD_CRACKS_TABLE,
    CRACK_DETECTIONS_TABLE,
    DETECTION_SUMMARIES_TABLE
)

# Initialize Supabase client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {e}")
    supabase = None

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
def get_auth_user(user_id):
    """
    Get a user from Supabase auth.users by ID
    Note: Uses the Management API with service role key
    
    Args:
        user_id (str): Auth User ID
        
    Returns:
        dict: Formatted user data or None if not found
    """
    try:
        # Use Supabase Management API to get user info
        # This requires service role key
        service_role_key = SUPABASE_SERVICE_ROLE_KEY
        
        if not service_role_key:
            logger.warning("SUPABASE_SERVICE_ROLE_KEY not set, cannot access auth.users directly")
            return None
            
        # Create admin client with service role key
        admin_client = create_client(SUPABASE_URL, service_role_key)
        
        # Get user using admin client
        response = admin_client.auth.admin.get_user_by_id(user_id)
        
        if response and hasattr(response, 'user') and response.user:
            user = response.user
            
            # Format user data to match expected format
            formatted_user = {
                "id": user.id,
                "email": user.email,
                "name": user.user_metadata.get("name") or user.user_metadata.get("full_name") or (user.email.split("@")[0] if user.email else "User"),
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "avatar_url": user.user_metadata.get("avatar_url") or user.user_metadata.get("picture")
            }
            
            return formatted_user
            
        # If get_user_by_id fails, try listing all users and find the one we need
        users_list = admin_client.auth.admin.list_users()
        
        # Handle different response formats
        if hasattr(users_list, 'data'):
            users = users_list.data
        else:
            users = users_list
            
        for user in users:
            if user.id == user_id:
                formatted_user = {
                    "id": user.id,
                    "email": user.email,
                    "name": user.user_metadata.get("name") or user.user_metadata.get("full_name") or (user.email.split("@")[0] if user.email else "User"),
                    "created_at": user.created_at.isoformat() if user.created_at else None,
                    "avatar_url": user.user_metadata.get("avatar_url") or user.user_metadata.get("picture")
                }
                return formatted_user
        
        return None
        
    except Exception as e:
        logger.error(f"Error fetching auth user {user_id}: {e}")
        return None

def get_user(user_id):
    """
    Get a user by ID from Supabase auth.users
    
    Args:
        user_id (str): User ID
        
    Returns:
        dict: User data or None if not found
    """
    try:
        # Try to get user from auth API
        user_data = get_auth_user(user_id)
        if user_data:
            return user_data
            
    except Exception as e:
        logger.error(f"Error in get_user: {e}")
        
    # Fallback to mock data for known users
    if user_id == "ec74d8c5-a458-4191-9464-bdf90a8932bc":
        return {
            "id": user_id,
            "name": "Matthew Enarle", 
            "email": "enarlem10@gmail.com",
            "created_at": "2025-06-30T13:43:01.933225+00:00"
        }
    
    # For other users, create a generic fallback
    # This ensures entries still display even if we can't get user details
    return {
        "id": user_id,
        "name": "Community User",  # Generic name
        "email": f"user-{user_id[:8]}@dalan.app",  # Generic email with partial ID
        "created_at": "2025-06-30T00:00:00.000000+00:00"
    }
