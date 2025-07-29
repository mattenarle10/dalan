"""
Repository for road crack entries
Handles database operations for entries
"""
import logging
from typing import List, Dict, Any, Optional
from supabase import create_client, Client

from config.settings import (
    SUPABASE_URL, 
    SUPABASE_KEY,
    ROAD_CRACKS_TABLE,
    logger
)

# Initialize Supabase client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized successfully in entries repository")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client in entries repository: {e}")
    supabase = None

def get_all_entries(
    user_id: Optional[str] = None, 
    severity: Optional[str] = None, 
    crack_type: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get all road crack entries with optional filtering
    
    Args:
        user_id: Filter by user ID
        severity: Filter by severity (minor/major)
        crack_type: Filter by crack type
        
    Returns:
        List of road crack entries
    """
    try:
        query = supabase.table(ROAD_CRACKS_TABLE).select("*")
        
        if user_id:
            query = query.eq("user_id", user_id)
            
        if severity:
            query = query.eq("severity", severity)
            
        if crack_type:
            query = query.eq("type", crack_type)
            
        response = query.order("created_at", desc=True).execute()
        
        if response.data:
            return response.data
        else:
            return []
            
    except Exception as e:
        logger.error(f"Error in get_all_entries: {e}")
        return []

def get_entry_by_id(entry_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a specific road crack entry by ID
    
    Args:
        entry_id: ID of the entry to retrieve
        
    Returns:
        Entry data or None if not found
    """
    try:
        response = supabase.table(ROAD_CRACKS_TABLE).select("*").eq("id", entry_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            return None
            
    except Exception as e:
        logger.error(f"Error in get_entry_by_id: {e}")
        return None

def create_entry(entry_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Create a new road crack entry
    
    Args:
        entry_data: Entry data to create
        
    Returns:
        Created entry data or None if failed
    """
    try:
        response = supabase.table(ROAD_CRACKS_TABLE).insert(entry_data).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            return None
            
    except Exception as e:
        logger.error(f"Error in create_entry: {e}")
        return None

def update_entry(entry_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Update an existing road crack entry
    
    Args:
        entry_id: ID of the entry to update
        update_data: Updated entry data
        
    Returns:
        Updated entry data or None if failed
    """
    try:
        response = supabase.table(ROAD_CRACKS_TABLE).update(update_data).eq("id", entry_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            return None
            
    except Exception as e:
        logger.error(f"Error in update_entry: {e}")
        return None

def delete_entry(entry_id: str) -> bool:
    """
    Delete a road crack entry
    
    Args:
        entry_id: ID of the entry to delete
        
    Returns:
        True if successful, False otherwise
    """
    try:
        response = supabase.table(ROAD_CRACKS_TABLE).delete().eq("id", entry_id).execute()
        
        # Check if the delete operation was successful
        # For delete operations, we consider it successful if there's no error
        return True
            
    except Exception as e:
        logger.error(f"Error in delete_entry: {e}")
        return False
