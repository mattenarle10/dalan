#!/usr/bin/env python3
"""
Deploy Dalan Backend to AWS Lambda using Container
"""

import os
import subprocess
import boto3
import base64

def get_account_id():
    """Get AWS account ID"""
    sts = boto3.client('sts', region_name='us-east-1')
    return sts.get_caller_identity()['Account']

def deploy_container_lambda():
    """Deploy containerized Lambda function"""
    
    account_id = get_account_id()
    region = 'us-east-1'
    function_name = 'dalan-backend'
    repo_name = 'dalan-backend'
    
    print("🚀 Deploying Containerized Lambda Function")
    print("=" * 50)
    
    # Build Docker image
    print("🔨 Building Docker image...")
    subprocess.run([
        "docker", "build", 
        "-f", "Dockerfile.lambda",
        "-t", f"{repo_name}:latest", 
        "."
    ], check=True)
    
    # Create ECR repository if it doesn't exist
    print("📦 Setting up ECR repository...")
    ecr_client = boto3.client('ecr', region_name=region)
    
    try:
        ecr_client.create_repository(repositoryName=repo_name)
        print(f"✅ Created ECR repository: {repo_name}")
    except ecr_client.exceptions.RepositoryAlreadyExistsException:
        print(f"📍 ECR repository already exists: {repo_name}")
    
    # Get ECR login token
    print("🔐 Getting ECR login...")
    login_response = ecr_client.get_authorization_token()
    
    # Decode the token properly
    token = login_response['authorizationData'][0]['authorizationToken']
    username, password = base64.b64decode(token).decode().split(':')
    
    # Login to ECR
    print(f"🔑 Logging into ECR...")
    subprocess.run([
        "docker", "login", 
        "--username", username,
        "--password", password,
        f"{account_id}.dkr.ecr.{region}.amazonaws.com"
    ], check=True)
    
    # Tag and push image
    image_uri = f"{account_id}.dkr.ecr.{region}.amazonaws.com/{repo_name}:latest"
    
    print(f"🏷️ Tagging image: {image_uri}")
    subprocess.run([
        "docker", "tag", f"{repo_name}:latest", image_uri
    ], check=True)
    
    print(f"📤 Pushing to ECR...")
    subprocess.run([
        "docker", "push", image_uri
    ], check=True)
    
    # Create or update Lambda function
    print(f"🔧 Deploying Lambda function: {function_name}")
    lambda_client = boto3.client('lambda', region_name=region)
    
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
            response = lambda_client.update_function_code(
                FunctionName=function_name,
                ImageUri=image_uri
            )
            print("✅ Function code updated")
        else:
            # Create new function
            response = lambda_client.create_function(
                FunctionName=function_name,
                Role=f'arn:aws:iam::{account_id}:role/dalan-lambda-execution-role',
                Code={'ImageUri': image_uri},
                PackageType='Image',
                Environment={
                    'Variables': {
                        'MODEL_S3_BUCKET': 'dalan-yolo-models',
                        'MODEL_S3_KEY': 'models/YOLOv8_Small_RDD.pt',
                        'ENVIRONMENT': 'production'
                    }
                },
                Timeout=60,
                MemorySize=2048  # Increased for YOLO model
            )
            print("✅ Function created")
        
        print(f"✅ Deployment complete!")
        print(f"Function ARN: {response['FunctionArn']}")
        print(f"Image URI: {image_uri}")
        
        return response
        
    except Exception as e:
        print(f"❌ Deployment failed: {e}")
        return None

if __name__ == "__main__":
    deploy_container_lambda() 