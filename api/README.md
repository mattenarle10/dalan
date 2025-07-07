# Dalan API Backend

**🚀 DEPLOYED & LIVE**: Production API running on AWS Lambda + API Gateway  
**API URL**: `https://vgjyfoc0rd.execute-api.us-east-1.amazonaws.com/prod`

This is the backend for the Dalan AI-Powered Road Crack Mapping App.

- Handles image uploads, AI classification, and database operations
- Provides REST API endpoints for the frontend
- Built with **FastAPI** (Python) + **YOLOv8** AI model
- **Deployed on AWS Lambda** with containerized deployment

## 🏗️ Architecture & Infrastructure

### Cloud Infrastructure (AWS)
- **Lambda Function**: `dalan-backend` (containerized)
- **API Gateway**: REST API with proxy integration
- **ECR Repository**: Container registry for Lambda deployment
- **S3 Bucket**: `dalan-yolo-models` (stores YOLOv8 model)
- **IAM Role**: `dalan-lambda-execution-role` with proper permissions

### Model Storage & Loading
- **YOLOv8 Model**: 85MB trained crack detection model
- **S3 Storage**: `s3://dalan-yolo-models/models/YOLOv8_Small_RDD.pt`
- **Smart Loading**: S3 download with local fallback for development

### Database
- **Supabase**: PostgreSQL database for production
- **Local Development**: SQLite fallback

## 📊 Deployment Status

### ✅ COMPLETED STEPS:
1. **✅ Model Storage Setup** - S3 bucket + model upload
2. **✅ Backend Environment Prep** - Docker containerization 
3. **✅ Backend Deployment** - AWS Lambda + API Gateway

### 🔄 NEXT STEPS:
4. **Supabase Production Setup** - Database configuration
5. **Frontend Deployment** - Vercel deployment
6. **API Gateway Configuration** - CORS & domain setup
7. **End-to-End Testing** - Full stack integration

## 🛠️ Development Setup

### Prerequisites
```bash
# AWS CLI configured with 'dalan' profile
aws configure --profile dalan

# Docker installed for containerization
docker --version
```

### Local Development
```bash
# Navigate to API folder
cd /Users/matt/dalan/api

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload
```

### Environment Variables (.env)
```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# AWS Configuration (for S3 model loading)
AWS_PROFILE=dalan
S3_BUCKET_NAME=dalan-yolo-models
MODEL_S3_KEY=models/YOLOv8_Small_RDD.pt

# Model Configuration
USE_S3_MODEL=true
LOCAL_MODEL_PATH=./YOLOv8_Small_RDD.pt
```

## 🚀 Deployment Architecture

### AWS Lambda Deployment
```bash
# Build and deploy container
python deploy_container_lambda.py
```

**Key Files:**
- `Dockerfile.lambda` - Lambda container definition
- `lambda_handler.py` - AWS Lambda entry point
- `requirements-lambda.txt` - Optimized dependencies
- `s3_model_loader.py` - S3 model management

### Container Specifications
- **Base Image**: `public.ecr.aws/lambda/python:3.9`
- **Architecture**: linux/amd64
- **Size**: ~1.2GB (with PyTorch + OpenCV)
- **Dependencies**: FastAPI, PyTorch 2.0.1, OpenCV, Ultralytics

## 📡 API Endpoints

**Base URL**: `https://vgjyfoc0rd.execute-api.us-east-1.amazonaws.com/prod`

### Available Endpoints:
- `GET /` - API health check
- `GET /docs` - Interactive API documentation
- `GET /api/entries` - Get all road crack entries
- `GET /api/entries/{id}` - Get specific entry
- `POST /api/entries` - Create new entry (with image upload)
- `PUT /api/entries/{id}` - Update entry
- `DELETE /api/entries/{id}` - Delete entry
- `GET /api/users/me` - Get current user (requires auth)

### Testing the API:
```bash
# Health check
curl https://vgjyfoc0rd.execute-api.us-east-1.amazonaws.com/prod/

# View documentation
open https://vgjyfoc0rd.execute-api.us-east-1.amazonaws.com/prod/docs
```

## 🔧 Technical Details

### Dependencies Management
- **requirements.txt** - Development dependencies
- **requirements-lambda.txt** - Production-optimized for Lambda

### Model Loading Strategy
1. **Production**: Downloads model from S3 on cold start
2. **Development**: Falls back to local model file
3. **Caching**: Model cached in Lambda execution context

### Error Handling
- Graceful model loading fallbacks
- Comprehensive API error responses
- Lambda execution context optimization

## 🧹 File Structure
```
api/
├── main.py                    # FastAPI application
├── models.py                  # Pydantic models
├── database.py                # Database connections
├── utils.py                   # Utility functions
├── s3_model_loader.py         # S3 model management
├── lambda_handler.py          # AWS Lambda entry point
├── deploy_container_lambda.py # Deployment script
├── Dockerfile                 # Development container
├── Dockerfile.lambda          # Production Lambda container
├── requirements.txt           # Dev dependencies
├── requirements-lambda.txt    # Production dependencies
└── .dockerignore             # Docker ignore rules
```

## 🌐 Production URLs
- **API**: https://vgjyfoc0rd.execute-api.us-east-1.amazonaws.com/prod
- **Docs**: https://vgjyfoc0rd.execute-api.us-east-1.amazonaws.com/prod/docs
- **Health**: https://vgjyfoc0rd.execute-api.us-east-1.amazonaws.com/prod/

---

**Status**: Backend fully deployed and operational ✅  
**Next**: Supabase production setup + Frontend deployment
