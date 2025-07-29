"""
Domain models for road crack entries
"""
from typing import Dict, List, Optional, Any
from datetime import datetime
import json

class RoadCrackCreate:
    """
    Model for creating a new road crack entry
    """
    def __init__(
        self,
        title: str,
        description: str,
        location: str,
        coordinates: List[float],
        severity: str,
        user_id: str
    ):
        self.title = title
        self.description = description
        self.location = location
        self.coordinates = coordinates
        self.severity = severity
        self.user_id = user_id
        
    def dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "title": self.title,
            "description": self.description,
            "location": self.location,
            "coordinates": self.coordinates,
            "severity": self.severity,
            "user_id": self.user_id
        }
        
    @classmethod
    def from_request(cls, request_data: Dict[str, Any]) -> 'RoadCrackCreate':
        """Create from request data"""
        coordinates = request_data.get("coordinates")
        if isinstance(coordinates, str):
            coordinates = json.loads(coordinates)
            
        return cls(
            title=request_data.get("title"),
            description=request_data.get("description"),
            location=request_data.get("location"),
            coordinates=coordinates,
            severity=request_data.get("severity"),
            user_id=request_data.get("user_id")
        )

class RoadCrackUpdate:
    """
    Model for updating an existing road crack entry
    """
    def __init__(
        self,
        title: Optional[str] = None,
        description: Optional[str] = None,
        location: Optional[str] = None,
        coordinates: Optional[List[float]] = None,
        severity: Optional[str] = None,
        type: Optional[str] = None,
        classified_image_url: Optional[str] = None
    ):
        self.title = title
        self.description = description
        self.location = location
        self.coordinates = coordinates
        self.severity = severity
        self.type = type
        self.classified_image_url = classified_image_url
        
    def dict(self) -> Dict[str, Any]:
        """Convert to dictionary, excluding None values"""
        return {k: v for k, v in {
            "title": self.title,
            "description": self.description,
            "location": self.location,
            "coordinates": self.coordinates,
            "severity": self.severity,
            "type": self.type,
            "classified_image_url": self.classified_image_url
        }.items() if v is not None}
        
    @classmethod
    def from_request(cls, request_data: Dict[str, Any]) -> 'RoadCrackUpdate':
        """Create from request data"""
        coordinates = request_data.get("coordinates")
        if isinstance(coordinates, str):
            try:
                coordinates = json.loads(coordinates)
            except:
                coordinates = None
                
        return cls(
            title=request_data.get("title"),
            description=request_data.get("description"),
            location=request_data.get("location"),
            coordinates=coordinates,
            severity=request_data.get("severity"),
            type=request_data.get("type"),
            classified_image_url=request_data.get("classified_image_url")
        )

class RoadCrackResponse:
    """
    Model for road crack entry response
    """
    def __init__(
        self,
        id: str,
        title: str,
        description: str,
        location: str,
        coordinates: List[float],
        severity: str,
        type: str,
        image_url: str,
        classified_image_url: Optional[str],
        created_at: str,
        updated_at: Optional[str],
        user: Dict[str, Any],
        detection_info: Optional[Dict[str, Any]] = None
    ):
        self.id = id
        self.title = title
        self.description = description
        self.location = location
        self.coordinates = coordinates
        self.severity = severity
        self.type = type
        self.image_url = image_url
        self.classified_image_url = classified_image_url
        self.created_at = created_at
        self.updated_at = updated_at
        self.user = user
        self.detection_info = detection_info
        
    def dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "location": self.location,
            "coordinates": self.coordinates,
            "severity": self.severity,
            "type": self.type,
            "image_url": self.image_url,
            "classified_image_url": self.classified_image_url,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "user": self.user,
            "detection_info": self.detection_info
        }
