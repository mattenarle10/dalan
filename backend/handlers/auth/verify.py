"""
Lambda handler for token verification
"""
import json
from typing import Dict, Any, Tuple

from config.settings import logger
from utils.api_gateway import parse_api_gateway_event, create_api_gateway_response, create_error_response
from repositories.users import get_user_by_id
from utils.auth import verify_token, extract_user_id_from_token

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handler for token verification
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    logger.info("Processing token verification request")
    
    try:
        # Parse request body
        body = parse_api_gateway_event(event)
        
        if not body:
            return create_error_response(400, "Missing request body")
            
        # Extract token
        token = body.get("token")
        
        if not token:
            return create_error_response(400, "Missing token")
            
        # Verify token
        is_valid, user_id, error = extract_user_id_from_token(token)
        
        if not is_valid or not user_id:
            return create_error_response(401, f"Invalid token: {error}")
            
        # Get user from database
        user = get_user_by_id(user_id)
        
        if not user:
            return create_error_response(404, "User not found")
            
        # Return user info
        return create_api_gateway_response(200, {
            "valid": True,
            "user": user.dict()
        })
        
    except Exception as e:
        logger.error(f"Error in verify token handler: {e}")
        return create_error_response(500, f"Internal server error: {str(e)}")
