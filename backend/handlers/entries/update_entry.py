"""
Lambda handler for updating an existing road crack entry
"""
import json
import traceback
from typing import Dict, Any

# Import from repositories instead of directly from database
from repositories.entries import get_entry_by_id, update_entry as db_update_entry
from repositories.users import get_user
from repositories.auth import get_user_from_token
from utils.formatters import format_entry_response
from config.settings import logger
from domain.models.entries import RoadCrackUpdate

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for PUT /api/entries/{entry_id} endpoint
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response with formatted updated entry
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
            
        # Parse request body
        if event.get('isBase64Encoded', False):
            import base64
            body = json.loads(base64.b64decode(event.get('body', '')).decode('utf-8'))
        else:
            body = json.loads(event.get('body', '{}'))
            
        # Get authorization token
        headers = event.get('headers', {}) or {}
        auth_header = headers.get('Authorization') or headers.get('authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Unauthorized'
                })
            }
            
        token = auth_header.split(' ')[1]
        current_user = get_user_from_token(token)
        if not current_user:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Invalid token'
                })
            }
            
        # Check if entry exists
        existing_entry = get_entry_by_id(entry_id)
        if not existing_entry:
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
            
        # Create a RoadCrackUpdate object from the request body
        # In a serverless environment, we're not using Pydantic validation directly
        # But we still want to filter the fields that can be updated
        allowed_fields = ["title", "description", "location", "coordinates", "severity", "type"]
        update_data = {k: v for k, v in body.items() if k in allowed_fields and v is not None}
        
        # Update entry
        updated_entry = db_update_entry(entry_id, update_data)
        if not updated_entry:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Failed to update entry'
                })
            }
        
        # Get user info
        user = get_user(updated_entry["user_id"])
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
        formatted_entry = format_entry_response(updated_entry, user)
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
        logger.error(f"Error in update_entry: {e}")
        logger.error(traceback.format_exc())
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
