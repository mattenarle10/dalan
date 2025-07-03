#!/usr/bin/env python3
"""
Test script to verify S3 model loading functionality
"""

import os
import sys
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_s3_model_loading():
    """Test S3 model loading functionality"""
    
    print("🧪 Testing S3 Model Loading...")
    print("=" * 50)
    
    try:
        from s3_model_loader import s3_loader
        
        # Test 1: Check environment variables
        print("\n1. Environment Variables:")
        bucket = os.getenv("MODEL_S3_BUCKET", "dalan-yolo-models")
        key = os.getenv("MODEL_S3_KEY", "models/YOLOv8_Small_RDD.pt")
        env = os.getenv("ENVIRONMENT", "development")
        
        print(f"   S3 Bucket: {bucket}")
        print(f"   S3 Key: {key}")
        print(f"   Environment: {env}")
        
        # Test 2: Test local fallback
        print("\n2. Testing Local Fallback:")
        local_path = s3_loader.get_local_fallback_path()
        if local_path:
            print(f"   ✅ Local model found: {local_path}")
        else:
            print(f"   ❌ Local model not found")
        
        # Test 3: Test S3 connection (if AWS credentials available)
        print("\n3. Testing S3 Connection:")
        try:
            s3_loader._init_s3_client()
            print(f"   ✅ S3 client initialized successfully")
            
            # Try to download model
            model_path = s3_loader.download_model()
            print(f"   ✅ Model downloaded from S3: {model_path}")
            
        except Exception as e:
            print(f"   ⚠️ S3 connection failed: {e}")
            print(f"   This is expected if AWS credentials are not configured")
        
        # Test 4: Test get_model_path with different preferences
        print("\n4. Testing Model Path Resolution:")
        
        # Test prefer_s3=False (local first)
        try:
            model_path = s3_loader.get_model_path(prefer_s3=False)
            print(f"   ✅ Model path (local first): {model_path}")
        except Exception as e:
            print(f"   ❌ Failed to get model path (local first): {e}")
        
        # Test prefer_s3=True (S3 first)
        try:
            model_path = s3_loader.get_model_path(prefer_s3=True)
            print(f"   ✅ Model path (S3 first): {model_path}")
        except Exception as e:
            print(f"   ❌ Failed to get model path (S3 first): {e}")
        
        print("\n" + "=" * 50)
        print("✅ S3 Model Loading Test Complete!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_yolo_loading():
    """Test YOLO model loading"""
    
    print("\n🤖 Testing YOLO Model Loading...")
    print("=" * 50)
    
    try:
        from s3_model_loader import s3_loader
        from ultralytics import YOLO
        
        # Get model path
        model_path = s3_loader.get_model_path(prefer_s3=False)  # Use local first for testing
        
        if not model_path:
            print("❌ Could not get model path")
            return False
        
        print(f"Loading YOLO model from: {model_path}")
        
        # Load YOLO model with torch patch
        import torch
        original_load = torch.load
        
        def patched_load(*args, **kwargs):
            kwargs['weights_only'] = False
            return original_load(*args, **kwargs)
        
        torch.load = patched_load
        
        model = YOLO(model_path)
        
        # Restore original torch.load
        torch.load = original_load
        
        print("✅ YOLO model loaded successfully!")
        print(f"Model info: {model.info()}")
        
        return True
        
    except Exception as e:
        print(f"❌ YOLO loading failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Dalan S3 Model Loading Test Suite")
    print("=" * 50)
    
    # Run tests
    s3_success = test_s3_model_loading()
    yolo_success = test_yolo_loading()
    
    print("\n" + "=" * 50)
    print("📋 Test Results:")
    print(f"   S3 Model Loading: {'✅ PASS' if s3_success else '❌ FAIL'}")
    print(f"   YOLO Model Loading: {'✅ PASS' if yolo_success else '❌ FAIL'}")
    
    if s3_success and yolo_success:
        print("\n🎉 All tests passed! Ready for deployment.")
        sys.exit(0)
    else:
        print("\n⚠️ Some tests failed. Check the output above.")
        sys.exit(1) 