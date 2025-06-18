# Dalan API Backend

This is the backend for the Dalan AI-Powered Road Crack Mapping App.

- Handles image uploads, AI classification, and database operations
- Provides REST API endpoints for the frontend
- Built with **FastAPI** (Python)

## Features
- Image upload and processing
- AI-powered crack classification
- CRUD operations for road crack entries
- User management
- Supabase integration for data storage

## Setup Instructions

### 1. Environment Setup

1. Create a `.env` file by copying the example:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your Supabase credentials:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   ```

   You can find these values in your Supabase dashboard under Project Settings > API.

3. Set up Cloudinary for image storage:
   - Add these credentials to your `.env` file:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
   - The cloud name, API key, and API secret can be found in your Cloudinary dashboard

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Supabase Setup

You can use the provided SQL schema to set up your Supabase tables:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the `schema.sql` file
4. Paste and run the SQL in the Supabase SQL Editor

The schema creates:

- A `users` table with fields for id, name, email, etc.
- A `road_cracks` table with all fields matching your frontend data model
- Appropriate indexes for better query performance

### 4. Run the API Server

```bash
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

### 5. API Documentation

FastAPI automatically generates interactive API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

- `GET /api/entries` - Get all road crack entries
- `GET /api/entries/{id}` - Get a specific entry
- `POST /api/entries` - Create a new entry
- `PUT /api/entries/{id}` - Update an entry
- `DELETE /api/entries/{id}` - Delete an entry
- `POST /api/classify` - Classify an image
- `GET /api/users/me` - Get current user

---

See the root README for overall project details.
