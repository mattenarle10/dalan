"""
Repository for authentication operations
Handles token verification and user authentication
"""
import jwt
import logging
from typing import Dict, Any, Optional
from supabase import create_client, Client

from config.settings import (
    SUPABASE_URL, 
    SUPABASE_KEY,
    JWT_SECRET,
    logger
)
from repositories.users import get_user

# Initialize Supabase client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized successfully in auth repository")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client in auth repository: {e}")
    supabase = None

def get_user_from_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify JWT token and get user data
    
    Args:
        token: JWT token
        
    Returns:
        User data or None if token is invalid
    """
    try:
        # Decode token
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        
        # Get user ID from token
        user_id = payload.get("sub")
        if not user_id:
            logger.error("Token missing 'sub' claim")
            return None
            
        # Get user data
        user = get_user(user_id)
        return user
        
    except jwt.ExpiredSignatureError:
        logger.error("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid token: {e}")
        return None
    except Exception as e:
        logger.error(f"Error in get_user_from_token: {e}")
        return None

def verify_token(token: str) -> bool:
    """
    Verify JWT token
    
    Args:
        token: JWT token
        
    Returns:
        True if token is valid, False otherwise
    """
    try:
        # Decode token
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return True
        
    except jwt.ExpiredSignatureError:
        logger.error("Token expired")
        return False
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid token: {e}")
        return False
    except Exception as e:
        logger.error(f"Error in verify_token: {e}")
        return False
