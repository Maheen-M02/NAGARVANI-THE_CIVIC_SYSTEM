# NagarVani Database Schema - Leaderboard Feature

## Overview
This document outlines the database schema changes required for the Citizen Leaderboard gamification feature.

## New Tables

### 1. leaderboard
Stores citizen scoring and ranking information.

```sql
CREATE TABLE leaderboard (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'citizen',
    score INTEGER DEFAULT 0,
    complaints_filed INTEGER DEFAULT 0,
    complaints_resolved INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX idx_leaderboard_user_id ON leaderboard(user_id);
CREATE INDEX idx_leaderboard_updated_at ON leaderboard(updated_at DESC);
```

## Modified Tables

### 1. complaints
Add citizen_id field to link complaints to citizens for scoring.

```sql
-- Add citizen_id column to existing complaints table
ALTER TABLE complaints ADD COLUMN citizen_id VARCHAR(50);

-- Create index for performance
CREATE INDEX idx_complaints_citizen_id ON complaints(citizen_id);

-- Add foreign key constraint (optional, depending on your setup)
ALTER TABLE complaints 
ADD CONSTRAINT fk_complaints_citizen 
FOREIGN KEY (citizen_id) REFERENCES leaderboard(user_id);
```

## Scoring System

### Point Values
- **Complaint Submitted**: +10 points
- **Complaint Resolved**: +20 points  
- **High Priority Bonus**: +30 points (for High priority complaints)
- **Critical Priority Bonus**: +50 points (for Critical priority complaints)

### Scoring Logic
```sql
-- Function to calculate points for a complaint
CREATE OR REPLACE FUNCTION calculate_complaint_points(
    priority_level VARCHAR(20)
) RETURNS INTEGER AS $$
BEGIN
    CASE priority_level
        WHEN 'Critical' THEN RETURN 60; -- 10 base + 50 bonus
        WHEN 'High' THEN RETURN 40;     -- 10 base + 30 bonus
        WHEN 'Medium' THEN RETURN 10;   -- 10 base
        WHEN 'Low' THEN RETURN 10;      -- 10 base
        ELSE RETURN 10;                 -- default
    END CASE;
END;
$$ LANGUAGE plpgsql;
```

## Triggers for Automatic Scoring

### 1. Complaint Creation Trigger
Automatically add points when a complaint is created.

```sql
CREATE OR REPLACE FUNCTION update_leaderboard_on_complaint_create()
RETURNS TRIGGER AS $$
DECLARE
    points_to_add INTEGER;
BEGIN
    -- Calculate points based on priority
    points_to_add := calculate_complaint_points(NEW.priority);
    
    -- Update or insert citizen in leaderboard
    INSERT INTO leaderboard (user_id, name, score, complaints_filed, updated_at)
    VALUES (NEW.citizen_id, NEW.citizen_name, points_to_add, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        score = leaderboard.score + points_to_add,
        complaints_filed = leaderboard.complaints_filed + 1,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_complaint_created
    AFTER INSERT ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION update_leaderboard_on_complaint_create();
```

### 2. Complaint Resolution Trigger
Add bonus points when a complaint is resolved.

```sql
CREATE OR REPLACE FUNCTION update_leaderboard_on_complaint_resolve()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if status changed to 'Resolved'
    IF OLD.status != 'Resolved' AND NEW.status = 'Resolved' THEN
        -- Add resolution bonus points
        UPDATE leaderboard 
        SET 
            score = score + 20,
            complaints_resolved = complaints_resolved + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = NEW.citizen_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_complaint_resolved
    AFTER UPDATE ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION update_leaderboard_on_complaint_resolve();
```

## Queries for Leaderboard Features

### 1. Get Top 10 Citizens
```sql
SELECT 
    user_id,
    name,
    score,
    complaints_filed,
    complaints_resolved,
    ROW_NUMBER() OVER (ORDER BY score DESC) as rank
FROM leaderboard 
WHERE role = 'citizen'
ORDER BY score DESC 
LIMIT 10;
```

### 2. Get Citizen Rank
```sql
WITH ranked_citizens AS (
    SELECT 
        user_id,
        name,
        score,
        complaints_filed,
        complaints_resolved,
        ROW_NUMBER() OVER (ORDER BY score DESC) as rank
    FROM leaderboard 
    WHERE role = 'citizen'
)
SELECT * FROM ranked_citizens 
WHERE user_id = $1;
```

### 3. Get Leaderboard Statistics
```sql
SELECT 
    COUNT(*) as total_citizens,
    SUM(score) as total_score,
    SUM(complaints_filed) as total_complaints,
    SUM(complaints_resolved) as total_resolved,
    ROUND(AVG(score)) as average_score,
    CASE 
        WHEN SUM(complaints_filed) > 0 
        THEN ROUND((SUM(complaints_resolved)::DECIMAL / SUM(complaints_filed)) * 100)
        ELSE 0 
    END as resolution_rate
FROM leaderboard 
WHERE role = 'citizen';
```

## Real-time Updates with Supabase

### 1. Enable Real-time
```sql
-- Enable real-time for leaderboard table
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;
```

### 2. Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Policy for citizens to read all leaderboard data
CREATE POLICY "Citizens can view leaderboard" ON leaderboard
    FOR SELECT USING (true);

-- Policy for citizens to update only their own data
CREATE POLICY "Citizens can update own data" ON leaderboard
    FOR UPDATE USING (auth.uid()::text = user_id);
```

## Migration Script

```sql
-- Migration: Add Leaderboard Feature
-- Run this script to add leaderboard functionality to existing database

BEGIN;

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'citizen',
    score INTEGER DEFAULT 0,
    complaints_filed INTEGER DEFAULT 0,
    complaints_resolved INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add citizen_id to complaints table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'complaints' AND column_name = 'citizen_id'
    ) THEN
        ALTER TABLE complaints ADD COLUMN citizen_id VARCHAR(50);
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_updated_at ON leaderboard(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_citizen_id ON complaints(citizen_id);

-- Create functions and triggers (as defined above)
-- ... (include all the functions and triggers from above)

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;

-- Enable RLS
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY IF NOT EXISTS "Citizens can view leaderboard" ON leaderboard
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Citizens can update own data" ON leaderboard
    FOR UPDATE USING (auth.uid()::text = user_id);

COMMIT;
```

## Frontend Integration

### 1. Supabase Client Setup
```javascript
// Subscribe to leaderboard changes
const supabase = createClient(url, key);

const subscription = supabase
  .channel('leaderboard-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'leaderboard' },
    (payload) => {
      console.log('Leaderboard updated:', payload);
      // Update local state
      refreshLeaderboard();
    }
  )
  .subscribe();
```

### 2. API Calls
```javascript
// Get top citizens
const getTopCitizens = async (limit = 10) => {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('role', 'citizen')
    .order('score', { ascending: false })
    .limit(limit);
  
  return { data, error };
};

// Get citizen rank
const getCitizenRank = async (userId) => {
  const { data, error } = await supabase
    .rpc('get_citizen_rank', { citizen_id: userId });
  
  return { data, error };
};
```

This schema provides a complete foundation for the gamification leaderboard feature with automatic scoring, real-time updates, and proper indexing for performance.