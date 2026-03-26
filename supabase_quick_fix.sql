-- QUICK FIX: Disable RLS temporarily to get everything working
-- Run this in your Supabase SQL Editor

-- Disable RLS on all tables temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_updates DISABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can manage own data" ON users;
DROP POLICY IF EXISTS "Users can manage own complaints" ON complaints;
DROP POLICY IF EXISTS "Officers can read all complaints" ON complaints;
DROP POLICY IF EXISTS "Officers can update complaints" ON complaints;
DROP POLICY IF EXISTS "Users can manage complaint updates" ON complaint_updates;
DROP POLICY IF EXISTS "Anyone can read leaderboard" ON leaderboard;
DROP POLICY IF EXISTS "Users can manage own leaderboard" ON leaderboard;
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
DROP POLICY IF EXISTS "Officers can manage own data" ON officers;

-- Make sure departments table exists and has data
CREATE TABLE IF NOT EXISTS departments (
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

-- Clear and re-insert departments
DELETE FROM departments;
INSERT INTO departments (name, icon, color, description, default_sla_hours) VALUES
('Public Works Department', '🏗️', '#0ea5e9', 'Roads, Infrastructure, Public Buildings', 48),
('Water Board', '💧', '#06b6d4', 'Water Supply, Drainage, Sewerage', 24),
('Electricity Department', '⚡', '#f59e0b', 'Power Supply, Street Lighting', 72),
('Waste Management', '🗑️', '#22c55e', 'Garbage Collection, Waste Disposal', 24),
('Traffic Police', '🚦', '#ef4444', 'Traffic Management, Road Safety', 12),
('Health Department', '🏥', '#8b5cf6', 'Public Health, Sanitation', 48),
('Fire Department', '🚒', '#dc2626', 'Fire Safety, Emergency Response', 6),
('Municipal Corporation', '🏛️', '#6366f1', 'General Administration, Permits', 96);

-- Grant public access to all tables (for development)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;