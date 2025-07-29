"""
Repository for user operations
Handles database operations for users
"""
import logging
from typing import Dict, Any, Optional
from supabase import create_client, Client

from config.settings import (
    SUPABASE_URL, 
    SUPABASE_KEY,
    USERS_TABLE,
    logger
)

# Initialize Supabase client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized successfully in users repository")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client in users repository: {e}")
    supabase = None

def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get user by ID
    
    Args:
        user_id: ID of the user to retrieve
        
    Returns:
        User data or None if not found
    """
    try:
        response = supabase.table(USERS_TABLE).select("*").eq("id", user_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            # Fallback to auth.users if not found in users table
            auth_response = supabase.from_("auth.users").select("*").eq("id", user_id).execute()
            if auth_response.data and len(auth_response.data) > 0:
                user_data = auth_response.data[0]
                # Format user data to match expected structure
                return {
                    "id": user_data.get("id"),
                    "email": user_data.get("email"),
                    "name": user_data.get("user_metadata", {}).get("name", "Unknown User"),
                    "avatar_url": user_data.get("user_metadata", {}).get("avatar_url"),
                    "role": "user"  # Default role
                }
            return None
            
    except Exception as e:
        logger.error(f"Error in get_user: {e}")
        return None

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Get user by email
    
    Args:
        email: Email of the user to retrieve
        
    Returns:
        User data or None if not found
    """
    try:
        response = supabase.table(USERS_TABLE).select("*").eq("email", email).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            # Fallback to auth.users if not found in users table
            auth_response = supabase.from_("auth.users").select("*").eq("email", email).execute()
            if auth_response.data and len(auth_response.data) > 0:
                user_data = auth_response.data[0]
                # Format user data to match expected structure
                return {
                    "id": user_data.get("id"),
                    "email": user_data.get("email"),
                    "name": user_data.get("user_metadata", {}).get("name", "Unknown User"),
                    "avatar_url": user_data.get("user_metadata", {}).get("avatar_url"),
                    "role": "user"  # Default role
                }
            return None
            
    except Exception as e:
        logger.error(f"Error in get_user_by_email: {e}")
        return None

def create_user(user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Create a new user
    
    Args:
        user_data: User data to create
        
    Returns:
        Created user data or None if failed
    """
    try:
        response = supabase.table(USERS_TABLE).insert(user_data).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            return None
            
    except Exception as e:
        logger.error(f"Error in create_user: {e}")
        return None

def update_user(user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Update an existing user
    
    Args:
        user_id: ID of the user to update
        update_data: Updated user data
        
    Returns:
        Updated user data or None if failed
    """
    try:
        response = supabase.table(USERS_TABLE).update(update_data).eq("id", user_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            return None
            
    except Exception as e:
        logger.error(f"Error in update_user: {e}")
        return None
