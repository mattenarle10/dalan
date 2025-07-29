from fastapi import APIRouter, Depends, HTTPException
from routers.auth import get_current_user
from database import get_user
from config import logger

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/me")
async def get_current_user_endpoint(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user with full details"""
    try:
        # Get full user details from database
        user_id = current_user["id"]
        user_data = get_user(user_id)
        
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Add current user flag
        user_data["isCurrentUser"] = True
            
        return user_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_current_user_endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
