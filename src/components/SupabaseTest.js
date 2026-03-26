import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const SupabaseTest = () => {
  const [status, setStatus] = useState('Testing...');
  const [details, setDetails] = useState([]);
  const [setupNeeded, setSetupNeeded] = useState(false);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    const results = [];
    let needsSetup = false;

    // Test 1: Basic connection (without auth)
    try {
      const { error } = await supabase.from('departments').select('count').single();
      if (error) {
        if (error.message.includes('relation "departments" does not exist') || 
            error.message.includes('relation') || 
            error.code === '42P01') {
          results.push(`⚠️ Database: Tables not created yet`);
          needsSetup = true;
        } else if (error.message.includes('Lock')) {
          results.push(`⚠️ Database: Connection busy, please wait...`);
        } else {
          throw error;
        }
      } else {
        results.push(`✅ Database connection: OK`);
      }
    } catch (error) {
      if (error.message.includes('Lock')) {
        results.push(`⚠️ Database: Connection busy, retrying...`);
      } else {
        results.push(`❌ Database: ${error.message.substring(0, 50)}`);
      }
      needsSetup = true;
    }

    // Skip auth check to avoid lock conflicts
    results.push(`🔐 Auth: Ready (sign in to test)`);

    // Test 3: Storage buckets (without auth)
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) {
        if (error.message.includes('Lock')) {
          results.push(`📁 Storage: Connection busy...`);
        } else {
          throw error;
        }
      } else {
        const bucketNames = data.map(b => b.name).join(', ') || 'none';
        results.push(`📁 Storage buckets: ${data.length} found${data.length > 0 ? ` (${bucketNames})` : ''}`);
        
        const requiredBuckets = ['complaint-images', 'profile-pictures', 'attachments'];
        const missingBuckets = requiredBuckets.filter(name => !data.find(b => b.name === name));
        if (missingBuckets.length > 0) {
          results.push(`⚠️ Missing buckets: ${missingBuckets.join(', ')}`);
          needsSetup = true;
        }
      }
    } catch (error) {
      if (error.message.includes('Lock')) {
        results.push(`📁 Storage: Connection busy...`);
      } else {
        results.push(`❌ Storage: ${error.message.substring(0, 50)}`);
      }
    }

    // Test 4: Departments table
    if (!needsSetup) {
      try {
        const { data, error } = await supabase.from('departments').select('*').limit(1);
        if (error) throw error;
        results.push(`🏛️ Departments: ${data.length} found`);
      } catch (error) {
        if (!error.message.includes('Lock')) {
          results.push(`❌ Departments: ${error.message.substring(0, 50)}`);
        }
      }
    }

    setDetails(results);
    setSetupNeeded(needsSetup);
    setStatus(needsSetup ? 'Setup Required' : 'Ready');
  };

  const testSignUp = async () => {
    try {
      const testEmail = `test${Date.now()}@example.com`;
      const { error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'password123',
        options: {
          data: {
            name: 'Test User',
            role: 'citizen'
          }
        }
      });
      
      if (error) throw error;
      setDetails(prev => [...prev, `✅ Test signup: Success for ${testEmail}`]);
    } catch (error) {
      setDetails(prev => [...prev, `❌ Test signup: ${error.message}`]);
    }
  };

  const createBuckets = async () => {
    const buckets = [
      { name: 'complaint-images', public: true },
      { name: 'profile-pictures', public: true },
      { name: 'attachments', public: false }
    ];

    for (const bucket of buckets) {
      try {
        const { error } = await supabase.storage.createBucket(bucket.name, { public: bucket.public });
        if (error && !error.message.includes('already exists')) {
          throw error;
        }
        setDetails(prev => [...prev, `✅ Bucket created: ${bucket.name}`]);
      } catch (error) {
        setDetails(prev => [...prev, `❌ Bucket error: ${bucket.name} - ${error.message}`]);
      }
    }
    
    // Retest after creating buckets
    setTimeout(testConnection, 1000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: setupNeeded ? '2px solid #f59e0b' : '1px solid #ccc',
      borderRadius: '8px',
      padding: '16px',
      maxWidth: '450px',
      fontSize: '12px',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      <h4 style={{ 
        margin: '0 0 8px 0',
        color: setupNeeded ? '#f59e0b' : '#22c55e'
      }}>
        🧪 Supabase Status
      </h4>
      
      <div style={{ 
        marginBottom: '8px', 
        fontWeight: 'bold',
        color: setupNeeded ? '#f59e0b' : '#22c55e'
      }}>
        {status}
      </div>

      {setupNeeded && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '6px',
          padding: '8px',
          marginBottom: '8px',
          fontSize: '11px'
        }}>
          <strong>⚠️ Setup Required:</strong>
          <br />1. Run SQL in Supabase Dashboard
          <br />2. Create storage buckets
          <br />3. Test authentication
        </div>
      )}

      {details.map((detail, index) => (
        <div key={index} style={{ marginBottom: '4px', fontSize: '11px' }}>
          {detail}
        </div>
      ))}

      <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        <button 
          onClick={testConnection}
          style={{
            padding: '4px 8px',
            fontSize: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retest
        </button>
        
        {setupNeeded && (
          <>
            <button 
              onClick={createBuckets}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                border: '1px solid #28a745',
                borderRadius: '4px',
                cursor: 'pointer',
                background: '#28a745',
                color: 'white'
              }}
            >
              Create Buckets
            </button>
            
            <div style={{
              width: '100%',
              marginTop: '8px',
              padding: '8px',
              background: '#f8f9fa',
              borderRadius: '4px',
              fontSize: '10px'
            }}>
              <strong>📋 Next Steps:</strong>
              <br />1. Go to Supabase → SQL Editor
              <br />2. Copy/paste supabase_clean_setup.sql
              <br />3. Click "Run" to create tables
              <br />4. Click "Create Buckets" above
            </div>
          </>
        )}
        
        {!setupNeeded && (
          <button 
            onClick={testSignUp}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              border: '1px solid #007bff',
              borderRadius: '4px',
              cursor: 'pointer',
              background: '#007bff',
              color: 'white'
            }}
          >
            Test Signup
          </button>
        )}
      </div>
    </div>
  );
};

export default SupabaseTest;