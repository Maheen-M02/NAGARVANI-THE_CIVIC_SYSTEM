// Simple test to verify Supabase setup
import { supabase } from './src/config/supabase.js';

async function testSupabaseSetup() {
  console.log('🧪 Testing Supabase Setup...\n');

  // Test 1: Connection
  try {
    const { data, error } = await supabase.from('departments').select('count');
    if (error) throw error;
    console.log('✅ Database connection: OK');
  } catch (error) {
    console.log('❌ Database connection:', error.message);
  }

  // Test 2: Auth
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔐 Auth status:', session ? `Signed in as ${session.user.email}` : 'Not signed in');
  } catch (error) {
    console.log('❌ Auth error:', error.message);
  }

  // Test 3: Storage
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    console.log('📁 Storage buckets:', data.length, 'found');
    data.forEach(bucket => console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`));
  } catch (error) {
    console.log('❌ Storage error:', error.message);
  }

  // Test 4: Departments
  try {
    const { data, error } = await supabase.from('departments').select('*').limit(3);
    if (error) throw error;
    console.log('🏛️ Departments:', data.length, 'found');
    data.forEach(dept => console.log(`   - ${dept.name} (${dept.icon})`));
  } catch (error) {
    console.log('❌ Departments error:', error.message);
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. Run the SQL from supabase_clean_setup.sql in your Supabase SQL Editor');
  console.log('2. Create storage buckets: complaint-images, profile-pictures, attachments');
  console.log('3. Test signup/signin functionality');
  console.log('4. Try filing a complaint to test the full flow');
}

// Run if called directly
if (typeof window === 'undefined') {
  testSupabaseSetup().catch(console.error);
}

export default testSupabaseSetup;