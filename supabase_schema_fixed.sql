-- NagarVani Supabase Database Schema - FIXED VERSION
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('citizen', 'officer', 'admin');
CREATE TYPE complaint_status AS ENUM ('pending', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected');
CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE complaint_category AS ENUM ('pothole', 'garbage', 'water_leakage', 'streetlight', 'drainage', 'road_damage', 'noise_pollution', 'illegal_construction', 'traffic_issue', 'other');

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS complaint_updates CASCADE;
DROP TABLE IF EXISTS leaderboard CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS officers CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
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

-- Complaints table
CREATE TABLE complaints (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id VARCHAR(20) UNIQUE NOT NULL,
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

-- Create indexes for better performance
CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_department_id ON complaints(department_id);
CREATE INDEX idx_complaints_assigned_officer_id ON complaints(assigned_officer_id);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);
CREATE INDEX idx_complaints_ticket_id ON complaints(ticket_id);

CREATE INDEX idx_complaint_updates_complaint_id ON complaint_updates(complaint_id);
CREATE INDEX idx_complaint_updates_created_at ON complaint_updates(created_at);

CREATE INDEX idx_leaderboard_user_id ON leaderboard(user_id);
CREATE INDEX idx_leaderboard_total_score ON leaderboard(total_score DESC);
CREATE INDEX idx_leaderboard_current_rank ON leaderboard(current_rank);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_officers_department_id ON officers(department_id);
CREATE INDEX idx_officers_user_id ON officers(user_id);

-- Row Level Security (RLS) Policies - SIMPLIFIED AND FIXED
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;

-- FIXED: More permissive policies for development
-- Users policies
CREATE POLICY "Users can manage own data" ON users 
FOR ALL USING (auth.uid() = id);

-- Complaints policies - SIMPLIFIED
CREATE POLICY "Users can manage own complaints" ON complaints 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Officers can read all complaints" ON complaints 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM officers o 
    WHERE o.user_id = auth.uid()
  )
);

CREATE POLICY "Officers can update complaints" ON complaints 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM officers o 
    WHERE o.user_id = auth.uid()
  )
);

-- Complaint updates policies - SIMPLIFIED
CREATE POLICY "Users can manage complaint updates" ON complaint_updates 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM complaints c 
    WHERE c.id = complaint_updates.complaint_id 
    AND (c.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM officers o 
      WHERE o.user_id = auth.uid()
    ))
  )
);

-- Leaderboard policies - PUBLIC READ
CREATE POLICY "Anyone can read leaderboard" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Users can manage own leaderboard" ON leaderboard 
FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can manage own notifications" ON notifications 
FOR ALL USING (auth.uid() = user_id);

-- Officers policies
CREATE POLICY "Officers can manage own data" ON officers 
FOR ALL USING (auth.uid() = user_id);

-- Departments are public read (no RLS)
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_officers_updated_at BEFORE UPDATE ON officers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON leaderboard FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate ticket ID
CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_id = 'NV-' || LPAD(nextval('ticket_id_seq')::text, 6, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create sequence for ticket IDs
CREATE SEQUENCE IF NOT EXISTS ticket_id_seq START 1;

-- Create trigger for ticket ID generation
CREATE TRIGGER generate_complaint_ticket_id BEFORE INSERT ON complaints FOR EACH ROW EXECUTE FUNCTION generate_ticket_id();

-- Function to update leaderboard scores
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
$$ language 'plpgsql';

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

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen')::user_role
  );
  
  -- Initialize leaderboard entry
  INSERT INTO leaderboard (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();