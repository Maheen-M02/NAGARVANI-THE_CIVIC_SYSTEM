import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { aiTriage, aiImageClassification } from '../data/aiTriage';
import { StatusBadge, PrioBadge, Spinner, timeAgo } from '../components/UI';
import { DEPARTMENTS, OFFICERS } from '../data/constants';
import NagarVaniLogo from '../components/NagarVaniLogo';
import locationService from '../services/locationService';
import AuditTrail from '../components/AuditTrail';
import '../styles/leaderboard.css';
import '../styles/government-portal.css';

// Lazy load the Leaderboard component
const { lazy, Suspense } = React;
const Leaderboard = lazy(() => import('./Leaderboard'));

const LazyLeaderboard = () => (
  <Suspense fallback={
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '40px',
        marginTop: '50px'
      }}>
        <Spinner size={40} color="white" />
        <h1 style={{ marginTop: '16px' }}>🏆 Loading Leaderboard...</h1>
      </div>
    </div>
  }>
    <Leaderboard />
  </Suspense>
);

function TrackView({ c }) {
  // Handle both snake_case (database) and camelCase (local) formats
  const ticketId = c.ticket_id || c.ticketId || 'Unknown';
  const createdAt = c.created_at ? new Date(c.created_at).getTime() : (c.createdAt || Date.now());
  const slaHours = c.sla_hours || c.slaHours || 72;
  const departmentId = c.department_id || c.dept;
  const officerId = c.assigned_officer_id || c.officer;
  
  const dept = c.departments || DEPARTMENTS.find(x => x.id === departmentId);
  const officer = OFFICERS.find(x => x.id === officerId);
  const elapsed = (Date.now() - createdAt) / 3600000;
  const slaPct = Math.min(100, (elapsed / slaHours) * 100);
  const slaColor = slaPct > 90 ? '#dc2626' : slaPct > 70 ? '#f59e0b' : '#059669';
  const slaLabel = slaPct > 100 ? 'BREACHED' : slaPct > 90 ? 'AT RISK' : 'ON TRACK';

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div className="gov-card" style={{ marginBottom: '1.5rem' }}>
        <div className="gov-card-header">
          <h3 className="gov-card-title">
            <div className="gov-card-icon">🎫</div>
            Complaint Details - {ticketId}
          </h3>
        </div>
        <div className="gov-card-body">
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--gov-dark)', marginBottom: '0.5rem' }}>
              {c.title}
            </h4>
            <div style={{ fontSize: '0.875rem', color: 'var(--gov-text-light)', marginBottom: '1rem' }}>
              Filed {timeAgo(createdAt)} • Ticket ID: {ticketId}
            </div>
            <p style={{ fontSize: '0.9375rem', color: 'var(--gov-text)', lineHeight: '1.6', marginBottom: '1rem' }}>
              {c.description}
            </p>
          </div>

          {/* Evidence Photos */}
          {(() => {
            const photos = c.photo_urls || c.photoUrls || (c.imageUrl ? [c.imageUrl] : []);
            if (!photos || photos.length === 0) return null;
            return (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--gov-text-light)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📷 EVIDENCE PHOTOS ({photos.length})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: photos.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                  {photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`Evidence ${i + 1}`}
                        style={{ width: '100%', height: photos.length === 1 ? 280 : 140, objectFit: 'cover', borderRadius: 8, border: '2px solid #E2E8F0', cursor: 'pointer' }}
                        onError={e => e.target.parentElement.style.display = 'none'}
                      />
                    </a>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="gov-stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="gov-stat-card">
              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gov-text-light)', marginBottom: '0.5rem' }}>
                PRIORITY
              </div>
              <PrioBadge p={c.priority} />
            </div>
            <div className="gov-stat-card">
              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gov-text-light)', marginBottom: '0.5rem' }}>
                DEPARTMENT
              </div>
              <div style={{ fontWeight: '700', color: dept?.color, fontSize: '0.875rem' }}>
                {dept?.icon} {dept?.name}
              </div>
            </div>
            <div className="gov-stat-card">
              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gov-text-light)', marginBottom: '0.5rem' }}>
                STATUS
              </div>
              <StatusBadge s={c.status} />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gov-text-light)', marginBottom: '0.5rem' }}>
              <span>SLA Progress</span>
              <span style={{ color: slaColor }}>
                {Math.round(elapsed)}h / {slaHours}h — <strong>{slaLabel}</strong>
              </span>
            </div>
            <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: slaPct + '%', 
                background: `linear-gradient(90deg, ${slaColor}, ${slaColor}dd)`, 
                transition: 'width .5s ease',
                borderRadius: '4px'
              }} />
            </div>
          </div>

          {officer && (
            <div className="gov-alert gov-alert-info">
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gov-text-light)', marginBottom: '0.5rem' }}>
                  ASSIGNED OFFICER
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    background: 'linear-gradient(135deg, var(--gov-primary), var(--gov-secondary))', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white', 
                    fontWeight: '800', 
                    fontSize: '1rem' 
                  }}>
                    {officer.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--gov-dark)', fontSize: '1rem' }}>
                      {officer.name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gov-text-light)' }}>
                      ⭐ {officer.rating} Rating
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CitizenPortal() {
  const { submitComplaint, notify, complaints, user, signOut, supabaseService, refreshComplaints } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState('home');
  const [step, setStep] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [triage, setTriage] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [trackId, setTrackId] = useState('');
  const [tracked, setTracked] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', location: '', ward: '', title: '', description: '', photo: null, gpsCoordinates: null });
  const [photoMode, setPhotoMode] = useState(false);
  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  // Load volunteer profile
  useEffect(() => {
    const loadVolunteerProfile = async () => {
      if (user) {
        try {
          const profile = await supabaseService.getVolunteerProfile(user.id);
          setVolunteerProfile(profile);
        } catch (error) {
          console.error('Error loading volunteer profile:', error);
        }
      }
    };
    loadVolunteerProfile();
  }, [user, supabaseService]);

  // Handle URL-based navigation
  useEffect(() => {
    const path = location.pathname;
    if (path === '/citizen/file') {
      setView('file');
    } else if (path === '/citizen/track') {
      setView('track');
    } else if (path === '/citizen/success') {
      setView('success');
    } else {
      setView('home');
    }
  }, [location.pathname]);

  // Subscribe to realtime complaint updates
  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime subscription for user complaints');
    const subscriptionId = supabaseService.subscribeToComplaints(
      (payload) => {
        console.log('Realtime update received:', payload);
        // Refresh complaints when any change occurs
        refreshComplaints();
      },
      { userId: user.id }
    );

    // Also set up polling as fallback (every 10 seconds)
    const pollInterval = setInterval(() => {
      console.log('Polling for complaint updates...');
      refreshComplaints();
    }, 10000);

    return () => {
      if (subscriptionId) {
        supabaseService.unsubscribe(subscriptionId);
      }
      clearInterval(pollInterval);
    };
  }, [user, supabaseService, refreshComplaints]);

  // Navigation helpers
  const navigateToView = (viewName) => {
    setView(viewName);
    if (viewName === 'home') {
      navigate('/citizen');
    } else if (viewName === 'leaderboard') {
      navigate('/leaderboard');
    } else {
      navigate(`/citizen/${viewName}`);
    }
    
    // Auto-capture GPS when navigating to file complaint
    if (viewName === 'file') {
      captureGPS();
    }
  };

  // GPS capture function
  const captureGPS = async () => {
    try {
      const result = await locationService.getCurrentLocation();
      if (result.success) {
        f('gpsCoordinates', result.location);
        console.log('GPS captured:', result.location);
        notify('📍 Location captured automatically', 'success');
      } else {
        console.warn('GPS capture failed:', result.error);
      }
    } catch (error) {
      console.error('GPS error:', error);
    }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Camera functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setPhotoMode(true);
      }
    } catch (err) {
      notify('Camera access failed', 'error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setPhotoMode(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], 'civic-issue.jpg', { type: 'image/jpeg' });
      f('photo', file);
      stopCamera();
      analyzePhoto(file);
    }, 'image/jpeg', 0.8);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      f('photo', file);
      analyzePhoto(file);
    }
  };

  const analyzePhoto = async (photo) => {
    try {
      const classification = await aiImageClassification(photo);
      f('title', classification.title);
      f('description', classification.description);
      notify('Photo analyzed with AI!', 'success');
      setStep(1);
    } catch (error) {
      notify('Photo analysis failed', 'error');
    }
  };

  const analyze = async () => {
    if (!form.title || !form.description) {
      notify('Fill in complaint title and description', 'error');
      return;
    }
    
    setAnalyzing(true);
    await new Promise(r => setTimeout(r, 1800));
    
    const triageData = form.photo 
      ? aiTriage(form.description + ' ' + form.title, form.photo)
      : aiTriage(form.description + ' ' + form.title);
    setTriage(triageData);
    setAnalyzing(false);
    setStep(3);
  };

  const doSubmit = async () => {
    if (!form.name || !form.phone || !form.location) {
      notify('Fill all required fields', 'error');
      return;
    }
    
    // Prevent double submission
    if (submitting) {
      console.log('Already submitting, ignoring duplicate call');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const c = await submitComplaint(form);
      if (c) {
        // Ensure ticket ID is in the right format
        const ticketId = c.ticket_id || c.ticketId || 'NV-' + String(Date.now()).slice(-6);
        const ticketWithId = {
          ...c,
          ticketId: ticketId,
          ticket_id: ticketId
        };
        setTicket(ticketWithId);
        navigateToView('success');
        notify(`Ticket ${ticketId} filed!`, 'success');
      }
    } catch (error) {
      console.error('Submit error:', error);
      notify('Failed to submit complaint. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const doTrack = async () => {
    if (!trackId) {
      notify('Please enter a ticket ID', 'error');
      return;
    }
    
    try {
      // First check local complaints array
      const localComplaint = complaints.find(x => 
        x.ticket_id === trackId.toUpperCase() || 
        x.ticketId === trackId.toUpperCase() ||
        x.ticket_id === trackId ||
        x.ticketId === trackId
      );
      
      if (localComplaint) {
        setTracked(localComplaint);
        return;
      }
      
      // If not found locally, fetch from database using getComplaints
      const allComplaints = await supabaseService.getComplaints({ userId: user.id });
      const foundComplaint = allComplaints.find(x => 
        x.ticket_id === trackId.toUpperCase() || 
        x.ticket_id === trackId
      );
      
      if (!foundComplaint) {
        notify('Complaint not found. Please check your ticket ID.', 'error');
        return;
      }
      
      setTracked(foundComplaint);
    } catch (error) {
      console.error('Track error:', error);
      notify('Error tracking complaint. Please try again.', 'error');
    }
  };

  return (
    <div className="gov-portal">
      {/* Government Header */}
      <div className="gov-header">
        <div className="gov-header-content">
          <div className="gov-emblem">
            <NagarVaniLogo size={80} />
            <div>
              <h1 className="gov-title">NagarVani</h1>
              <p className="gov-subtitle">Government of India - Digital Citizen Services</p>
              <p className="gov-tagline">"Voice of the City" - Empowering Civic Participation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Government Navigation */}
      <div className="gov-nav">
        <div className="gov-nav-content">
          <div className="gov-nav-brand">
            <NagarVaniLogo size={32} />
            Citizen Portal
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={() => navigateToView('leaderboard')} className="gov-btn gov-btn-secondary">
              🏆 Leaderboard
            </button>
            <button onClick={() => navigate('/')} className="gov-btn gov-btn-outline">
              🏠 Home
            </button>
            <div style={{ fontSize: '0.875rem', color: 'var(--gov-text-light)', marginRight: '0.5rem' }}>
              Welcome, {user?.name || 'Citizen'}
            </div>
            <button 
              onClick={async () => {
                await signOut();
                navigate('/');
              }} 
              className="gov-btn gov-btn-outline"
              style={{ color: '#dc2626', borderColor: '#dc2626' }}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {view === 'home' && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            {/* Government Services Grid */}
            <div className="gov-services-grid">
              <div className="gov-service-card" onClick={() => { navigateToView('file'); setStep(1); }}>
                <div className="gov-service-icon">📝</div>
                <h3 className="gov-service-title">File Complaint</h3>
                <p className="gov-service-description">
                  Submit civic complaints through our secure digital platform
                </p>
                <button className="gov-btn gov-btn-primary gov-btn-lg">
                  File New Complaint
                </button>
              </div>

              <div className="gov-service-card" onClick={() => { navigateToView('file'); setStep(2); startCamera(); }}>
                <div className="gov-service-icon">📸</div>
                <h3 className="gov-service-title">Snap & Report</h3>
                <p className="gov-service-description">
                  Capture issues instantly with AI-powered image analysis
                </p>
                <button className="gov-btn gov-btn-accent gov-btn-lg">
                  Take Photo & Report
                </button>
              </div>

              <div className="gov-service-card" onClick={() => navigateToView('track')}>
                <div className="gov-service-icon">🔍</div>
                <h3 className="gov-service-title">Track Status</h3>
                <p className="gov-service-description">
                  Monitor your complaint status with real-time updates
                </p>
                <button className="gov-btn gov-btn-secondary gov-btn-lg">
                  Track Complaint
                </button>
              </div>

              <div className="gov-service-card" onClick={() => navigateToView('leaderboard')}>
                <div className="gov-service-icon">🏆</div>
                <h3 className="gov-service-title">Citizen Leaderboard</h3>
                <p className="gov-service-description">
                  View rankings and earn points for civic participation
                </p>
                <button className="gov-btn gov-btn-success gov-btn-lg">
                  View Rankings
                </button>
              </div>

              {/* Volunteer Dashboard Card - Only show if user is a volunteer */}
              {volunteerProfile && (
                <div className="gov-service-card" onClick={() => navigate('/volunteer')} style={{ 
                  background: 'linear-gradient(135deg, #8B5CF615 0%, #6366F115 100%)',
                  border: '2px solid #8B5CF6'
                }}>
                  <div className="gov-service-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
                    🤝
                  </div>
                  <h3 className="gov-service-title" style={{ color: '#8B5CF6' }}>Volunteer Dashboard</h3>
                  <p className="gov-service-description">
                    Help your community by responding to nearby civic issues
                  </p>
                  <button className="gov-btn gov-btn-lg" style={{ 
                    background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                    color: 'white'
                  }}>
                    View Tasks
                  </button>
                  {volunteerProfile.is_available && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: '#22C55E',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}>
                      ✅ Available
                    </div>
                  )}
                </div>
              )}

              {/* Become a Volunteer Card - Show if user is NOT a volunteer */}
              {!volunteerProfile && (
                <div className="gov-service-card" onClick={async () => {
                  try {
                    // First check if profile already exists
                    const existingProfile = await supabaseService.getVolunteerProfile(user.id);
                    
                    if (existingProfile) {
                      // Profile exists, just update state
                      setVolunteerProfile(existingProfile);
                      notify('Volunteer profile loaded! 🎉', 'success');
                      return;
                    }
                    
                    // Profile doesn't exist, create it
                    notify('Creating volunteer profile...', 'success');
                    const locationModule = await import('../services/locationService');
                    const locationResult = await locationModule.default.getCurrentLocation();
                    
                    await supabaseService.createVolunteerProfile(user.id, {
                      name: user.name,
                      phone: user.phone || '',
                      role: 'citizen',
                      lat: locationResult.success ? locationResult.location.latitude : null,
                      lng: locationResult.success ? locationResult.location.longitude : null,
                      location_address: locationResult.success ? locationResult.location.address : null
                    });
                    
                    // Reload volunteer profile
                    const profile = await supabaseService.getVolunteerProfile(user.id);
                    setVolunteerProfile(profile);
                    notify('Volunteer profile created! 🎉', 'success');
                  } catch (error) {
                    console.error('Error with volunteer profile:', error);
                    
                    // If error is duplicate, try to load existing profile
                    if (error.message?.includes('duplicate') || error.message?.includes('409')) {
                      try {
                        const profile = await supabaseService.getVolunteerProfile(user.id);
                        if (profile) {
                          setVolunteerProfile(profile);
                          notify('Volunteer profile loaded! 🎉', 'success');
                          return;
                        }
                      } catch (loadError) {
                        console.error('Could not load existing profile:', loadError);
                      }
                    }
                    
                    notify('Failed to enable volunteer mode. Please try signing out and back in.', 'error');
                  }
                }} style={{ 
                  background: 'linear-gradient(135deg, #8B5CF610 0%, #6366F110 100%)',
                  border: '2px dashed #8B5CF6',
                  cursor: 'pointer'
                }}>
                  <div className="gov-service-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
                    🤝
                  </div>
                  <h3 className="gov-service-title" style={{ color: '#8B5CF6' }}>Become a Volunteer</h3>
                  <p className="gov-service-description">
                    Help your community by responding to nearby civic issues
                  </p>
                  <button className="gov-btn gov-btn-lg" style={{ 
                    background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                    color: 'white'
                  }}>
                    Enable Volunteer Mode
                  </button>
                </div>
              )}
            </div>

            {/* Government Statistics */}
            <div className="gov-stats-grid">
              <div className="gov-stat-card">
                <h3 className="gov-stat-number">{complaints.length}</h3>
                <p className="gov-stat-label">Total Complaints</p>
              </div>
              <div className="gov-stat-card">
                <h3 className="gov-stat-number">{complaints.filter(c => c.status === 'Resolved').length}</h3>
                <p className="gov-stat-label">Resolved Issues</p>
              </div>
              <div className="gov-stat-card">
                <h3 className="gov-stat-number">{Math.round((complaints.filter(c => c.status === 'Resolved').length / complaints.length) * 100)}%</h3>
                <p className="gov-stat-label">Resolution Rate</p>
              </div>
              <div className="gov-stat-card">
                <h3 className="gov-stat-number">24h</h3>
                <p className="gov-stat-label">Avg Response Time</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="gov-card">
              <div className="gov-card-header">
                <h3 className="gov-card-title">
                  <div className="gov-card-icon">📋</div>
                  Recent Activity
                </h3>
              </div>
              <div className="gov-card-body">
                {complaints.slice(0, 4).map(c => {
                  const d = DEPARTMENTS.find(x => x.id === c.dept);
                  const ticketId = c.ticket_id || c.ticketId;
                  return (
                    <div key={c.id} style={{ 
                      padding: '1rem', 
                      marginBottom: '0.75rem', 
                      background: '#f8fafc', 
                      borderRadius: '8px',
                      borderLeft: `4px solid ${d?.color}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: '600', color: 'var(--gov-dark)' }}>
                            {c.title}
                          </div>
                          {ticketId && (
                            <div style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: '700',
                              color: 'var(--gov-blue)',
                              background: 'var(--gov-blue-light)',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '4px',
                              letterSpacing: '0.5px'
                            }}>
                              {ticketId}
                            </div>
                          )}
                          {c.is_volunteer_assigned && (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.125rem 0.5rem',
                              background: '#8B5CF615',
                              border: '1px solid #8B5CF6',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              color: '#8B5CF6'
                            }}>
                              <span>🤝</span>
                              Volunteer
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gov-text-light)' }}>
                          📍 {c.location} • {timeAgo(c.createdAt)}
                        </div>
                      </div>
                      <StatusBadge s={c.status} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {view === 'leaderboard' && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <button onClick={() => navigateToView('home')} className="gov-btn gov-btn-secondary" style={{ marginBottom: '1rem' }}>
              ← Back to Home
            </button>
            <LazyLeaderboard />
          </div>
        )}

        {view === 'track' && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <div className="gov-card">
              <div className="gov-card-header">
                <h3 className="gov-card-title">
                  <div className="gov-card-icon">🔍</div>
                  Track Your Complaint
                </h3>
              </div>
              <div className="gov-card-body">
                <button onClick={() => { navigateToView('home'); setTracked(null); setTrackId(''); }} className="gov-btn gov-btn-secondary" style={{ marginBottom: '1.5rem' }}>
                  ← Back to Home
                </button>
                
                <div className="gov-form-group">
                  <label className="gov-label">Ticket ID</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input 
                      className="gov-input" 
                      placeholder="e.g. NV-001" 
                      value={trackId} 
                      onChange={e => setTrackId(e.target.value)} 
                      style={{ flex: 1 }}
                    />
                    <button className="gov-btn gov-btn-primary" onClick={doTrack}>
                      Track Status
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {tracked && <TrackView c={tracked} />}
            {tracked && (
              <div style={{ marginTop: '1.5rem' }}>
                <AuditTrail complaintId={tracked.id} ticketId={tracked.ticket_id || tracked.ticketId} />
              </div>
            )}
          </div>
        )}

        {view === 'file' && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <div className="gov-card">
              <div className="gov-card-header">
                <h3 className="gov-card-title">
                  <div className="gov-card-icon">📝</div>
                  File New Complaint
                </h3>
              </div>
              <div className="gov-card-body">
                <button onClick={() => navigateToView('home')} className="gov-btn gov-btn-secondary" style={{ marginBottom: '1.5rem' }}>
                  ← Back to Home
                </button>
                
                {/* Government Progress Steps */}
                <div className="gov-steps" style={{ marginBottom: '2rem' }}>
                  {[
                    { num: '1', label: 'Your Information', icon: '👤' },
                    { num: '2', label: 'Complaint Details', icon: '📝' },
                    { num: '3', label: 'AI Review', icon: '🤖' },
                    { num: '4', label: 'Submit', icon: '✅' }
                  ].map((s, i) => (
                    <div key={s.num} className={`gov-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'completed' : ''}`}>
                      <div className="gov-step-circle">
                        {step > i + 1 ? '✓' : s.icon}
                      </div>
                      <div className="gov-step-label">{s.label}</div>
                    </div>
                  ))}
                </div>

                {step === 1 && (
                  <div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--gov-dark)', marginBottom: '1.5rem' }}>
                      Personal Information
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div className="gov-form-group">
                        <label className="gov-label">Full Name *</label>
                        <input 
                          className="gov-input" 
                          placeholder="e.g. Priya Sharma" 
                          value={form.name} 
                          onChange={e => f('name', e.target.value)} 
                        />
                      </div>
                      <div className="gov-form-group">
                        <label className="gov-label">Phone Number *</label>
                        <input 
                          className="gov-input" 
                          placeholder="10-digit mobile number" 
                          value={form.phone} 
                          onChange={e => f('phone', e.target.value)} 
                        />
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                      <div className="gov-form-group">
                        <label className="gov-label">Location *</label>
                        <input 
                          className="gov-input" 
                          placeholder="Street, Area, City" 
                          value={form.location} 
                          onChange={e => f('location', e.target.value)} 
                        />
                      </div>
                      <div className="gov-form-group">
                        <label className="gov-label">Ward/Pincode</label>
                        <input 
                          className="gov-input" 
                          placeholder="e.g. Ward 42 or 110001" 
                          value={form.ward} 
                          onChange={e => f('ward', e.target.value)} 
                        />
                      </div>
                    </div>
                    
                    <button 
                      className="gov-btn gov-btn-primary gov-btn-lg" 
                      onClick={() => { 
                        if (!form.name || !form.phone || !form.location) { 
                          notify('Please fill all required fields', 'error'); 
                          return; 
                        } 
                        setStep(2);
                      }}
                      style={{ width: '100%' }}
                    >
                      Next: Complaint Details →
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--gov-dark)', marginBottom: '1.5rem' }}>
                      Complaint Details & Evidence
                    </h4>
                    
                    {/* Photo Upload Section */}
                    <div className="gov-photo-upload" style={{ marginBottom: '2rem' }}>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gov-text-light)', marginBottom: '1rem', textAlign: 'center' }}>
                        📸 Visual Evidence (Optional but Recommended)
                      </div>
                      
                      {!form.photo && !photoMode && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                          <button className="gov-btn gov-btn-primary" onClick={startCamera}>
                            📷 Take Photo
                          </button>
                          <button className="gov-btn gov-btn-secondary" onClick={() => fileInputRef.current?.click()}>
                            📁 Upload Photo
                          </button>
                        </div>
                      )}

                      {photoMode && (
                        <div style={{ marginBottom: '1rem' }}>
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline
                            style={{ width: '100%', maxHeight: '300px', borderRadius: '12px' }}
                          />
                          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <button className="gov-btn gov-btn-success" onClick={capturePhoto} style={{ marginRight: '1rem' }}>
                              📸 Capture
                            </button>
                            <button className="gov-btn gov-btn-secondary" onClick={stopCamera}>
                              ✕ Cancel
                            </button>
                          </div>
                          <canvas ref={canvasRef} style={{ display: 'none' }} />
                        </div>
                      )}

                      {form.photo && (
                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                          <img 
                            src={URL.createObjectURL(form.photo)} 
                            alt="Issue evidence" 
                            style={{ maxWidth: '300px', height: '200px', objectFit: 'cover', borderRadius: '12px' }}
                          />
                          <div style={{ marginTop: '0.5rem' }}>
                            <button onClick={() => f('photo', null)} className="gov-btn gov-btn-secondary">
                              Remove Photo
                            </button>
                          </div>
                        </div>
                      )}

                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </div>

                    <div className="gov-form-group" style={{ marginBottom: '1.5rem' }}>
                      <label className="gov-label">Complaint Title *</label>
                      <input 
                        className="gov-input" 
                        placeholder="Short, clear title describing the issue" 
                        value={form.title} 
                        onChange={e => f('title', e.target.value)} 
                      />
                    </div>

                    <div className="gov-form-group" style={{ marginBottom: '2rem' }}>
                      <label className="gov-label">Detailed Description *</label>
                      <textarea 
                        className="gov-input gov-textarea" 
                        placeholder="Describe the problem in detail..." 
                        value={form.description} 
                        onChange={e => f('description', e.target.value)} 
                        style={{ minHeight: '150px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button className="gov-btn gov-btn-secondary" onClick={() => setStep(1)}>
                        ← Back
                      </button>
                      <button 
                        className="gov-btn gov-btn-primary gov-btn-lg" 
                        onClick={analyze} 
                        disabled={analyzing}
                        style={{ flex: 1 }}
                      >
                        {analyzing ? 'Analyzing...' : '🤖 Analyze with AI →'}
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && triage && (
                  <div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--gov-dark)', marginBottom: '1.5rem' }}>
                      AI Analysis Results
                    </h4>
                    
                    <div className="gov-alert gov-alert-success" style={{ marginBottom: '2rem' }}>
                      <div>
                        <strong>🤖 AI Analysis Complete:</strong> {triage.confidence}% confidence
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                      <div className="gov-stat-card">
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gov-text-light)' }}>Category</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: '700' }}>{triage.category}</div>
                      </div>
                      <div className="gov-stat-card">
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gov-text-light)' }}>Department</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: '700' }}>{triage.department?.name}</div>
                      </div>
                      <div className="gov-stat-card">
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gov-text-light)' }}>Priority</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: '700' }}>{triage.priority}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button className="gov-btn gov-btn-secondary" onClick={() => setStep(2)}>
                        ← Edit Details
                      </button>
                      <button 
                        className="gov-btn gov-btn-primary gov-btn-lg" 
                        onClick={() => setStep(4)} 
                        style={{ flex: 1 }}
                      >
                        Proceed to Submit →
                      </button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--gov-dark)', marginBottom: '1.5rem' }}>
                      Review & Submit
                    </h4>

                    <div className="gov-card" style={{ marginBottom: '2rem' }}>
                      <div className="gov-card-body">
                        <h5 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                          {form.title}
                        </h5>
                        <p style={{ marginBottom: '1rem' }}>{form.description}</p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                          <div><strong>Name:</strong> {form.name}</div>
                          <div><strong>Location:</strong> {form.location}</div>
                          <div><strong>Category:</strong> {triage?.category}</div>
                          <div><strong>Priority:</strong> {triage?.priority}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button className="gov-btn gov-btn-secondary" onClick={() => setStep(3)}>
                        ← Back
                      </button>
                      <button 
                        className="gov-btn gov-btn-success gov-btn-lg" 
                        onClick={doSubmit} 
                        style={{ flex: 1 }}
                      >
                        ✅ Submit to Government
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'success' && ticket && (
          <div style={{ animation: 'fadeUp .4s ease', textAlign: 'center' }}>
            <div className="gov-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div className="gov-card-body" style={{ padding: '3rem 2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✅</div>
                <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--gov-dark)', marginBottom: '1rem' }}>
                  Complaint Successfully Filed!
                </h2>
                
                <div style={{ 
                  display: 'inline-block', 
                  background: 'linear-gradient(135deg, var(--gov-primary), var(--gov-secondary))', 
                  color: 'white', 
                  padding: '1rem 2rem', 
                  borderRadius: '12px', 
                  fontSize: '1.5rem', 
                  fontWeight: '800', 
                  marginBottom: '1.5rem',
                  letterSpacing: '2px'
                }}>
                  Ticket ID: {ticket.ticket_id || ticket.ticketId || 'Processing...'}
                </div>
                
                <div className="gov-alert gov-alert-success" style={{ textAlign: 'left', marginBottom: '2rem' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                      🏛️ Your complaint has been officially registered with the Government of India
                    </div>
                    <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                      • Routed to: <strong>{ticket.departments?.name || DEPARTMENTS.find(d => d.id === ticket.dept || d.id === ticket.department_id)?.name || 'Department'}</strong><br/>
                      • Expected Resolution: <strong>{ticket.sla_hours || ticket.slaHours || 72} hours</strong><br/>
                      • Priority: <strong style={{ textTransform: 'capitalize' }}>{ticket.priority || 'Medium'}</strong><br/>
                      • SMS updates will be sent to your registered mobile number<br/>
                      • You can track progress anytime using your ticket ID
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button 
                    className="gov-btn gov-btn-primary gov-btn-lg" 
                    onClick={() => { 
                      navigateToView('track'); 
                      setTrackId(ticket.ticket_id || ticket.ticketId); 
                      setTracked(ticket); 
                    }}
                    style={{ width: '100%' }}
                  >
                    🔍 Track My Complaint Status
                  </button>
                  <button 
                    className="gov-btn gov-btn-secondary gov-btn-lg" 
                    onClick={() => { 
                      navigateToView('home'); 
                      setStep(1); 
                      setForm({ name: '', phone: '', location: '', ward: '', title: '', description: '', photo: null }); 
                      setTriage(null);
                      setTicket(null);
                    }}
                    style={{ width: '100%' }}
                  >
                    File Another Complaint
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}