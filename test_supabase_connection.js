// Test Supabase Connection
// Run this with: node test_supabase_connection.js

import { createClient } from '@supabase/supabase-js';

// Replace with your actual credentials
const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseKey = 'your-anon-key-here';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🧪 Testing Supabase Connection...\n');

  // Test 1: Database connection
  try {
    const { data, error } = await supabase.from('departments').select('*');
    if (error) throw error;
    console.log('✅ Database connection: SUCCESS');
    console.log(`📊 Found ${data.length} departments`);
  } catch (error) {
    console.log('❌ Database connection: FAILED');
    console.log('Error:', error.message);
  }

  // Test 2: Storage connection
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    console.log('✅ Storage connection: SUCCESS');
    console.log(`🗂️ Found ${data.length} buckets:`, data.map(b => b.name));
  } catch (error) {
    console.log('❌ Storage connection: FAILED');
    console.log('Error:', error.message);
  }

  // Test 3: Auth connection
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Auth connection: SUCCESS');
    console.log('👤 Current session:', data.session ? 'Logged in' : 'Not logged in');
  } catch (error) {
    console.log('❌ Auth connection: FAILED');
    console.log('Error:', error.message);
  }

  console.log('\n🎉 Connection test complete!');
}

testConnection();