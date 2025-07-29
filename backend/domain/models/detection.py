"""
Domain models for crack detection
"""
from typing import Dict, List, Optional, Any
from datetime import datetime

class Detection:
    """
    Model for a single crack detection
    """
    def __init__(
        self,
        id: Optional[str] = None,
        road_crack_id: str = None,
        crack_type: str = None,
        confidence: float = 0.0,
        x1: int = 0,
        y1: int = 0,
        x2: int = 0,
        y2: int = 0,
        created_at: Optional[str] = None
    ):
        self.id = id
        self.road_crack_id = road_crack_id
        self.crack_type = crack_type
        self.confidence = confidence
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
        self.created_at = created_at
        
    def dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "road_crack_id": self.road_crack_id,
            "crack_type": self.crack_type,
            "confidence": self.confidence,
            "x1": self.x1,
            "y1": self.y1,
            "x2": self.x2,
            "y2": self.y2,
            "created_at": self.created_at
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Detection':
        """Create from dictionary"""
        return cls(
            id=data.get("id"),
            road_crack_id=data.get("road_crack_id"),
            crack_type=data.get("crack_type"),
            confidence=data.get("confidence", 0.0),
            x1=data.get("x1", 0),
            y1=data.get("y1", 0),
            x2=data.get("x2", 0),
            y2=data.get("y2", 0),
            created_at=data.get("created_at")
        )
        
    @classmethod
    def from_yolo_result(cls, road_crack_id: str, detection: Dict[str, Any]) -> 'Detection':
        """Create from YOLO detection result"""
        return cls(
            road_crack_id=road_crack_id,
            crack_type=detection.get("label", "unknown"),
            confidence=detection.get("confidence", 0.0),
            x1=detection.get("x1", 0),
            y1=detection.get("y1", 0),
            x2=detection.get("x2", 0),
            y2=detection.get("y2", 0)
        )

class DetectionSummary:
    """
    Model for detection summary
    """
    def __init__(
        self,
        id: Optional[str] = None,
        road_crack_id: str = None,
        total_cracks: int = 0,
        crack_types: Dict[str, Dict[str, Any]] = None,
        created_at: Optional[str] = None
    ):
        self.id = id
        self.road_crack_id = road_crack_id
        self.total_cracks = total_cracks
        self.crack_types = crack_types or {}
        self.created_at = created_at
        
    def dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "road_crack_id": self.road_crack_id,
            "total_cracks": self.total_cracks,
            "crack_types": self.crack_types,
            "created_at": self.created_at
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DetectionSummary':
        """Create from dictionary"""
        return cls(
            id=data.get("id"),
            road_crack_id=data.get("road_crack_id"),
            total_cracks=data.get("total_cracks", 0),
            crack_types=data.get("crack_types", {}),
            created_at=data.get("created_at")
        )
        
    @classmethod
    def from_yolo_result(cls, road_crack_id: str, result: Dict[str, Any]) -> 'DetectionSummary':
        """Create from YOLO detection result"""
        return cls(
            road_crack_id=road_crack_id,
            total_cracks=result.get("total_cracks", 0),
            crack_types=result.get("crack_types", {})
        )

class DetectionResult:
    """
    Model for complete detection result
    """
    def __init__(
        self,
        summary: DetectionSummary,
        detections: List[Detection],
        classified_image_url: Optional[str] = None
    ):
        self.summary = summary
        self.detections = detections
        self.classified_image_url = classified_image_url
        
    def dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "summary": self.summary.dict(),
            "detections": [detection.dict() for detection in self.detections],
            "classified_image_url": self.classified_image_url
        }
        
    @classmethod
    def from_yolo_result(cls, road_crack_id: str, result: Dict[str, Any]) -> 'DetectionResult':
        """Create from YOLO detection result"""
        summary = DetectionSummary.from_yolo_result(road_crack_id, result)
        detections = [
            Detection.from_yolo_result(road_crack_id, detection)
            for detection in result.get("detections", [])
        ]
        return cls(
            summary=summary,
            detections=detections,
            classified_image_url=result.get("classified_image_url")
        )
