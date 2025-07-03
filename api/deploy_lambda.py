#!/usr/bin/env python3
"""
Deploy Dalan Backend to AWS Lambda
"""

import os
import subprocess
import zipfile
import boto3
import tempfile
import shutil
from pathlib import Path
import json

def create_lambda_package():
    """Create deployment package for Lambda"""
    
    print("🚀 Creating Lambda deployment package...")
    
    # Create temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        package_dir = Path(temp_dir) / "lambda_package"
        package_dir.mkdir()
        
        print(f"📦 Using temp directory: {package_dir}")
        
        # Install dependencies
        print("📥 Installing dependencies...")
        subprocess.run([
            "pip", "install", "-r", "requirements.txt", 
            "-t", str(package_dir)
        ], check=True)
        
        # Clean up unnecessary files to reduce package size
        print("🧹 Optimizing package size...")
        cleanup_patterns = [
            "**/__pycache__",
            "**/*.pyc",
            "**/*.pyo", 
            "**/*.pyd",
            "**/tests",
            "**/test",
            "**/*.egg-info",
            "**/docs",
            "**/examples",
            "**/sample*",
            "**/*.md",
            "**/*.txt",
            "**/LICENSE*",
            "**/NOTICE*",
            "**/README*",
            "**/CHANGELOG*",
            "**/.git*",
            "**/dist-info",
            "PIL/.libs",  # Remove large PIL libraries
            "cv2/data",   # Remove OpenCV data files
            "numpy/tests",
            "torch/test",
            "torchvision/datasets"
        ]
        
        import glob
        for pattern in cleanup_patterns:
            for path in glob.glob(str(package_dir / pattern), recursive=True):
                path_obj = Path(path)
                if path_obj.exists():
                    if path_obj.is_dir():
                        shutil.rmtree(path_obj, ignore_errors=True)
                    else:
                        path_obj.unlink(missing_ok=True)
        
        print(f"📦 Package optimized")
        
        # Check final size
        total_size = sum(f.stat().st_size for f in package_dir.rglob('*') if f.is_file())
        print(f"📊 Final package size: {total_size / 1024 / 1024:.1f} MB")
        
        # Copy application files
        print("📄 Copying application files...")
        files_to_copy = [
            "lambda_handler.py",
            "main.py", 
            "database.py",
            "models.py",
            "utils.py",
            "s3_model_loader.py"
        ]
        
        for file_name in files_to_copy:
            if os.path.exists(file_name):
                shutil.copy2(file_name, package_dir)
                print(f"   ✅ Copied {file_name}")
            else:
                print(f"   ⚠️ Warning: {file_name} not found")
        
        # Create deployment zip
        zip_path = "lambda_deployment.zip"
        print(f"📝 Creating deployment zip: {zip_path}")
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for root, dirs, files in os.walk(package_dir):
                for file in files:
                    file_path = Path(root) / file
                    arc_name = file_path.relative_to(package_dir)
                    zip_file.write(file_path, arc_name)
        
        print(f"✅ Package created: {zip_path}")
        print(f"📊 Package size: {os.path.getsize(zip_path) / 1024 / 1024:.1f} MB")
        
        return zip_path

def deploy_to_lambda(zip_path):
    """Deploy package to AWS Lambda"""
    
    function_name = "dalan-backend"
    s3_bucket = "dalan-yolo-models"  # Use existing bucket
    s3_key = f"lambda-deployments/{function_name}.zip"
    
    print(f"🚀 Deploying to Lambda function: {function_name}")
    
    # Check package size
    package_size_mb = os.path.getsize(zip_path) / 1024 / 1024
    if package_size_mb > 50:
        print(f"📦 Package too large ({package_size_mb:.1f} MB), uploading to S3...")
        
        # Upload to S3 first
        s3_client = boto3.client('s3', region_name='us-east-1')
        print(f"📤 Uploading to s3://{s3_bucket}/{s3_key}")
        s3_client.upload_file(zip_path, s3_bucket, s3_key)
        print("✅ Uploaded to S3")
        
        # Use S3 reference for Lambda
        code_config = {
            'S3Bucket': s3_bucket,
            'S3Key': s3_key
        }
    else:
        # Direct upload for smaller packages
        with open(zip_path, 'rb') as zip_file:
            zip_data = zip_file.read()
        code_config = {'ZipFile': zip_data}
    
    # Initialize Lambda client with region
    lambda_client = boto3.client('lambda', region_name='us-east-1')
    
    try:
        # Check if function exists
        try:
            lambda_client.get_function(FunctionName=function_name)
            function_exists = True
            print(f"📍 Function {function_name} exists, updating...")
        except lambda_client.exceptions.ResourceNotFoundException:
            function_exists = False
            print(f"🆕 Function {function_name} doesn't exist, creating...")
        
        if function_exists:
            # Update existing function
            if 'ZipFile' in code_config:
                response = lambda_client.update_function_code(
                    FunctionName=function_name,
                    ZipFile=code_config['ZipFile']
                )
            else:
                response = lambda_client.update_function_code(
                    FunctionName=function_name,
                    S3Bucket=code_config['S3Bucket'],
                    S3Key=code_config['S3Key']
                )
            print("✅ Function code updated")
        else:
            # Create new function
            response = lambda_client.create_function(
                FunctionName=function_name,
                Runtime='python3.9',
                Role=f'arn:aws:iam::{get_account_id()}:role/dalan-lambda-execution-role',
                Handler='lambda_handler.lambda_handler',
                Code=code_config,
                Environment={
                    'Variables': {
                        'MODEL_S3_BUCKET': 'dalan-yolo-models',
                        'MODEL_S3_KEY': 'models/YOLOv8_Small_RDD.pt',
                        'ENVIRONMENT': 'production'
                    }
                },
                Timeout=60,
                MemorySize=1024
            )
            print("✅ Function created")
        
        # Update environment variables
        lambda_client.update_function_configuration(
            FunctionName=function_name,
            Environment={
                'Variables': {
                    'MODEL_S3_BUCKET': 'dalan-yolo-models',
                    'MODEL_S3_KEY': 'models/YOLOv8_Small_RDD.pt',
                    'ENVIRONMENT': 'production'
                }
            }
        )
        
        print(f"✅ Deployment complete!")
        print(f"Function ARN: {response['FunctionArn']}")
        
        return response
        
    except Exception as e:
        print(f"❌ Deployment failed: {e}")
        return None

def get_account_id():
    """Get AWS account ID"""
    sts = boto3.client('sts', region_name='us-east-1')
    return sts.get_caller_identity()['Account']

def main():
    """Main deployment function"""
    
    print("🚀 Dalan Backend Lambda Deployment")
    print("=" * 50)
    
    # Create package
    zip_path = create_lambda_package()
    
    # Deploy to Lambda
    result = deploy_to_lambda(zip_path)
    
    if result:
        print("\n🎉 Deployment successful!")
        print("\nNext steps:")
        print("1. Set up API Gateway")
        print("2. Configure custom domain")
        print("3. Test the endpoints")
    else:
        print("\n❌ Deployment failed!")
    
    # Clean up
    if os.path.exists(zip_path):
        os.remove(zip_path)
        print(f"🧹 Cleaned up: {zip_path}")

if __name__ == "__main__":
    main() 