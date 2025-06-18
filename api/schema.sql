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
    classified_image_url TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS road_cracks_user_id_idx ON road_cracks(user_id);
CREATE INDEX IF NOT EXISTS road_cracks_severity_idx ON road_cracks(severity);
CREATE INDEX IF NOT EXISTS road_cracks_type_idx ON road_cracks(type);

-- Add classified_image_url column to existing tables if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='road_cracks' AND column_name='classified_image_url') THEN
        ALTER TABLE road_cracks ADD COLUMN classified_image_url TEXT;
    END IF;
END$$;

-- Crack Detections Table (stores individual crack detections)
CREATE TABLE IF NOT EXISTS crack_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    road_crack_id UUID NOT NULL REFERENCES road_cracks(id) ON DELETE CASCADE,
    crack_type TEXT NOT NULL,
    confidence FLOAT NOT NULL,
    x1 INTEGER NOT NULL,
    y1 INTEGER NOT NULL,
    x2 INTEGER NOT NULL,
    y2 INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detection Summary Table (stores summary of detections for each road crack)
CREATE TABLE IF NOT EXISTS detection_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    road_crack_id UUID NOT NULL REFERENCES road_cracks(id) ON DELETE CASCADE UNIQUE,
    total_cracks INTEGER NOT NULL,
    crack_types JSONB NOT NULL, -- Stores the summary of crack types, counts, and confidences
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS crack_detections_road_crack_id_idx ON crack_detections(road_crack_id);
CREATE INDEX IF NOT EXISTS crack_detections_crack_type_idx ON crack_detections(crack_type);
CREATE INDEX IF NOT EXISTS detection_summaries_road_crack_id_idx ON detection_summaries(road_crack_id);
