from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os
from database import get_auth_user
from models import User
from config import logger, SUPABASE_JWT_SECRET

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Auth middleware
security = HTTPBearer()

def verify_supabase_token(token: str) -> dict:
    """
    Verify Supabase JWT token and extract user info
    
    Args:
        token (str): JWT token from Authorization header
        
    Returns:
        dict: User info from token payload
        
    Raises:
        HTTPException: If token is invalid
    """
    try:
        # Supabase JWT secret (from your Supabase dashboard)
        jwt_secret = SUPABASE_JWT_SECRET
        if not jwt_secret:
            # For development, we can skip JWT verification
            # In production, you MUST set SUPABASE_JWT_SECRET
            logger.warning("SUPABASE_JWT_SECRET not set, skipping JWT verification (DEV MODE)")
            return {"sub": "ec74d8c5-a458-4191-9464-bdf90a8932bc", "email": "enarlem10@gmail.com"}
        
        # Verify and decode the JWT token with proper options for Supabase
        payload = jwt.decode(
            token, 
            jwt_secret, 
            algorithms=["HS256"],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_aud": False  # Disable audience verification for Supabase tokens
            }
        )
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except Exception as e:
        logger.error(f"Error verifying token: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    FastAPI dependency to get current authenticated user
    
    Args:
        credentials: Bearer token from Authorization header
        
    Returns:
        dict: Current user info
    """
    try:
        token = credentials.credentials
        payload = verify_supabase_token(token)
        
        # Extract user ID from token
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid user ID in token")
            
        # Extract more user data from the JWT payload
        user_metadata = payload.get("user_metadata", {})
        
        return {
            "id": user_id,
            "email": payload.get("email", ""),
            "name": user_metadata.get("full_name") or user_metadata.get("name") or payload.get("email", "").split("@")[0],
            "avatar_url": user_metadata.get("avatar_url") or user_metadata.get("picture"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_current_user: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication")

@router.get("/me")
def get_current_user_endpoint(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user"""
    return current_user
