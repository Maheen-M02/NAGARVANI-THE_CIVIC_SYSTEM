import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Create Supabase client with session persistence and proper headers
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: window.localStorage,
    storageKey: 'nagarvani-auth-token',
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  },
  global: {
    headers: {
      'x-client-info': 'nagarvani-web'
    }
  },
  db: {
    schema: 'public'
  }
});

// Database table names
export const TABLES = {
  USERS: 'users',
  COMPLAINTS: 'complaints',
  COMPLAINT_UPDATES: 'complaint_updates',
  DEPARTMENTS: 'departments',
  OFFICERS: 'officers',
  LEADERBOARD: 'leaderboard',
  NOTIFICATIONS: 'notifications',
  VOLUNTEERS: 'volunteers',
  VOLUNTEER_TASKS: 'volunteer_tasks',
  VOLUNTEER_NOTIFICATIONS: 'volunteer_notifications'
};

// Storage bucket names
export const BUCKETS = {
  COMPLAINT_IMAGES: 'complaint-images',
  PROFILE_PICTURES: 'profile-pictures',
  ATTACHMENTS: 'attachments'
};

export default supabase;