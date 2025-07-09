"""
Test script to verify that the API can run with our new folder structure
"""
import logging
import sys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    logger.info("Testing imports with new folder structure...")
    
    # Test importing config
    from config import API_TITLE, API_VERSION, logger
    logger.info("✅ Config imports successful")
    
    # Test importing models
    from models import UserBase, RoadCrackBase
    logger.info("✅ Models imports successful")
    
    # Test importing database
    from database import get_all_entries, get_user
    logger.info("✅ Database imports successful")
    
    # Test importing utils
    from utils import format_entry_response, save_image_to_s3
    logger.info("✅ Utils imports successful")
    
    # Test importing routers
    from routers import entries, auth, users
    logger.info("✅ Routers imports successful")
    
    # Test importing services
    from services import detection, storage
    logger.info("✅ Services imports successful")
    
    # Test importing main app
    import main
    logger.info("✅ Main app import successful")
    
    logger.info("All imports successful! The new folder structure works correctly.")
    sys.exit(0)
except Exception as e:
    logger.error(f"❌ Test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
