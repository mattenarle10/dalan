"""
Lambda handler for user login
"""
import json
from typing import Dict, Any, Tuple

from config.settings import logger
from utils.api_gateway import parse_api_gateway_event, create_api_gateway_response, create_error_response
from repositories.users import get_user_by_email
from utils.auth import generate_token

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handler for user login
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    logger.info("Processing login request")
    
    try:
        # Parse request body
        body = parse_api_gateway_event(event)
        
        if not body:
            return create_error_response(400, "Missing request body")
            
        # Extract credentials
        email = body.get("email")
        password = body.get("password")
        
        if not email or not password:
            return create_error_response(400, "Missing email or password")
            
        # Get user from database
        user = get_user_by_email(email)
        
        if not user:
            return create_error_response(401, "Invalid credentials")
            
        # In a real application, you would verify the password hash here
        # For now, we'll assume the password is correct for the demo
        
        # Generate JWT token
        success, token, error = generate_token(user.id)
        
        if not success:
            return create_error_response(500, f"Failed to generate token: {error}")
            
        # Return token and user info
        return create_api_gateway_response(200, {
            "token": token,
            "user": user.dict()
        })
        
    except Exception as e:
        logger.error(f"Error in login handler: {e}")
        return create_error_response(500, f"Internal server error: {str(e)}")
