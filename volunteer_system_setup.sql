-- =====================================================
-- COMMUNITY RESPONSE NETWORK - DATABASE SETUP
-- =====================================================

-- Step 1: Create volunteers table
CREATE TABLE IF NOT EXISTS volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT CHECK (role IN ('ngo', 'student', 'citizen')) DEFAULT 'citizen',
    lat FLOAT,
    lng FLOAT,
    location_address TEXT,
    is_available BOOLEAN DEFAULT true,
    rating FLOAT DEFAULT 5.0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_accepted INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Step 2: Add volunteer-related columns to complaints table
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS assigned_volunteer_id UUID REFERENCES volunteers(id),
ADD COLUMN IF NOT EXISTS assigned_role TEXT CHECK (assigned_role IN ('officer', 'volunteer')) DEFAULT 'officer',
ADD COLUMN IF NOT EXISTS is_volunteer_assigned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS volunteer_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS volunteer_resolved_at TIMESTAMP WITH TIME ZONE;

-- Step 3: Create volunteer_tasks table for tracking
CREATE TABLE IF NOT EXISTS volunteer_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('offered', 'accepted', 'in_progress', 'completed', 'declined')) DEFAULT 'offered',
    distance_km FLOAT,
    offered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    proof_image_url TEXT,
    completion_notes TEXT,
    citizen_rating INTEGER CHECK (citizen_rating >= 1 AND citizen_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create volunteer_notifications table
CREATE TABLE IF NOT EXISTS volunteer_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'task_available',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_volunteers_location ON volunteers(lat, lng);
CREATE INDEX IF NOT EXISTS idx_volunteers_available ON volunteers(is_available);
CREATE INDEX IF NOT EXISTS idx_volunteer_tasks_status ON volunteer_tasks(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_tasks_volunteer ON volunteer_tasks(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_notifications_volunteer ON volunteer_notifications(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_volunteer_assigned ON complaints(is_volunteer_assigned);

-- Step 6: Enable RLS on new tables
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_notifications ENABLE ROW LEVEL SECURITY;

-- Step 7: RLS Policies for volunteers table
DROP POLICY IF EXISTS "Anyone can view volunteers" ON volunteers;
DROP POLICY IF EXISTS "Users can create own volunteer profile" ON volunteers;
DROP POLICY IF EXISTS "Volunteers can update own profile" ON volunteers;

CREATE POLICY "Anyone can view volunteers"
    ON volunteers FOR SELECT USING (true);

CREATE POLICY "Users can create own volunteer profile"
    ON volunteers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Volunteers can update own profile"
    ON volunteers FOR UPDATE USING (auth.uid() = user_id);

-- Step 8: RLS Policies for volunteer_tasks
DROP POLICY IF EXISTS "Volunteers can view own tasks" ON volunteer_tasks;
DROP POLICY IF EXISTS "System can create tasks" ON volunteer_tasks;
DROP POLICY IF EXISTS "Volunteers can update own tasks" ON volunteer_tasks;

CREATE POLICY "Volunteers can view own tasks"
    ON volunteer_tasks FOR SELECT USING (
        volunteer_id IN (SELECT id FROM volunteers WHERE user_id = auth.uid())
    );

CREATE POLICY "System can create tasks"
    ON volunteer_tasks FOR INSERT WITH CHECK (true);

CREATE POLICY "Volunteers can update own tasks"
    ON volunteer_tasks FOR UPDATE USING (
        volunteer_id IN (SELECT id FROM volunteers WHERE user_id = auth.uid())
    );

-- Step 9: RLS Policies for volunteer_notifications
DROP POLICY IF EXISTS "Volunteers can view own notifications" ON volunteer_notifications;
DROP POLICY IF EXISTS "System can create notifications" ON volunteer_notifications;
DROP POLICY IF EXISTS "Volunteers can update own notifications" ON volunteer_notifications;

CREATE POLICY "Volunteers can view own notifications"
    ON volunteer_notifications FOR SELECT USING (
        volunteer_id IN (SELECT id FROM volunteers WHERE user_id = auth.uid())
    );

CREATE POLICY "System can create notifications"
    ON volunteer_notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Volunteers can update own notifications"
    ON volunteer_notifications FOR UPDATE USING (
        volunteer_id IN (SELECT id FROM volunteers WHERE user_id = auth.uid())
    );

-- Step 10: Grant permissions
GRANT ALL ON volunteers TO authenticated;
GRANT ALL ON volunteer_tasks TO authenticated;
GRANT ALL ON volunteer_notifications TO authenticated;

-- Step 11: Create function to calculate distance (simple approximation)
CREATE OR REPLACE FUNCTION calculate_distance(lat1 FLOAT, lng1 FLOAT, lat2 FLOAT, lng2 FLOAT)
RETURNS FLOAT AS $$
BEGIN
    -- Simple distance calculation (not accurate for large distances, but good enough for city-level)
    -- Returns approximate distance in kilometers
    RETURN SQRT(POWER((lat2 - lat1) * 111.0, 2) + POWER((lng2 - lng1) * 111.0 * COS(RADIANS(lat1)), 2));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 12: Create function to find nearby volunteers
CREATE OR REPLACE FUNCTION find_nearby_volunteers(
    complaint_lat FLOAT,
    complaint_lng FLOAT,
    max_distance_km FLOAT DEFAULT 10.0,
    limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    volunteer_id UUID,
    volunteer_name TEXT,
    volunteer_role TEXT,
    volunteer_rating FLOAT,
    distance_km FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        v.role,
        v.rating,
        calculate_distance(complaint_lat, complaint_lng, v.lat, v.lng) as dist
    FROM volunteers v
    WHERE v.is_available = true
        AND v.lat IS NOT NULL
        AND v.lng IS NOT NULL
        AND calculate_distance(complaint_lat, complaint_lng, v.lat, v.lng) <= max_distance_km
    ORDER BY dist ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Step 13: Update leaderboard to include volunteers
ALTER TABLE leaderboard 
ADD COLUMN IF NOT EXISTS volunteer_tasks_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS volunteer_points INTEGER DEFAULT 0;

-- Step 14: Create function to update volunteer leaderboard
CREATE OR REPLACE FUNCTION update_volunteer_leaderboard(
    p_user_id UUID,
    p_action TEXT,
    p_points INTEGER
)
RETURNS VOID AS $$
BEGIN
    -- Update or insert leaderboard entry
    INSERT INTO leaderboard (user_id, volunteer_points, volunteer_tasks_completed, total_score)
    VALUES (
        p_user_id,
        CASE WHEN p_action = 'task_completed' THEN 1 ELSE 0 END,
        CASE WHEN p_action = 'task_completed' THEN 1 ELSE 0 END,
        p_points
    )
    ON CONFLICT (user_id) DO UPDATE SET
        volunteer_points = leaderboard.volunteer_points + p_points,
        volunteer_tasks_completed = CASE 
            WHEN p_action = 'task_completed' THEN leaderboard.volunteer_tasks_completed + 1
            ELSE leaderboard.volunteer_tasks_completed
        END,
        total_score = leaderboard.total_score + p_points,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 
    'SUCCESS! Volunteer system database setup complete.' as status,
    COUNT(DISTINCT v.id) as total_volunteers,
    COUNT(DISTINCT vt.id) as total_tasks
FROM volunteers v
LEFT JOIN volunteer_tasks vt ON vt.volunteer_id = v.id;
