"""
Utility functions for authentication and JWT token handling
"""
import jwt
import time
from typing import Dict, Any, Optional, Tuple
from config.settings import logger, JWT_SECRET, JWT_ALGORITHM

def verify_token(token: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """
    Verify JWT token and extract payload
    
    Args:
        token: JWT token string
        
    Returns:
        Tuple of (is_valid, payload, error_message)
    """
    if not token:
        return False, None, "No token provided"
        
    try:
        # Decode the token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Check if token is expired
        if 'exp' in payload and payload['exp'] < time.time():
            return False, None, "Token has expired"
            
        return True, payload, None
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return False, None, "Token has expired"
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        return False, None, f"Invalid token: {str(e)}"
    except Exception as e:
        logger.error(f"Error verifying token: {e}")
        return False, None, f"Error verifying token: {str(e)}"

def extract_user_id_from_token(token: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Extract user ID from JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        Tuple of (is_valid, user_id, error_message)
    """
    is_valid, payload, error = verify_token(token)
    
    if not is_valid or not payload:
        return False, None, error
        
    # Extract user ID from payload
    user_id = payload.get('sub') or payload.get('user_id')
    
    if not user_id:
        return False, None, "User ID not found in token"
        
    return True, user_id, None

def generate_token(user_id: str, expires_in_seconds: int = 86400) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Generate JWT token for user
    
    Args:
        user_id: User ID
        expires_in_seconds: Token expiration time in seconds (default: 24 hours)
        
    Returns:
        Tuple of (success, token, error_message)
    """
    try:
        payload = {
            'sub': user_id,
            'iat': int(time.time()),
            'exp': int(time.time()) + expires_in_seconds
        }
        
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        # jwt.encode can return bytes in some versions of PyJWT
        if isinstance(token, bytes):
            token = token.decode('utf-8')
            
        return True, token, None
    except Exception as e:
        logger.error(f"Error generating token: {e}")
        return False, None, f"Error generating token: {str(e)}"

def check_user_permission(user_id: str, resource_owner_id: str, is_admin: bool = False) -> bool:
    """
    Check if user has permission to access a resource
    
    Args:
        user_id: User ID requesting access
        resource_owner_id: User ID of resource owner
        is_admin: Whether the user is an admin
        
    Returns:
        True if user has permission, False otherwise
    """
    # Admins have access to all resources
    if is_admin:
        return True
        
    # Users can only access their own resources
    return user_id == resource_owner_id
