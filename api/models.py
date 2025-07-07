from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal, Optional
from datetime import datetime

class UserBase(BaseModel):
    """User information model"""
    id: str
    name: str

class User(UserBase):
    """User model with current user flag"""
    is_current_user: bool = Field(False, alias="isCurrentUser")
    
    model_config = ConfigDict(populate_by_name=True)

class RoadCrackBase(BaseModel):
    """Base model for road crack entries with common fields"""
    title: str
    description: str
    location: str
    coordinates: List[float]  # [longitude, latitude]
    severity: Literal["minor", "major"]
    image: str  # URL to image
    classified_image_url: Optional[str] = None  # URL to classified image with bounding boxes


class RoadCrackCreate(RoadCrackBase):
    """Model for creating a new road crack entry"""
    user_id: str

class RoadCrackUpdate(BaseModel):
    """Model for updating an existing road crack entry"""
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    coordinates: Optional[List[float]] = None
    severity: Optional[Literal["minor", "major"]] = None

class RoadCrackResponse(RoadCrackBase):
    """Complete road crack entry response model"""
    id: str
    date: datetime
    type: str  # Determined by AI
    user: User

    model_config = ConfigDict(from_attributes=True)

class ClassificationResponse(BaseModel):
    """Response model for AI classification"""
    classified_image_url: str
    detections: List[dict]
    total_cracks: int
    crack_types: dict

class CrackDetection(BaseModel):
    """Model for individual crack detection"""
    id: str
    road_crack_id: str
    crack_type: str
    confidence: float
    x1: int
    y1: int
    x2: int
    y2: int
    created_at: datetime

class DetectionSummary(BaseModel):
    """Model for detection summary"""
    id: str
    road_crack_id: str
    total_cracks: int
    crack_types: dict
    created_at: datetime

# For backward compatibility with the existing code
class RoadCrackEntry(RoadCrackResponse):
    """Alias for backward compatibility"""
    pass

class YOLODetection(BaseModel):
    """Model for YOLO detection results"""
    x1: int
    y1: int
    x2: int
    y2: int
    confidence: float
    class_id: int
    label: str
