import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../config/supabase';

export default function OfficerSetup({ onComplete }) {
  const { user, supabaseService, notify } = useApp();
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const depts = await supabaseService.getDepartments();
      setDepartments(depts);
    } catch (error) {
      console.error('Error loading departments:', error);
      notify('Could not load departments', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDept || !badgeNumber) {
      notify('Please fill all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      // Create officer profile using service
      const profile = await supabaseService.createOfficerProfile(
        user.id,
        selectedDept,
        badgeNumber
      );

      notify('Officer profile created successfully!', 'success');
      onComplete(profile);
    } catch (error) {
      console.error('Error creating officer profile:', error);
      notify('Failed to create officer profile: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '500px',
        margin: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👮</div>
          <h2 style={{ 
            fontSize: '1.75rem', 
            fontWeight: '700', 
            color: 'var(--gov-dark)', 
            marginBottom: '0.5rem' 
          }}>
            Officer Profile Setup
          </h2>
          <p style={{ color: 'var(--gov-text-light)', fontSize: '0.875rem' }}>
            Welcome! Please complete your officer profile to access the dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="gov-form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="gov-label">Badge Number *</label>
            <input
              type="text"
              value={badgeNumber}
              onChange={(e) => setBadgeNumber(e.target.value)}
              className="gov-input"
              placeholder="e.g. OFF-12345"
              required
            />
          </div>

          <div className="gov-form-group" style={{ marginBottom: '2rem' }}>
            <label className="gov-label">Department *</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="gov-input"
              required
            >
              <option value="">Select your department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.icon} {dept.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="gov-btn gov-btn-primary gov-btn-lg"
            style={{ width: '100%' }}
          >
            {loading ? 'Creating Profile...' : 'Complete Setup →'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: '#0c4a6e'
        }}>
          <strong>ℹ️ Note:</strong> You will only see complaints assigned to your department.
        </div>
      </div>
    </div>
  );
}
