# Dalan Backend - Serverless Architecture

## Project Overview

Dalan is a road crack detection system that uses a YOLO model for image analysis. The backend is built with FastAPI and deployed as AWS Lambda functions using the Serverless Framework.

## Current Architecture

The current architecture includes:
- FastAPI application with routers for entries, auth, and users
- YOLO model for crack detection (loaded from S3)
- Supabase for database operations
- AWS S3 for image storage
- SQS for asynchronous processing

## Refactoring Goals

1. Implement a domain-driven structure with clear separation of concerns
2. Optimize serverless deployment with dedicated handlers for each endpoint
3. Improve S3 integration for model loading and image storage
4. Enhance error handling and logging
5. Implement comprehensive testing

## New Architecture

### Directory Structure

```
/backend
├── config/
│   └── settings.py         # Centralized configuration (no __init__.py needed)
├── domain/
│   └── models/
│       ├── base.py         # Base models
│       ├── entries.py      # Road crack entry models
│       ├── users.py        # User models
│       └── detection.py    # Detection result models
├── handlers/
│   ├── entries/
│   │   ├── get_entries.py  # Get all entries handler
│   │   ├── get_entry.py    # Get single entry handler
│   │   ├── create_entry.py # Create entry handler
│   │   ├── update_entry.py # Update entry handler
│   │   └── delete_entry.py # Delete entry handler
│   ├── users/
│   │   ├── get_user.py     # Get user handler
│   │   └── update_user.py  # Update user handler
│   ├── auth/
│   │   ├── login.py        # Login handler
│   │   └── verify.py       # Token verification handler
│   └── detection/
│       └── process.py      # YOLO processing handler
├── repositories/
│   ├── entries.py          # Entry repository
│   ├── users.py            # User repository
│   └── detection.py        # Detection repository
├── services/
│   ├── detection/
│   │   ├── model_loader.py # Model loading from S3
│   │   └── processor.py    # YOLO processing logic
│   ├── storage/
│   │   └── s3.py           # S3 operations
│   └── auth/
│       └── supabase.py     # Supabase auth operations
├── utils/
│   ├── formatters.py       # Response formatters
│   └── validators.py       # Input validators
├── serverless.yml          # Serverless Framework configuration
└── requirements.txt        # Python dependencies
```

## Implementation Plan

### Phase 1: Restructure Project Files

- [x] Create new directory structure
- [x] Move and refactor existing code into appropriate modules
- [x] Implement centralized configuration

### Phase 2: Domain Model Implementation

- [x] Define clear domain models for entries
- [x] Implement validation rules for entries
- [x] Create domain models for users and detection
- [x] Create domain-specific exceptions

### Phase 3: Repository Layer

- [x] Implement repository pattern for data access
- [x] Refactor Supabase operations into repositories for entries
- [x] Create repositories for users and auth
- [x] Add error handling and logging

### Phase 4: Service Layer

- [x] Refactor detection service with better S3 integration
- [x] Optimize model loading and caching
- [x] Improve image processing pipeline

### Phase 5: API Layer

- [x] Refactor entries routes into dedicated Lambda handlers
- [x] Configure API Gateway endpoints for entries in serverless.yml
- [x] Refactor users routes into dedicated Lambda handlers
- [x] Refactor auth routes into dedicated Lambda handlers
- [x] Refactor detection routes into dedicated Lambda handlers
- [x] Implement proper dependency injection
- [x] Add comprehensive request validation

### Phase 6: Serverless Configuration

- [x] Update serverless.yml with dedicated functions
- [x] Optimize Lambda configurations
- [x] Configure proper IAM permissions

### Phase 7: Testing

- [ ] Implement unit tests for core functionality
- [ ] Add integration tests for API endpoints
- [ ] Set up CI/CD pipeline

## Serverless Function Structure

The new serverless.yml will define separate functions for different API operations:

```yaml
functions:
  # Entry-specific handlers
  getEntries:
    handler: handlers/entries/get_entries.handler
    events:
      - http:
          path: /api/entries
          method: GET
          cors: true

  getEntry:
    handler: handlers/entries/get_entry.handler
    events:
      - http:
          path: /api/entries/{entry_id}
          method: GET
          cors: true

  createEntry:
    handler: handlers/entries/create_entry.handler
    events:
      - http:
          path: /api/entries
          method: POST
          cors: true

  updateEntry:
    handler: handlers/entries/update_entry.handler
    events:
      - http:
          path: /api/entries/{entry_id}
          method: PUT
          cors: true

  deleteEntry:
    handler: handlers/entries/delete_entry.handler
    events:
      - http:
          path: /api/entries/{entry_id}
          method: DELETE
          cors: true

  # User handlers
  getUser:
    handler: handlers/users/get_user.handler
    events:
      - http:
          path: /api/users/{user_id}
          method: GET
          cors: true

  updateUser:
    handler: handlers/users/update_user.handler
    events:
      - http:
          path: /api/users/{user_id}
          method: PUT
          cors: true

  # Auth handlers
  login:
    handler: handlers/auth/login.handler
    events:
      - http:
          path: /api/auth/login
          method: POST
          cors: true

  verifyToken:
    handler: handlers/auth/verify.handler
    events:
      - http:
          path: /api/auth/verify
          method: POST
          cors: true

  # YOLO processing handler
  yoloProcessor:
    handler: handlers/detection/process.handler
    memorySize: 2048
    timeout: 300
    events:
      - sqs:
          arn: !GetAtt YoloProcessingQueue.Arn
          batchSize: 1
```

## S3 Integration Improvements

### Model Loading

- Implement efficient model caching
- Add versioning support for models
- Implement fallback mechanisms

### Image Storage

- Optimize image upload/download
- Implement proper folder structure
- Add image processing pipeline
  - Original images: `s3://dalan/images/original/{user_id}/{entry_id}.jpg`
  - Processed images: `s3://dalan/images/processed/{user_id}/{entry_id}.jpg`

## Testing Strategy

1. **Unit Tests**:
   - Test individual components in isolation
   - Mock external dependencies

2. **Integration Tests**:
   - Test API endpoints with mock database
   - Test S3 operations with localstack

3. **End-to-End Tests**:
   - Test complete workflows in a staging environment

## Deployment Checklist

- [ ] Update environment variables
- [ ] Configure AWS credentials
- [ ] Deploy to development environment
- [ ] Run integration tests
- [ ] Deploy to production

## Performance Considerations

1. **Cold Start Optimization**:
   - Minimize dependencies
   - Use Lambda layers for large packages
   - Implement proper caching

2. **Memory Allocation**:
   - Optimize memory for YOLO processing
   - Monitor and adjust based on usage

3. **Concurrency**:
   - Configure proper concurrency limits
   - Implement throttling for API endpoints

## Monitoring and Logging

- Implement structured logging
- Set up CloudWatch dashboards
- Configure alerts for errors and performance issues
