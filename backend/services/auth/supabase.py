"""
Service for Supabase authentication operations
"""
from typing import Dict, Optional, Any, Tuple
import json
from supabase import create_client, Client

from config.settings import logger, SUPABASE_URL, SUPABASE_KEY
from domain.models.users import User

def get_supabase_client() -> Optional[Client]:
    """
    Get Supabase client
    
    Returns:
        Supabase client or None if failed
    """
    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        return client
    except Exception as e:
        logger.error(f"Error creating Supabase client: {e}")
        return None

def authenticate_user(email: str, password: str) -> Tuple[bool, Optional[User], Optional[str]]:
    """
    Authenticate user with email and password
    
    Args:
        email: User email
        password: User password
        
    Returns:
        Tuple of (success, user, error)
    """
    try:
        # Get Supabase client
        client = get_supabase_client()
        
        if not client:
            return False, None, "Failed to connect to database"
            
        # Sign in with email and password
        response = client.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        # Extract user data
        user_data = response.user
        
        if not user_data:
            return False, None, "Invalid credentials"
            
        # Create user object
        user = User(
            id=user_data.id,
            name=user_data.user_metadata.get("name", "Unknown User"),
            email=user_data.email,
            avatar_url=user_data.user_metadata.get("avatar_url"),
            role=user_data.user_metadata.get("role", "user")
        )
        
        return True, user, None
        
    except Exception as e:
        logger.error(f"Error authenticating user: {e}")
        return False, None, f"Authentication error: {str(e)}"

def register_user(name: str, email: str, password: str) -> Tuple[bool, Optional[User], Optional[str]]:
    """
    Register new user
    
    Args:
        name: User name
        email: User email
        password: User password
        
    Returns:
        Tuple of (success, user, error)
    """
    try:
        # Get Supabase client
        client = get_supabase_client()
        
        if not client:
            return False, None, "Failed to connect to database"
            
        # Sign up with email and password
        response = client.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "name": name,
                    "role": "user"
                }
            }
        })
        
        # Extract user data
        user_data = response.user
        
        if not user_data:
            return False, None, "Failed to register user"
            
        # Create user object
        user = User(
            id=user_data.id,
            name=name,
            email=email,
            role="user"
        )
        
        return True, user, None
        
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        return False, None, f"Registration error: {str(e)}"

def get_user_by_id(user_id: str) -> Optional[User]:
    """
    Get user by ID
    
    Args:
        user_id: User ID
        
    Returns:
        User object or None if not found
    """
    try:
        # Get Supabase client
        client = get_supabase_client()
        
        if not client:
            logger.error("Failed to connect to database")
            return None
            
        # Query user from database
        response = client.table("users").select("*").eq("id", user_id).execute()
        
        if not response.data or len(response.data) == 0:
            logger.warning(f"User not found: {user_id}")
            return None
            
        # Extract user data
        user_data = response.data[0]
        
        # Create user object
        user = User.from_dict(user_data)
        
        return user
        
    except Exception as e:
        logger.error(f"Error getting user: {e}")
        return None
