"""
Utility functions for formatting responses
"""
from typing import Dict, Any, Optional

def format_entry_response(entry: Dict[str, Any], user: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Format road crack entry response with user data
    
    Args:
        entry: Road crack entry data
        user: User data
        
    Returns:
        Formatted entry response or None if error
    """
    try:
        if not entry or not user:
            return None
            
        # Format user data
        user_data = {
            "id": user.get("id"),
            "name": user.get("name", "Unknown User"),
            "email": user.get("email"),
            "avatar_url": user.get("avatar_url")
        }
        
        # Format entry data
        formatted_entry = {
            "id": entry.get("id"),
            "title": entry.get("title"),
            "description": entry.get("description"),
            "location": entry.get("location"),
            "coordinates": entry.get("coordinates"),
            "severity": entry.get("severity"),
            "type": entry.get("type", "unknown"),
            "image_url": entry.get("image_url"),
            "classified_image_url": entry.get("classified_image_url"),
            "created_at": entry.get("created_at"),
            "updated_at": entry.get("updated_at"),
            "user": user_data
        }
        
        return formatted_entry
        
    except Exception as e:
        from config.settings import logger
        logger.error(f"Error in format_entry_response: {e}")
        return None

def format_detection_response(detection: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format crack detection response
    
    Args:
        detection: Crack detection data
        
    Returns:
        Formatted detection response
    """
    return {
        "id": detection.get("id"),
        "road_crack_id": detection.get("road_crack_id"),
        "crack_type": detection.get("crack_type"),
        "confidence": detection.get("confidence"),
        "x1": detection.get("x1"),
        "y1": detection.get("y1"),
        "x2": detection.get("x2"),
        "y2": detection.get("y2"),
        "created_at": detection.get("created_at")
    }

def format_detection_summary_response(summary: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format detection summary response
    
    Args:
        summary: Detection summary data
        
    Returns:
        Formatted summary response
    """
    return {
        "id": summary.get("id"),
        "road_crack_id": summary.get("road_crack_id"),
        "total_cracks": summary.get("total_cracks"),
        "crack_types": summary.get("crack_types"),
        "created_at": summary.get("created_at")
    }

def format_user_response(user: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format user response
    
    Args:
        user: User data
        
    Returns:
        Formatted user response
    """
    return {
        "id": user.get("id"),
        "name": user.get("name", "Unknown User"),
        "email": user.get("email"),
        "avatar_url": user.get("avatar_url"),
        "role": user.get("role", "user"),
        "created_at": user.get("created_at")
    }
