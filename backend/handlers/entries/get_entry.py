"""
Lambda handler for getting a specific road crack entry by ID
"""
import json
from typing import Dict, Any

# Import from repositories instead of directly from database
from repositories.entries import get_entry_by_id
from repositories.users import get_user
from repositories.detection import get_detection_summary
from utils.formatters import format_entry_response
from config.settings import logger

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for GET /api/entries/{entry_id} endpoint
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response with formatted entry
    """
    try:
        # Extract path parameters
        path_parameters = event.get('pathParameters', {}) or {}
        entry_id = path_parameters.get('entry_id')
        
        if not entry_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Missing entry_id parameter'
                })
            }
        
        # Get entry from database
        entry = get_entry_by_id(entry_id)
        if not entry:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Entry not found'
                })
            }
        
        # Get user info
        user = get_user(entry["user_id"])
        if not user:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'User not found'
                })
            }
        
        # Format entry
        formatted_entry = format_entry_response(entry, user)
        if not formatted_entry:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Error formatting entry'
                })
            }
        
        # Get detection summary
        detection_summary = get_detection_summary(entry_id)
        
        # Add detection info to response
        if detection_summary:
            formatted_entry["detection_info"] = {
                "total_cracks": detection_summary["total_cracks"],
                "crack_types": detection_summary["crack_types"],
                "status": "completed"
            }
        else:
            # No detection info yet
            formatted_entry["detection_info"] = {
                "total_cracks": 0,
                "crack_types": {},
                "status": "pending"
            }
        
        # Return successful response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(formatted_entry)
        }
        
    except Exception as e:
        # Log error and return error response
        logger.error(f"Error in get_entry: {e}")
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
