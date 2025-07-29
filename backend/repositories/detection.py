"""
Repository for crack detection operations
Handles database operations for crack detections and summaries
"""
import logging
from typing import Dict, Any, Optional, List
from supabase import create_client, Client

from config.settings import (
    SUPABASE_URL, 
    SUPABASE_KEY,
    CRACK_DETECTIONS_TABLE,
    DETECTION_SUMMARIES_TABLE,
    logger
)

# Initialize Supabase client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized successfully in detection repository")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client in detection repository: {e}")
    supabase = None

def create_crack_detection(detection_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Create a new crack detection record
    
    Args:
        detection_data: Detection data to create
        
    Returns:
        Created detection data or None if failed
    """
    try:
        response = supabase.table(CRACK_DETECTIONS_TABLE).insert(detection_data).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            return None
            
    except Exception as e:
        logger.error(f"Error in create_crack_detection: {e}")
        return None

def get_crack_detections(road_crack_id: str) -> List[Dict[str, Any]]:
    """
    Get all crack detections for a road crack entry
    
    Args:
        road_crack_id: ID of the road crack entry
        
    Returns:
        List of crack detections
    """
    try:
        response = supabase.table(CRACK_DETECTIONS_TABLE).select("*").eq("road_crack_id", road_crack_id).execute()
        
        if response.data:
            return response.data
        else:
            return []
            
    except Exception as e:
        logger.error(f"Error in get_crack_detections: {e}")
        return []

def create_detection_summary(summary_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Create a new detection summary record
    
    Args:
        summary_data: Summary data to create
        
    Returns:
        Created summary data or None if failed
    """
    try:
        response = supabase.table(DETECTION_SUMMARIES_TABLE).insert(summary_data).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            return None
            
    except Exception as e:
        logger.error(f"Error in create_detection_summary: {e}")
        return None

def get_detection_summary(road_crack_id: str) -> Optional[Dict[str, Any]]:
    """
    Get detection summary for a road crack entry
    
    Args:
        road_crack_id: ID of the road crack entry
        
    Returns:
        Detection summary data or None if not found
    """
    try:
        response = supabase.table(DETECTION_SUMMARIES_TABLE).select("*").eq("road_crack_id", road_crack_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            return None
            
    except Exception as e:
        logger.error(f"Error in get_detection_summary: {e}")
        return None

def update_detection_summary(summary_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Update an existing detection summary
    
    Args:
        summary_id: ID of the summary to update
        update_data: Updated summary data
        
    Returns:
        Updated summary data or None if failed
    """
    try:
        response = supabase.table(DETECTION_SUMMARIES_TABLE).update(update_data).eq("id", summary_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            return None
            
    except Exception as e:
        logger.error(f"Error in update_detection_summary: {e}")
        return None
