import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { TopNav } from '../components/UI';
import AuditTrail from '../components/AuditTrail';
import '../styles/volunteer-dashboard.css';

const VolunteerDashboard = () => {
  const { user, notify, supabaseService } = useApp();
  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'my-tasks'
  const [previousTaskCount, setPreviousTaskCount] = useState(0);
  const [newTasksCount, setNewTasksCount] = useState(0);

  const loadVolunteerProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      const profile = await supabaseService.getVolunteerProfile(user.id);
      setVolunteerProfile(profile);
    } catch (error) {
      console.error('Error loading volunteer profile:', error);
    }
  }, [user, supabaseService]);

  const loadAvailableTasks = useCallback(async () => {
    if (!volunteerProfile) return;
    
    try {
      // Get tasks offered to this volunteer
      const tasks = await supabaseService.getVolunteerTasks(volunteerProfile.id, 'offered');
      
      // Check for new tasks
      if (tasks.length > previousTaskCount && previousTaskCount > 0) {
        const newTasksAdded = tasks.length - previousTaskCount;
        setNewTasksCount(newTasksAdded);
        
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🤝 New Task Available!', {
            body: `${newTasksAdded} new civic issue${newTasksAdded > 1 ? 's' : ''} nearby needs your help`,
            icon: '/logo192.png',
            badge: '/logo192.png',
            tag: 'volunteer-task',
            requireInteraction: false
          });
        }
        
        // Show in-app notification
        notify(`🎯 ${newTasksAdded} new task${newTasksAdded > 1 ? 's' : ''} available nearby!`, 'success');
        
        // Clear new tasks badge after 10 seconds
        setTimeout(() => setNewTasksCount(0), 10000);
      }
      
      setPreviousTaskCount(tasks.length);
      setAvailableTasks(tasks);
    } catch (error) {
      console.error('Error loading available tasks:', error);
    }
  }, [volunteerProfile, supabaseService, previousTaskCount, notify]);

  const loadMyTasks = useCallback(async () => {
    if (!volunteerProfile) return;
    
    try {
      // Get accepted and in-progress tasks
      const tasks = await supabaseService.getVolunteerTasks(volunteerProfile.id);
      setMyTasks(tasks.filter(t => t.status === 'accepted' || t.status === 'in_progress'));
    } catch (error) {
      console.error('Error loading my tasks:', error);
    }
  }, [volunteerProfile, supabaseService]);

  useEffect(() => {
    loadVolunteerProfile();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted');
        }
      });
    }
  }, [loadVolunteerProfile]);

  useEffect(() => {
    if (volunteerProfile) {
      loadAvailableTasks();
      loadMyTasks();
      setLoading(false);

      // Set up polling - check every 5 seconds for testing
      const interval = setInterval(() => {
        loadAvailableTasks();
        loadMyTasks();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [volunteerProfile, loadAvailableTasks, loadMyTasks]);

  const handleAcceptTask = async (task) => {
    try {
      await supabaseService.acceptVolunteerTask(task.id, volunteerProfile.id);
      notify('Task accepted! You earned 20 points 🎉', 'success');
      loadAvailableTasks();
      loadMyTasks();
    } catch (error) {
      console.error('Error accepting task:', error);
      notify('Failed to accept task', 'error');
    }
  };

  const handleCompleteTask = async (task, notes, proofPhoto, gpsLocation) => {
    try {
      // Upload proof photo first
      let proofImageUrl = null;
      if (proofPhoto) {
        try {
          const uploadResult = await supabaseService.uploadComplaintImages([proofPhoto]);
          proofImageUrl = uploadResult[0];
        } catch (uploadError) {
          console.error('Photo upload failed:', uploadError);
          notify('Photo upload failed, but continuing...', 'error');
        }
      }

      await supabaseService.completeVolunteerTask(task.id, volunteerProfile.id, {
        notes,
        proofImageUrl,
        gpsLocation
      });
      notify('Task completed! You earned 50 points 🏆', 'success');
      loadMyTasks();
      loadAvailableTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      notify('Failed to complete task', 'error');
    }
  };

  const toggleAvailability = async () => {
    try {
      const newStatus = !volunteerProfile.is_available;
      await supabaseService.updateVolunteerAvailability(volunteerProfile.id, newStatus);
      setVolunteerProfile(prev => ({ ...prev, is_available: newStatus }));
      notify(newStatus ? 'You are now available for tasks' : 'You are now unavailable', 'success');
    } catch (error) {
      console.error('Error toggling availability:', error);
      notify('Failed to update availability', 'error');
    }
  };

  if (loading) {
    return (
      <div className="volunteer-loading">
        <div className="volunteer-loading-spinner"></div>
        <div className="volunteer-loading-text">Loading Volunteer Dashboard...</div>
      </div>
    );
  }

  if (!volunteerProfile) {
    return (
      <div className="volunteer-dashboard">
        <TopNav title="Volunteer Dashboard" sub="Community Response Network" role="citizen" />
        <div className="volunteer-content">
          <div className="volunteer-empty-state">
            <div className="volunteer-empty-icon">🤝</div>
            <h2 className="volunteer-empty-title">You're not registered as a volunteer</h2>
            <p className="volunteer-empty-description">
              Please enable volunteer mode in your profile settings to help your community.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getRoleIcon = (role) => {
    const icons = {
      'ngo': '🏢',
      'student': '🎓',
      'citizen': '👤'
    };
    return icons[role] || '👤';
  };

  return (
    <div className="volunteer-dashboard">
      <TopNav title="Volunteer Dashboard" sub={`${volunteerProfile.name} — Community Helper`} role="citizen" />

      {/* Header with Profile and Stats */}
      <div className="volunteer-header">
        <div className="volunteer-header-content">
          <div className="volunteer-profile-section">
            <div className="volunteer-profile-info">
              <div className="volunteer-avatar">
                {getRoleIcon(volunteerProfile.role)}
              </div>
              <div className="volunteer-profile-details">
                <h2>{volunteerProfile.name}</h2>
                <div className="volunteer-role-badge">
                  <span>{getRoleIcon(volunteerProfile.role)}</span>
                  <span style={{ textTransform: 'capitalize' }}>{volunteerProfile.role} Volunteer</span>
                </div>
              </div>
            </div>
            <button
              onClick={toggleAvailability}
              className={`volunteer-availability-toggle ${volunteerProfile.is_available ? 'available' : 'unavailable'}`}
            >
              <span>{volunteerProfile.is_available ? '✅' : '⏸️'}</span>
              <span>{volunteerProfile.is_available ? 'Available' : 'Unavailable'}</span>
            </button>
          </div>

          <div className="volunteer-stats-grid">
            <div className="volunteer-stat-card">
              <span className="volunteer-stat-icon">⭐</span>
              <div className="volunteer-stat-value">{volunteerProfile.rating.toFixed(1)}</div>
              <div className="volunteer-stat-label">Rating</div>
            </div>
            <div className="volunteer-stat-card">
              <span className="volunteer-stat-icon">✅</span>
              <div className="volunteer-stat-value">{volunteerProfile.tasks_completed}</div>
              <div className="volunteer-stat-label">Completed</div>
            </div>
            <div className="volunteer-stat-card">
              <span className="volunteer-stat-icon">📋</span>
              <div className="volunteer-stat-value">{volunteerProfile.tasks_accepted}</div>
              <div className="volunteer-stat-label">Accepted</div>
            </div>
            <div className="volunteer-stat-card">
              <span className="volunteer-stat-icon">🎯</span>
              <div className="volunteer-stat-value">{availableTasks.length}</div>
              <div className="volunteer-stat-label">Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="volunteer-tabs">
        <div className="volunteer-tabs-content">
          <div className="volunteer-tabs-buttons">
            {[
              ['available', '🔔 Available Tasks', availableTasks.length],
              ['my-tasks', '📋 My Tasks', myTasks.length]
            ].map(([tab, label, count]) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === 'available') setNewTasksCount(0);
                }}
                className={`volunteer-tab-button ${activeTab === tab ? 'active' : ''}`}
              >
                <span>{label}</span>
                {count > 0 && (
                  <span className="volunteer-tab-badge">{count}</span>
                )}
                {tab === 'available' && newTasksCount > 0 && (
                  <span className="volunteer-new-badge">+{newTasksCount}</span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              loadAvailableTasks();
              loadMyTasks();
              notify('Refreshed tasks', 'success');
            }}
            className="volunteer-refresh-button"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: window.innerWidth <= 768 ? '12px' : '2rem', paddingBottom: window.innerWidth <= 768 ? '80px' : '2rem' }}>
        {activeTab === 'available' && (
          <div>
            {availableTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎯</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--gov-dark)', marginBottom: '0.5rem' }}>
                  No tasks available right now
                </h3>
                <p style={{ color: 'var(--gov-text-light)' }}>
                  Check back later for new tasks in your area
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))', gap: window.innerWidth <= 768 ? '1rem' : '1.5rem' }}>
                {availableTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onAccept={() => handleAcceptTask(task)}
                    type="available"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-tasks' && (
          <div>
            {myTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--gov-dark)', marginBottom: '0.5rem' }}>
                  No active tasks
                </h3>
                <p style={{ color: 'var(--gov-text-light)' }}>
                  Accept tasks from the Available Tasks tab to get started
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))', gap: window.innerWidth <= 768 ? '1rem' : '1.5rem' }}>
                {myTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={(notes) => handleCompleteTask(task, notes)}
                    type="my-task"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const TaskCard = ({ task, onAccept, onComplete, type }) => {
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [proofPhoto, setProofPhoto] = useState(null);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [capturingGPS, setCapturingGPS] = useState(false);
  const [photoMode, setPhotoMode] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const fileInputRef = useRef(null);

  const complaint = task.complaints || {};
  const priorityColors = {
    low: '#22C55E',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#DC2626'
  };

  // Auto-capture GPS when opening complete form
  useEffect(() => {
    if (showCompleteForm && !gpsLocation) {
      captureGPS();
    }
  }, [showCompleteForm]);

  const captureGPS = async () => {
    setCapturingGPS(true);
    try {
      const locationModule = await import('../services/locationService');
      const result = await locationModule.default.getCurrentLocation();
      if (result.success) {
        setGpsLocation(result.location);
      }
    } catch (error) {
      console.error('GPS capture failed:', error);
    } finally {
      setCapturingGPS(false);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setPhotoMode(true);
      }
    } catch (err) {
      alert('Camera access failed');
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
      const file = new File([blob], 'proof-photo.jpg', { type: 'image/jpeg' });
      setProofPhoto(file);
      stopCamera();
    }, 'image/jpeg', 0.8);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setProofPhoto(file);
    }
  };

  const handleComplete = () => {
    if (!proofPhoto) {
      alert('Please upload a proof photo of the resolved issue');
      return;
    }
    if (!notes.trim()) {
      alert('Please add completion notes');
      return;
    }
    onComplete(notes, proofPhoto, gpsLocation);
  };

  return (
    <div className="gov-card" style={{ padding: '1.5rem', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <span style={{
          background: priorityColors[complaint.priority] + '20',
          color: priorityColors[complaint.priority],
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: '700',
          textTransform: 'uppercase'
        }}>
          {complaint.priority}
        </span>
      </div>

      <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--gov-dark)', marginBottom: '0.75rem', paddingRight: '4rem' }}>
        {complaint.title}
      </h3>

      <p style={{ fontSize: '0.875rem', color: 'var(--gov-text-light)', marginBottom: '1rem', lineHeight: '1.5' }}>
        {complaint.description?.substring(0, 100)}...
      </p>

      {/* Evidence Photos */}
      {(() => {
        const photos = complaint.photo_urls || complaint.photoUrls || [];
        if (!photos || photos.length === 0) return null;
        return (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--gov-text-light)', marginBottom: '0.5rem' }}>📷 EVIDENCE ({photos.length})</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={url}
                    alt={`Evidence ${i + 1}`}
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid #E2E8F0', cursor: 'pointer' }}
                    onError={e => e.target.parentElement.style.display = 'none'}
                  />
                </a>
              ))}
            </div>
          </div>
        );
      })()}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <span>📍</span>
          <span style={{ color: 'var(--gov-text)' }}>{complaint.location}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <span>🚶</span>
          <span style={{ color: 'var(--gov-text)' }}>{task.distance_km?.toFixed(1)} km away</span>
        </div>
      </div>

      {type === 'available' && !showCompleteForm && (
        <button
          onClick={onAccept}
          className="gov-btn gov-btn-primary"
          style={{ width: '100%' }}
        >
          Accept Task (+20 points)
        </button>
      )}

      {type === 'my-task' && !showCompleteForm && (
        <button
          onClick={() => setShowCompleteForm(true)}
          className="gov-btn gov-btn-success"
          style={{ width: '100%' }}
        >
          Mark as Completed
        </button>
      )}

      {showCompleteForm && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#F8FAFC', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--gov-dark)' }}>
            Complete Task
          </h4>

          {/* GPS Status */}
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: gpsLocation ? '#DCFCE7' : '#FEF3C7', borderRadius: '8px', fontSize: '0.875rem' }}>
            {capturingGPS ? (
              <span>📍 Capturing GPS location...</span>
            ) : gpsLocation ? (
              <span>✅ Location captured: {gpsLocation.address || `${gpsLocation.latitude.toFixed(4)}, ${gpsLocation.longitude.toFixed(4)}`}</span>
            ) : (
              <span>⚠️ GPS not captured. <button onClick={captureGPS} style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#F59E0B' }}>Retry</button></span>
            )}
          </div>

          {/* Photo Upload */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--gov-dark)' }}>
              Proof Photo (Required) *
            </label>
            
            {!proofPhoto && !photoMode && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  onClick={startCamera}
                  className="gov-btn gov-btn-secondary"
                  style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                >
                  📷 Take Photo
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="gov-btn gov-btn-secondary"
                  style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                >
                  📁 Upload
                </button>
              </div>
            )}

            {photoMode && (
              <div>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline
                  style={{ width: '100%', maxHeight: '200px', borderRadius: '8px', marginBottom: '0.5rem' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={capturePhoto} className="gov-btn gov-btn-success" style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem' }}>
                    📸 Capture
                  </button>
                  <button onClick={stopCamera} className="gov-btn gov-btn-secondary" style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem' }}>
                    ✕ Cancel
                  </button>
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
            )}

            {proofPhoto && (
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={URL.createObjectURL(proofPhoto)} 
                  alt="Proof" 
                  style={{ maxWidth: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem' }}
                />
                <button onClick={() => setProofPhoto(null)} className="gov-btn gov-btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem' }}>
                  Remove Photo
                </button>
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

          {/* Completion Notes */}
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--gov-dark)' }}>
            Completion Notes *
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe what you did to resolve this issue..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '0.75rem',
              border: '2px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '0.875rem',
              marginBottom: '0.75rem',
              fontFamily: 'inherit'
            }}
          />

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleComplete}
              className="gov-btn gov-btn-success"
              style={{ flex: 1 }}
              disabled={!proofPhoto || !notes.trim()}
            >
              Submit (+50 points)
            </button>
            <button
              onClick={() => {
                setShowCompleteForm(false);
                setProofPhoto(null);
                setNotes('');
                setGpsLocation(null);
                stopCamera();
              }}
              className="gov-btn gov-btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Blockchain Audit Trail */}
      {complaint?.id && (
        <div style={{ marginTop: '1rem' }}>
          <AuditTrail complaintId={complaint.id} ticketId={complaint.ticket_id || complaint.ticketId} />
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
