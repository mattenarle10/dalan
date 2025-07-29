"""
Lambda handler for getting all road crack entries
"""
import json
import logging
from typing import Dict, Any, Optional

# Import from repositories instead of directly from database
from repositories.entries import get_all_entries
from repositories.users import get_user
from utils.formatters import format_entry_response
from config.settings import logger

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for GET /api/entries endpoint
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response with formatted entries
    """
    try:
        # Parse query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        user_id = query_params.get('user_id')
        severity = query_params.get('severity')
        crack_type = query_params.get('type')
        
        # Get entries from database
        entries = get_all_entries(user_id, severity, crack_type)
        
        # Format entries with user data
        formatted_entries = []
        for entry in entries:
            user = get_user(entry["user_id"])
            if not user:
                continue
                
            formatted_entry = format_entry_response(entry, user)
            if formatted_entry:
                formatted_entries.append(formatted_entry)
        
        # Return successful response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(formatted_entries)
        }
        
    except Exception as e:
        # Log error and return error response
        logger.error(f"Error in get_entries: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }
