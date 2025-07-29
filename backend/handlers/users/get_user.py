"""
Lambda handler for getting user information
"""
import json
from typing import Dict, Any, Optional

from config.settings import logger
from utils.api_gateway import parse_api_gateway_event, create_api_gateway_response, create_error_response
from utils.auth import extract_user_id_from_token
from repositories.users import get_user
from utils.formatters import format_user_response
from domain.models.users import User, UserResponse

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handler for getting user information
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    logger.info("Processing get user request")
    
    try:
        # Extract path parameters
        path_parameters = event.get('pathParameters', {})
        
        if not path_parameters:
            return create_error_response(400, "Missing path parameters")
            
        user_id = path_parameters.get('user_id')
        
        if not user_id:
            return create_error_response(400, "Missing user ID")
            
        # Get authorization header
        headers = event.get('headers', {})
        auth_header = headers.get('Authorization') or headers.get('authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return create_error_response(401, "Missing or invalid authorization header")
            
        # Extract token
        token = auth_header.split(' ')[1]
        
        # Verify token and extract user ID
        is_valid, current_user_id, error = extract_user_id_from_token(token)
        
        if not is_valid or not current_user_id:
            return create_error_response(401, f"Invalid token: {error}")
            
        # Get user from database
        user_data = get_user(user_id)
        
        if not user_data:
            return create_error_response(404, "User not found")
            
        # Create user object
        user = User.from_dict(user_data)
        
        # Format response
        response = format_user_response(user, is_current_user=(current_user_id == user_id))
        
        # Return user info
        return create_api_gateway_response(200, response)
        
    except Exception as e:
        logger.error(f"Error in get user handler: {e}")
        return create_error_response(500, f"Internal server error: {str(e)}")
