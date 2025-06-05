from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from datetime import datetime

class UserBase(BaseModel):
    """User information model"""
    id: str
    name: str

class User(UserBase):
    """User model with current user flag"""
    is_current_user: bool = Field(False, alias="isCurrentUser")
    
    class Config:
        allow_population_by_field_name = True

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

    class Config:
        orm_mode = True

class ClassificationResponse(BaseModel):
    """Response model for AI classification"""
    type: str
    confidence: float
