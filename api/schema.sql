-- Dalan API Database Schema for Supabase

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Road Cracks Table
CREATE TABLE IF NOT EXISTS road_cracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    coordinates JSONB NOT NULL, -- [longitude, latitude]
    severity TEXT NOT NULL CHECK (severity IN ('minor', 'major')),
    type TEXT NOT NULL, -- Determined by AI classification
    image_url TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS road_cracks_user_id_idx ON road_cracks(user_id);
CREATE INDEX IF NOT EXISTS road_cracks_severity_idx ON road_cracks(severity);
CREATE INDEX IF NOT EXISTS road_cracks_type_idx ON road_cracks(type);

