-- CLEAN SUPABASE SETUP - No problematic triggers
-- Run this in your Supabase SQL Editor

-- First, clean up everything
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('citizen', 'officer', 'admin');
CREATE TYPE complaint_status AS ENUM ('pending', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected');
CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE complaint_category AS ENUM ('pothole', 'garbage', 'water_leakage', 'streetlight', 'drainage', 'road_damage', 'noise_pollution', 'illegal_construction', 'traffic_issue', 'other');

-- Users table (simple, no triggers)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role DEFAULT 'citizen',
    profile_picture TEXT,
    ward VARCHAR(100),
    address TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table
CREATE TABLE departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    color VARCHAR(7) NOT NULL,
    description TEXT,
    default_sla_hours INTEGER DEFAULT 72,
    is_active BOOLEAN DEFAULT true,
    total_complaints INTEGER DEFAULT 0,
    resolved_complaints INTEGER DEFAULT 0,
    avg_resolution_time FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Officers table
CREATE TABLE officers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    badge_number VARCHAR(50) UNIQUE NOT NULL,
    rank VARCHAR(100),
    specialization TEXT[],
    is_active BOOLEAN DEFAULT true,
    rating FLOAT DEFAULT 5.0,
    total_assigned INTEGER DEFAULT 0,
    total_resolved INTEGER DEFAULT 0,
    avg_resolution_time FLOAT DEFAULT 0,
    current_load INTEGER DEFAULT 0,
    max_load INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Complaints table (simple ticket_id generation)
CREATE TABLE complaints (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id VARCHAR(20) UNIQUE NOT NULL DEFAULT ('NV-' || LPAD(floor(random() * 999999)::text, 6, '0')),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(500) NOT NULL,
    ward VARCHAR(100),
    gps_latitude FLOAT,
    gps_longitude FLOAT,
    gps_accuracy FLOAT,
    gps_address TEXT,
    category complaint_category NOT NULL,
    priority complaint_priority DEFAULT 'medium',
    status complaint_status DEFAULT 'pending',
    confidence FLOAT,
    department_id UUID REFERENCES departments(id),
    assigned_officer_id UUID REFERENCES officers(id),
    photo_urls TEXT[],
    attachments TEXT[],
    ai_analysis JSONB,
    clip_analysis JSONB,
    sla_hours INTEGER DEFAULT 72,
    expected_resolution TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Complaint updates table
CREATE TABLE complaint_updates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    updated_by UUID REFERENCES users(id),
    updated_by_name VARCHAR(255) NOT NULL,
    updated_by_role user_role NOT NULL,
    status complaint_status,
    attachments TEXT[],
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard table
CREATE TABLE leaderboard (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_score INTEGER DEFAULT 0,
    complaints_count INTEGER DEFAULT 0,
    resolved_count INTEGER DEFAULT 0,
    high_priority_count INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    badges JSONB DEFAULT '[]',
    achievements JSONB DEFAULT '[]',
    streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    current_rank INTEGER,
    previous_rank INTEGER,
    rank_change INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    priority complaint_priority DEFAULT 'medium',
    related_id UUID,
    related_type VARCHAR(50),
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    is_delivered BOOLEAN DEFAULT false,
    delivered_at TIMESTAMP WITH TIME ZONE,
    channels TEXT[] DEFAULT ARRAY['in_app'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_department_id ON complaints(department_id);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);
CREATE INDEX idx_complaints_ticket_id ON complaints(ticket_id);

CREATE INDEX idx_complaint_updates_complaint_id ON complaint_updates(complaint_id);
CREATE INDEX idx_leaderboard_user_id ON leaderboard(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_officers_department_id ON officers(department_id);
CREATE INDEX idx_officers_user_id ON officers(user_id);

-- NO ROW LEVEL SECURITY for now (we'll add it later)
-- This allows everything to work without permission issues

-- Grant permissions to anon and authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Simple function to update leaderboard (no triggers)
CREATE OR REPLACE FUNCTION update_leaderboard_score(
    p_user_id UUID,
    p_action TEXT,
    p_points INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO leaderboard (user_id, total_score, complaints_count, resolved_count)
    VALUES (p_user_id, p_points, 
        CASE WHEN p_action = 'complaint_filed' THEN 1 ELSE 0 END,
        CASE WHEN p_action = 'complaint_resolved' THEN 1 ELSE 0 END
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_score = leaderboard.total_score + p_points,
        complaints_count = leaderboard.complaints_count + 
            CASE WHEN p_action = 'complaint_filed' THEN 1 ELSE 0 END,
        resolved_count = leaderboard.resolved_count + 
            CASE WHEN p_action = 'complaint_resolved' THEN 1 ELSE 0 END,
        updated_at = NOW();
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Insert default departments
INSERT INTO departments (name, icon, color, description, default_sla_hours) VALUES
('Public Works Department', '🏗️', '#0ea5e9', 'Roads, Infrastructure, Public Buildings', 48),
('Water Board', '💧', '#06b6d4', 'Water Supply, Drainage, Sewerage', 24),
('Electricity Department', '⚡', '#f59e0b', 'Power Supply, Street Lighting', 72),
('Waste Management', '🗑️', '#22c55e', 'Garbage Collection, Waste Disposal', 24),
('Traffic Police', '🚦', '#ef4444', 'Traffic Management, Road Safety', 12),
('Health Department', '🏥', '#8b5cf6', 'Public Health, Sanitation', 48),
('Fire Department', '🚒', '#dc2626', 'Fire Safety, Emergency Response', 6),
('Municipal Corporation', '🏛️', '#6366f1', 'General Administration, Permits', 96);

-- Success message
SELECT 'Database setup complete! All tables created successfully.' as status;