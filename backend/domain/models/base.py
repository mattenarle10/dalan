"""
Base domain models for common functionality
"""
from typing import Dict, Any, TypeVar, Type, Optional, List
from datetime import datetime
import json

T = TypeVar('T', bound='BaseModel')

class BaseModel:
    """
    Base model with common functionality for all domain models
    """
    
    def dict(self) -> Dict[str, Any]:
        """
        Convert model to dictionary
        
        Returns:
            Dictionary representation of the model
        """
        return {k: v for k, v in self.__dict__.items() if not k.startswith('_')}
    
    def json(self) -> str:
        """
        Convert model to JSON string
        
        Returns:
            JSON string representation of the model
        """
        return json.dumps(self.dict())
    
    @classmethod
    def from_dict(cls: Type[T], data: Dict[str, Any]) -> T:
        """
        Create model from dictionary
        
        Args:
            data: Dictionary data
            
        Returns:
            Model instance
        """
        return cls(**{k: v for k, v in data.items() if k in cls.__init__.__code__.co_varnames})
    
    @classmethod
    def from_json(cls: Type[T], json_str: str) -> T:
        """
        Create model from JSON string
        
        Args:
            json_str: JSON string
            
        Returns:
            Model instance
        """
        return cls.from_dict(json.loads(json_str))

class PaginatedResult:
    """
    Model for paginated results
    """
    def __init__(
        self,
        items: List[Any],
        total: int,
        page: int = 1,
        page_size: int = 10
    ):
        self.items = items
        self.total = total
        self.page = page
        self.page_size = page_size
        self.total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        
    def dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "items": self.items,
            "total": self.total,
            "page": self.page,
            "page_size": self.page_size,
            "total_pages": self.total_pages
        }
    
    def has_next(self) -> bool:
        """Check if there is a next page"""
        return self.page < self.total_pages
    
    def has_previous(self) -> bool:
        """Check if there is a previous page"""
        return self.page > 1
