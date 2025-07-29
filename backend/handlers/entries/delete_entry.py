"""
Lambda handler for deleting a road crack entry
"""
import json
import traceback
from typing import Dict, Any

# Import from repositories instead of directly from database
from repositories.entries import get_entry_by_id, delete_entry as db_delete_entry
from repositories.auth import get_user_from_token
from config.settings import logger

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for DELETE /api/entries/{entry_id} endpoint
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response with deletion status
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
            
        # Check if user has permission to delete the entry
        # For example, only the owner or an admin can delete an entry
        if existing_entry["user_id"] != current_user["id"] and current_user.get("role") != "admin":
            return {
                'statusCode': 403,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Permission denied'
                })
            }
            
        # Delete entry
        success = db_delete_entry(entry_id)
        if not success:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Failed to delete entry'
                })
            }
        
        # Return successful response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Entry deleted successfully'
            })
        }
        
    except Exception as e:
        # Log error and return error response
        logger.error(f"Error in delete_entry: {e}")
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
