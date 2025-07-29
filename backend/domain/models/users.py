"""
Domain models for users
"""
from typing import Dict, List, Optional, Any
from datetime import datetime

class User:
    """
    Model for user data
    """
    def __init__(
        self,
        id: str,
        name: str,
        email: str,
        avatar_url: Optional[str] = None,
        role: str = "user",
        created_at: Optional[str] = None
    ):
        self.id = id
        self.name = name
        self.email = email
        self.avatar_url = avatar_url
        self.role = role
        self.created_at = created_at
        
    def dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "avatar_url": self.avatar_url,
            "role": self.role,
            "created_at": self.created_at
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'User':
        """Create from dictionary"""
        return cls(
            id=data.get("id"),
            name=data.get("name", "Unknown User"),
            email=data.get("email"),
            avatar_url=data.get("avatar_url"),
            role=data.get("role", "user"),
            created_at=data.get("created_at")
        )

class UserUpdate:
    """
    Model for updating user data
    """
    def __init__(
        self,
        name: Optional[str] = None,
        email: Optional[str] = None,
        avatar_url: Optional[str] = None,
        role: Optional[str] = None
    ):
        self.name = name
        self.email = email
        self.avatar_url = avatar_url
        self.role = role
        
    def dict(self) -> Dict[str, Any]:
        """Convert to dictionary, excluding None values"""
        return {k: v for k, v in {
            "name": self.name,
            "email": self.email,
            "avatar_url": self.avatar_url,
            "role": self.role
        }.items() if v is not None}
        
    @classmethod
    def from_request(cls, request_data: Dict[str, Any]) -> 'UserUpdate':
        """Create from request data"""
        return cls(
            name=request_data.get("name"),
            email=request_data.get("email"),
            avatar_url=request_data.get("avatar_url"),
            role=request_data.get("role")
        )

class UserResponse:
    """
    Model for user response
    """
    def __init__(
        self,
        id: str,
        name: str,
        email: str,
        avatar_url: Optional[str] = None,
        role: str = "user",
        created_at: Optional[str] = None,
        entries_count: Optional[int] = None
    ):
        self.id = id
        self.name = name
        self.email = email
        self.avatar_url = avatar_url
        self.role = role
        self.created_at = created_at
        self.entries_count = entries_count
        
    def dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        result = {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "avatar_url": self.avatar_url,
            "role": self.role,
            "created_at": self.created_at
        }
        
        if self.entries_count is not None:
            result["entries_count"] = self.entries_count
            
        return result
