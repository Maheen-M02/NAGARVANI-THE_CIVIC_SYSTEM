import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { aiTriage, aiImageClassification } from '../data/aiTriage';
import { TopNav, StatusBadge, PrioBadge, Spinner, timeAgo } from '../components/UI';
import { DEPARTMENTS, OFFICERS, SAMPLE_COMPLAINTS } from '../data/constants';
import { useTranslation } from 'react-i18next';

function TrackView({ c }) {
  const dept = DEPARTMENTS.find(x => x.id === c.dept);
  const officer = OFFICERS.find(x => x.id === c.officer);
  const elapsed = (Date.now() - c.createdAt) / 3600000;
  const slaPct = Math.min(100, (elapsed / c.slaHours) * 100);
  const slaColor = slaPct > 90 ? '#EF4444' : slaPct > 70 ? '#F97316' : '#22C55E';
  const slaLabel = slaPct > 100 ? 'BREACHED' : slaPct > 90 ? 'AT RISK' : 'ON TRACK';

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div className="card" style={{ padding: '22px', marginBottom: 18, borderTop: `4px solid ${dept?.color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#1E2845', marginBottom: 4 }}>{c.title}</h2>
            <div style={{ fontSize: 12, color: '#64748B' }}>🎫 {c.ticketId} • Filed {timeAgo(c.createdAt)}</div>
          </div>
          <StatusBadge s={c.status} />
        </div>
        <div className="grid-3" style={{ marginBottom: 16 }}>
          {[
            ['PRIORITY', <PrioBadge p={c.priority} />],
            ['DEPT', <span style={{ fontWeight: 700, color: dept?.color, fontSize: 13 }}>{dept?.icon} {dept?.name}</span>],
            ['AI CONFIDENCE', <span style={{ fontWeight: 800, color: '#22C55E', fontSize: 14 }}>🤖 {c.confidence}%</span>],
          ].map(([l, v]) => (
            <div key={l} style={{ padding: '12px', background: '#F8FAFC', borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>{l}</div>
              {v}
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 5 }}>
            <span>SLA Progress</span>
            <span style={{ color: slaColor }}>{Math.round(elapsed)}h / {c.slaHours}h — <b>{slaLabel}</b></span>
          </div>
          <div style={{ height: 7, background: '#E2E8F0', borderRadius: 999 }}>
            <div style={{ height: '100%', width: slaPct + '%', background: slaColor, borderRadius: 999, transition: 'width .5s' }} />
          </div>
        </div>
        {officer && (
          <div style={{ padding: '12px 14px', background: '#0A7EA408', border: '1px solid #0A7EA420', borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', marginBottom: 7 }}>ASSIGNED OFFICER</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, background: '#0A7EA4', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12 }}>{officer.avatar}</div>
              <div>
                <div style={{ fontWeight: 700, color: '#1E2845', fontSize: 13 }}>{officer.name}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>⭐ {officer.rating}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="card" style={{ padding: '22px' }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#1E2845', marginBottom: 16 }}>📋 Activity Timeline</h3>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 13, top: 0, bottom: 0, width: 2, background: '#E2E8F0' }} />
          {c.updates.map((u, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16, animation: `slideIn .3s ease ${i * .04}s both` }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: u.by?.includes('AI') || u.by === 'System' ? '#0A7EA4' : '#8B5CF6', flexShrink: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff' }}>
                {u.by?.includes('AI') || u.by === 'System' ? '🤖' : '👮'}
              </div>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div style={{ fontSize: 13, color: '#1E2845', lineHeight: 1.5 }}>{u.msg}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{u.by} • {timeAgo(u.time)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CitizenPortal() {
  const { submitComplaint, notify, complaints, addNotification } = useApp();
  const { t } = useTranslation();
  const [view, setView] = useState('home');
  const [step, setStep] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [triage, setTriage] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [trackId, setTrackId] = useState('');
  const [tracked, setTracked] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', location: '', ward: '', title: '', description: '', photo: null });
  const [photoMode, setPhotoMode] = useState(false);
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('idle'); // idle, requesting, active, error
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Check camera permissions on component mount
  useEffect(() => {
    const checkCameraSupport = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('Camera not supported');
        return;
      }
      
      try {
        // Check if we can enumerate devices (indicates some level of permission)
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log(`Found ${videoDevices.length} camera(s)`);
      } catch (err) {
        console.log('Camera enumeration failed:', err);
      }
    };
    
    checkCameraSupport();
  }, []);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const startCamera = async () => {
    try {
      setCameraStatus('requesting');
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraStatus('error');
        notify('Camera not supported on this device/browser', 'error');
        return;
      }

      // Check if we're on HTTPS (required for camera access)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setCameraStatus('error');
        notify('Camera requires HTTPS. Please use https://localhost:3000', 'error');
        return;
      }

      console.log('Starting camera access...');
      console.log('Protocol:', window.location.protocol);
      console.log('Hostname:', window.location.hostname);

      // Try different camera configurations in order of preference
      const cameraConfigs = [
        // Mobile back camera (best for capturing issues)
        { 
          video: { 
            facingMode: { exact: 'environment' },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          } 
        },
        // Mobile back camera (fallback)
        { 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        },
        // Front camera
        { 
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        },
        // Any available camera
        { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
        // Basic video (last resort)
        { video: true }
      ];

      let mediaStream = null;
      let lastError = null;

      for (let i = 0; i < cameraConfigs.length; i++) {
        try {
          console.log(`Trying camera config ${i + 1}:`, cameraConfigs[i]);
          mediaStream = await navigator.mediaDevices.getUserMedia(cameraConfigs[i]);
          console.log('Camera access successful with config:', i + 1);
          break;
        } catch (error) {
          console.log(`Camera config ${i + 1} failed:`, error.name, error.message);
          lastError = error;
          
          // If permission denied, don't try other configs
          if (error.name === 'NotAllowedError') {
            break;
          }
        }
      }

      if (!mediaStream) {
        throw lastError || new Error('All camera configurations failed');
      }

      // Set up video element
      setStream(mediaStream);
      setCameraStatus('active');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Handle video loading
        const handleVideoLoad = () => {
          videoRef.current.play().then(() => {
            console.log('Video playback started successfully');
            setPhotoMode(true);
            notify('Camera started successfully!', 'success');
          }).catch(playError => {
            console.error('Video play error:', playError);
            setCameraStatus('error');
            notify('Camera started but video playback failed', 'error');
          });
        };

        if (videoRef.current.readyState >= 2) {
          // Video is already loaded
          handleVideoLoad();
        } else {
          // Wait for video to load
          videoRef.current.onloadedmetadata = handleVideoLoad;
        }
      }

    } catch (err) {
      console.error('Camera access error:', err);
      setCameraStatus('error');
      
      let errorMessage = 'Camera access failed. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions when prompted and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported on this browser.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is being used by another application. Please close other apps and try again.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Camera constraints not supported. Trying basic camera access...';
      } else {
        errorMessage += `Error: ${err.message}. Please check camera permissions and try again.`;
      }
      
      notify(errorMessage, 'error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setPhotoMode(false);
    setCameraStatus('idle');
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
    } else {
      notify('Please select a valid image file', 'error');
    }
  };

  const analyzePhoto = async (photo) => {
    setPhotoAnalyzing(true);
    await new Promise(r => setTimeout(r, 2000)); // Simulate AI processing
    
    // Simulate AI image classification
    const classification = aiImageClassification(photo.name);
    f('title', classification.title);
    f('description', classification.description);
    
    // Add notification for photo analysis
    addNotification({
      type: 'photo_analyzed',
      title: 'Photo Analysis Complete',
      message: `AI has analyzed your photo and auto-filled the complaint details: "${classification.title}"`,
      icon: '🤖',
      priority: 'Medium'
    });
    
    setPhotoAnalyzing(false);
    notify('Photo analyzed! Please fill in your contact details.', 'success');
    
    // After photo analysis, go to step 1 to fill personal info
    setStep(1);
  };

  const analyze = async () => {
    if (!form.title || !form.description) { notify('Fill in complaint title and description', 'error'); return; }
    
    // If we already have photo analysis, skip the AI analysis step
    if (form.photo && triage) {
      setStep(3);
      return;
    }
    
    setAnalyzing(true);
    await new Promise(r => setTimeout(r, 1800));
    const triageData = form.photo 
      ? aiTriage(form.description + ' ' + form.title, form.photo)
      : aiTriage(form.description + ' ' + form.title);
    setTriage(triageData);
    
    // Add notification for AI triage completion
    addNotification({
      type: 'ai_triage',
      title: 'AI Analysis Complete',
      message: `Your complaint has been classified as "${triageData.category}" with ${triageData.confidence}% confidence and routed to ${triageData.department.name}`,
      icon: '🎯',
      priority: triageData.priority,
      department: triageData.department.name
    });
    
    setAnalyzing(false);
    setStep(3);
  };

  const doSubmit = () => {
    if (!form.name || !form.phone || !form.location) { notify('Fill all required fields', 'error'); return; }
    const c = submitComplaint(form);
    setTicket(c);
    setView('success');
    notify(`Ticket ${c.ticketId} filed!`, 'success');
  };

  const doTrack = () => {
    const c = complaints.find(x => x.ticketId === trackId.toUpperCase() || x.ticketId === trackId);
    if (c) { 
      setTracked(c); 
      // Add notification for tracking
      addNotification({
        type: 'track_details',
        title: 'Complaint Details Viewed',
        message: `You viewed details for complaint "${c.title}" (${c.ticketId})`,
        ticketId: c.ticketId,
        icon: '👁️',
        priority: c.priority,
        department: c.dept
      });
    } else { 
      notify('Not found. Try NV-001 through NV-012.', 'error'); 
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FA' }}>
      <TopNav title={t('citizenPortal')} sub={t('fileTrackResolve')} role="citizen" />
      <div className="main-container">

        {view === 'home' && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <div className="hero-section">
              <div style={{ position: 'absolute', right: -30, top: -30, width: 180, height: 180, background: '#00C2E010', borderRadius: '50%' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ color: '#fff', fontSize: 24, marginBottom: 8, lineHeight: 1.3 }}>{t('yourVoiceMatters')}</h2>
                <p style={{ color: '#8899BB', fontSize: 14, marginBottom: 24, maxWidth: 440, lineHeight: 1.5 }}>{t('fileComplaintDescription')}</p>
                <div className="action-buttons">
                  <button className="btn btn-gold btn-lg mobile-btn" onClick={() => { setView('file'); setStep(1); }}>
                    📝 <span>{t('fileComplaint')}</span>
                  </button>
                  <button className="btn btn-photo btn-lg mobile-btn" onClick={() => { setView('file'); setStep(2); startCamera(); }}>
                    📸 <span>{t('snapReport')}</span>
                  </button>
                  <button onClick={() => setView('track')} className="btn-outline mobile-btn">
                    🔍 <span>{t('trackStatus')}</span>
                  </button>
                </div>
              </div>
            </div>
            <div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, color: '#1E2845', marginBottom: 14 }}>📋 {t('recentActivity')}</h3>
              {complaints.slice(0, 4).map(c => {
                const d = DEPARTMENTS.find(x => x.id === c.dept);
                return (
                  <div key={c.id} className="card activity-card" style={{ padding: '14px 18px', marginBottom: 10, borderLeft: `4px solid ${d?.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1E2845', marginBottom: 3, wordBreak: 'break-word' }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>📍 {c.location} • {timeAgo(c.createdAt)}</div>
                      </div>
                      <StatusBadge s={c.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'track' && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <button onClick={() => { setView('home'); setTracked(null); setTrackId(''); }} style={{ background: 'none', border: 'none', color: '#0A7EA4', cursor: 'pointer', fontWeight: 700, fontSize: 13, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 5 }}>← Back</button>
            <div className="card" style={{ padding: '24px', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, color: '#1E2845', marginBottom: 6 }}>🔍 Track Your Complaint</h2>
              <p style={{ color: '#64748B', fontSize: 13, marginBottom: 20 }}>Enter your ticket ID. Try: NV-001 through NV-012</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <input className="input" placeholder="e.g. NV-001" value={trackId} onChange={e => setTrackId(e.target.value)} onKeyDown={e => e.key === 'Enter' && doTrack()} style={{ maxWidth: 260 }} />
                <button className="btn btn-primary" onClick={doTrack}>Track →</button>
              </div>
            </div>
            {tracked && <TrackView c={tracked} />}
          </div>
        )}

        {view === 'file' && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', color: '#0A7EA4', cursor: 'pointer', fontWeight: 700, fontSize: 13, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 5 }}>← Back</button>
            {/* Step indicator */}
            <div className="step-indicator">
              {[['1', 'Your Info'], ['2', 'Complaint'], ['3', 'AI Review'], ['4', 'Submit']].map(([n, l], i) => (
                <React.Fragment key={n}>
                  <div className="step-item" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div className="step-circle" style={{ width: 30, height: 30, borderRadius: '50%', background: step > i + 1 ? '#22C55E' : step === i + 1 ? '#0A7EA4' : '#E2E8F0', color: step >= i + 1 ? '#fff' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, transition: 'all .3s' }}>{step > i + 1 ? '✓' : n}</div>
                    <span className="step-label" style={{ fontSize: 12, fontWeight: 700, color: step === i + 1 ? '#0A7EA4' : '#94A3B8' }}>{l}</span>
                  </div>
                  {i < 3 && <div className="step-line" style={{ flex: 1, height: 2, background: step > i + 1 ? '#22C55E' : '#E2E8F0', margin: '0 6px', transition: 'all .3s' }} />}
                </React.Fragment>
              ))}
            </div>

            {step === 1 && (
              <div className="card" style={{ padding: '24px', animation: 'fadeUp .3s ease' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, color: '#1E2845', marginBottom: 18 }}>{t('yourInformation')}</h2>
                
                {/* Show photo analysis result if available */}
                {form.photo && form.title && (
                  <div style={{ 
                    background: 'linear-gradient(135deg, #22C55E15, #22C55E08)', 
                    border: '1px solid #22C55E30', 
                    borderRadius: 10, 
                    padding: '12px 16px', 
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    <div style={{ fontSize: 20 }}>🤖</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#22C55E', marginBottom: 2 }}>
                        AI Analysis Complete
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        Complaint details auto-filled: "{form.title}"
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid-2" style={{ marginBottom: 14 }}>
                  <div><label>{t('fullName')} *</label><input className="input" placeholder="e.g. Priya Sharma" value={form.name} onChange={e => f('name', e.target.value)} /></div>
                  <div><label>{t('phoneNumber')} *</label><input className="input" placeholder="10-digit number" value={form.phone} onChange={e => f('phone', e.target.value)} /></div>
                </div>
                <div className="grid-2" style={{ marginBottom: 22 }}>
                  <div><label>{t('location')} *</label><input className="input" placeholder="Street, Area, City" value={form.location} onChange={e => f('location', e.target.value)} /></div>
                  <div><label>{t('wardPincode')}</label><input className="input" placeholder="e.g. Ward 42" value={form.ward} onChange={e => f('ward', e.target.value)} /></div>
                </div>
                <button className="btn btn-primary btn-lg" onClick={async () => { 
                  if (!form.name || !form.phone || !form.location) { 
                    notify('Fill required fields', 'error'); 
                    return; 
                  } 
                  
                  // If we have photo and AI analysis, run triage and go to step 3
                  if (form.photo && form.title && form.description && !triage) {
                    setAnalyzing(true);
                    await new Promise(r => setTimeout(r, 1800));
                    const triageData = aiTriage(form.description + ' ' + form.title, form.photo);
                    setTriage(triageData);
                    
                    // Add notification for AI triage completion
                    addNotification({
                      type: 'ai_triage',
                      title: 'AI Analysis Complete',
                      message: `Your complaint has been classified as "${triageData.category}" with ${triageData.confidence}% confidence and routed to ${triageData.department.name}`,
                      icon: '🎯',
                      priority: triageData.priority,
                      department: triageData.department.name
                    });
                    
                    setAnalyzing(false);
                    setStep(3);
                  } else if (form.photo && form.title && form.description && triage) {
                    setStep(3);
                  } else {
                    setStep(2);
                  }
                }}>
                  {analyzing ? (
                    <><Spinner size={16} color="#fff" /> Analyzing...</>
                  ) : (
                    form.photo && form.title ? 'Review AI Analysis →' : 'Next →'
                  )}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="card" style={{ padding: '24px', animation: 'fadeUp .3s ease' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, color: '#1E2845', marginBottom: 6 }}>Describe Your Complaint</h2>
                <p style={{ color: '#64748B', fontSize: 13, marginBottom: 16 }}>Take a photo or describe the issue. Our AI will classify and route it automatically.</p>
                
                {/* Photo Capture Section */}
                <div className="photo-section" style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 8 }}>📸 Visual Evidence (Optional)</div>
                  
                  {!form.photo && !photoMode && (
                    <div className="photo-options">
                      {/* Camera Test Button */}
                      <button 
                        className="btn btn-info mobile-btn" 
                        onClick={async () => {
                          console.log('=== CAMERA DIAGNOSTIC TEST ===');
                          console.log('Protocol:', window.location.protocol);
                          console.log('Hostname:', window.location.hostname);
                          console.log('Full URL:', window.location.href);
                          console.log('MediaDevices supported:', !!navigator.mediaDevices);
                          console.log('getUserMedia supported:', !!navigator.mediaDevices?.getUserMedia);
                          
                          // Check available devices
                          if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                            try {
                              const devices = await navigator.mediaDevices.enumerateDevices();
                              const videoDevices = devices.filter(device => device.kind === 'videoinput');
                              console.log('Available video devices:', videoDevices.length);
                              videoDevices.forEach((device, index) => {
                                console.log(`Camera ${index + 1}:`, device.label || 'Unknown Camera', device.deviceId);
                              });
                            } catch (enumError) {
                              console.log('Device enumeration failed:', enumError);
                            }
                          }
                          
                          // Test basic camera access
                          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                            try {
                              console.log('Testing basic camera access...');
                              const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
                              console.log('✅ Camera test successful!', testStream);
                              console.log('Video tracks:', testStream.getVideoTracks().length);
                              testStream.getVideoTracks().forEach((track, index) => {
                                console.log(`Track ${index + 1}:`, track.label, track.getSettings());
                              });
                              notify('✅ Camera test successful! Camera is working properly.', 'success');
                              testStream.getTracks().forEach(track => track.stop()); // Stop test stream
                            } catch (err) {
                              console.error('❌ Camera test failed:', err);
                              console.log('Error details:', {
                                name: err.name,
                                message: err.message,
                                constraint: err.constraint
                              });
                              notify(`❌ Camera test failed: ${err.name} - ${err.message}`, 'error');
                            }
                          } else {
                            console.log('❌ Camera API not supported');
                            notify('❌ Camera API not supported in this browser', 'error');
                          }
                          
                          console.log('=== END DIAGNOSTIC TEST ===');
                        }}
                        style={{ marginRight: 10, marginBottom: 10, background: '#0EA5E9' }}
                      >
                        🧪 Test Camera
                      </button>
                      
                      <button 
                        className="btn btn-primary mobile-btn" 
                        onClick={startCamera}
                        disabled={cameraStatus === 'requesting'}
                        style={{ marginRight: 10, marginBottom: 10 }}
                      >
                        {cameraStatus === 'requesting' ? (
                          <><Spinner size={16} color="#fff" /> Requesting Camera...</>
                        ) : (
                          '📷 Take Photo'
                        )}
                      </button>
                      <button 
                        className="btn btn-secondary mobile-btn" 
                        onClick={() => fileInputRef.current?.click()}
                        style={{ marginBottom: 10 }}
                      >
                        📁 Upload Photo
                      </button>
                      
                      {/* Mobile Camera Capture (Alternative) */}
                      <button 
                        className="btn btn-success mobile-btn" 
                        onClick={() => {
                          // Create a temporary input for mobile camera
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.capture = 'environment'; // Use back camera
                          input.onchange = (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              f('photo', file);
                              analyzePhoto(file);
                            }
                          };
                          input.click();
                        }}
                        style={{ marginBottom: 10 }}
                      >
                        📱 Mobile Camera
                      </button>
                      
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        capture="environment"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                      
                      {/* HTTPS Setup Instructions */}
                      {window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && (
                        <div style={{ 
                          background: '#FEF3C7', 
                          border: '1px solid #F59E0B', 
                          borderRadius: 8, 
                          padding: '12px', 
                          marginTop: 10,
                          fontSize: 12,
                          color: '#92400E'
                        }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ HTTPS Required for Camera</div>
                          <div style={{ marginBottom: 8 }}>
                            Camera access requires HTTPS. To enable camera:
                          </div>
                          <div style={{ background: '#000', color: '#0EA5E9', padding: '8px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11, marginBottom: 8 }}>
                            npm run start:https-win
                          </div>
                          <div style={{ fontSize: 11 }}>
                            Then visit: <strong>https://localhost:3000</strong><br/>
                            Or use the file upload/mobile camera options above.
                          </div>
                        </div>
                      )}
                      
                      {/* Localhost HTTP warning */}
                      {window.location.protocol === 'http:' && window.location.hostname === 'localhost' && (
                        <div style={{ 
                          background: '#FEF3C7', 
                          border: '1px solid #F59E0B', 
                          borderRadius: 8, 
                          padding: '12px', 
                          marginTop: 10,
                          fontSize: 12,
                          color: '#92400E'
                        }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Camera May Not Work on HTTP</div>
                          <div style={{ marginBottom: 8 }}>
                            For best camera support, use HTTPS:
                          </div>
                          <div style={{ background: '#000', color: '#0EA5E9', padding: '8px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11, marginBottom: 8 }}>
                            npm run start:https-win
                          </div>
                          <div style={{ fontSize: 11 }}>
                            Then visit: <strong>https://localhost:3000</strong>
                          </div>
                        </div>
                      )}
                      
                      {/* Camera troubleshooting */}
                      {cameraStatus === 'error' && (
                        <div style={{ 
                          background: '#FEF2F2', 
                          border: '1px solid #FECACA', 
                          borderRadius: 8, 
                          padding: '12px', 
                          marginTop: 10,
                          fontSize: 12,
                          color: '#DC2626'
                        }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>Camera Access Issues?</div>
                          <div style={{ marginBottom: 8 }}>
                            • Make sure you're using HTTPS (not HTTP)<br/>
                            • Allow camera permissions when prompted<br/>
                            • Close other apps using the camera<br/>
                            • Try refreshing the page<br/>
                            • Current URL: {window.location.protocol}//{window.location.host}
                          </div>
                          <button 
                            className="btn btn-secondary"
                            onClick={() => {setCameraStatus('idle'); startCamera();}}
                            style={{ fontSize: 11, padding: '6px 12px' }}
                          >
                            Try Again
                          </button>
                        </div>
                      )}
                      
                      {/* Debug info for development */}
                      <div style={{ 
                        background: '#F0F9FF', 
                        border: '1px solid #BAE6FD', 
                        borderRadius: 8, 
                        padding: '8px', 
                        marginTop: 10,
                        fontSize: 11,
                        color: '#0369A1'
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Camera Status:</div>
                        <div>Status: <strong>{cameraStatus}</strong></div>
                        <div>Protocol: <strong>{window.location.protocol}</strong></div>
                        <div>URL: <strong>{window.location.href}</strong></div>
                        <div>MediaDevices: <strong>{navigator.mediaDevices ? 'Supported' : 'Not Supported'}</strong></div>
                        <div>getUserMedia: <strong>{navigator.mediaDevices?.getUserMedia ? 'Supported' : 'Not Supported'}</strong></div>
                        {stream && <div>Stream Active: <strong>Yes ({stream.getVideoTracks().length} video tracks)</strong></div>}
                      </div>
                    </div>
                  )}

                  {photoMode && (
                    <div className="camera-interface" style={{ marginBottom: 16 }}>
                      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', width: '100%' }}>
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline
                          style={{ width: '100%', height: 'auto', maxHeight: '300px', objectFit: 'cover', display: 'block' }}
                        />
                        <div className="camera-controls" style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 15, alignItems: 'center' }}>
                          <button 
                            className="btn btn-success"
                            onClick={capturePhoto}
                            style={{ borderRadius: '50%', width: 60, height: 60, padding: 0, fontSize: 24, border: '3px solid #fff', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                          >
                            📸
                          </button>
                          <button 
                            className="btn btn-secondary"
                            onClick={stopCamera}
                            style={{ borderRadius: '50%', width: 50, height: 50, padding: 0, fontSize: 16, border: '2px solid #fff', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </div>
                  )}

                  {form.photo && (
                    <div className="photo-preview" style={{ marginBottom: 16 }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img 
                          src={URL.createObjectURL(form.photo)} 
                          alt="Captured issue" 
                          style={{ width: '100%', maxWidth: 200, height: 150, objectFit: 'cover', borderRadius: 8, border: '2px solid #22C55E' }}
                        />
                        <button 
                          onClick={() => f('photo', null)}
                          style={{ position: 'absolute', top: -8, right: -8, background: '#EF4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 12 }}
                        >
                          ✕
                        </button>
                      </div>
                      {photoAnalyzing && (
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, color: '#0A7EA4' }}>
                          <Spinner size={16} color="#0A7EA4" />
                          <span style={{ fontSize: 13, fontWeight: 600 }}>AI analyzing photo...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 8 }}>⚡ Quick fill examples:</div>
                  <div className="sample-complaints">
                    {SAMPLE_COMPLAINTS.map((s, i) => (
                      <button key={i} onClick={() => { setForm(p => ({ ...p, ...s })); notify('Sample loaded!', 'info'); }} className="sample-btn">
                        {s.title.slice(0, 28)}...
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}><label>Complaint Title *</label><input className="input" placeholder="Short, clear title" value={form.title} onChange={e => f('title', e.target.value)} /></div>
                <div style={{ marginBottom: 20 }}><label>Detailed Description *</label><textarea className="textarea" placeholder="Describe the problem — location, duration, impact on residents..." value={form.description} onChange={e => f('description', e.target.value)} style={{ minHeight: 130 }} /></div>
                <div className="step-actions">
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn btn-primary btn-lg" onClick={analyze} disabled={analyzing} style={{ flex: 1, justifyContent: 'center', opacity: analyzing ? .9 : 1 }}>
                    {analyzing ? <><Spinner size={16} color="#fff" /> Analyzing...</> : '🤖 Analyze with AI →'}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && triage && (
              <div style={{ animation: 'fadeUp .3s ease' }}>
                <div className="card" style={{ padding: '24px', marginBottom: 16, border: '2px solid #22C55E30' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <div style={{ width: 44, height: 44, background: '#22C55E18', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🤖</div>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17, color: '#1E2845' }}>AI Triage Complete</div>
                      <div style={{ fontSize: 12, color: '#22C55E', fontWeight: 700 }}>
                        ✓ {triage.confidence}% confidence
                        {form.photo && <span style={{ marginLeft: 8, color: '#0A7EA4' }}>📸 +Photo boost</span>}
                      </div>
                    </div>
                  </div>
                  <div className="grid-2" style={{ marginBottom: 16 }}>
                    {[
                      ['🏷️ Category', triage.category],
                      ['🏛️ Department', triage.department?.icon + ' ' + triage.department?.name],
                      ['⚡ Priority', triage.priority],
                      ['⏱️ SLA', `${triage.slaHours} hours`],
                    ].map(([l, v]) => (
                      <div key={l} style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>{l}</div>
                        <div style={{ fontWeight: 700, color: '#1E2845', fontSize: 14 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {form.photo && (
                    <div style={{ padding: '12px 14px', background: '#22C55E08', border: '1px solid #22C55E20', borderRadius: 10, marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 8 }}>📸 VISUAL EVIDENCE</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img 
                          src={URL.createObjectURL(form.photo)} 
                          alt="Issue evidence" 
                          style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 6 }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: '#1E2845', fontSize: 13 }}>Photo Evidence Attached</div>
                          <div style={{ fontSize: 11, color: '#22C55E', fontWeight: 700 }}>+15% AI Confidence Boost</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {triage.officer && (
                    <div style={{ padding: '14px', background: '#0A7EA408', border: '1px solid #0A7EA420', borderRadius: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 8 }}>👮 ASSIGNED OFFICER</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, background: '#0A7EA4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>{triage.officer.avatar}</div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1E2845', fontSize: 13 }}>{triage.officer.name}</div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>⭐ {triage.officer.rating} • {triage.officer.load} active cases</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="step-actions">
                  <button className="btn btn-secondary" onClick={() => setStep(2)}>← Edit</button>
                  <button className="btn btn-primary btn-lg" onClick={() => setStep(4)} style={{ flex: 1, justifyContent: 'center' }}>Looks Good — Confirm →</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="card" style={{ padding: '24px', animation: 'fadeUp .3s ease' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, color: '#1E2845', marginBottom: 18 }}>Review & Submit</h2>
                <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 18, marginBottom: 20 }}>
                  {form.photo && (
                    <div style={{ marginBottom: 16, textAlign: 'center' }}>
                      <img 
                        src={URL.createObjectURL(form.photo)} 
                        alt="Issue evidence" 
                        style={{ width: '100%', maxWidth: 300, height: 200, objectFit: 'cover', borderRadius: 8, border: '2px solid #22C55E' }}
                      />
                      <div style={{ fontSize: 11, color: '#22C55E', fontWeight: 700, marginTop: 6 }}>📸 Photo Evidence Attached</div>
                    </div>
                  )}
                  <div style={{ fontWeight: 700, color: '#1E2845', fontSize: 15, marginBottom: 6 }}>{form.title}</div>
                  <div style={{ color: '#64748B', fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>{form.description}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: '#64748B' }}>
                    <span>👤 {form.name}</span><span>📍 {form.location}</span>
                    <span>🏷️ {triage?.category}</span><span>⚡ {triage?.priority}</span>
                    {form.photo && <span style={{ color: '#22C55E', fontWeight: 700 }}>📸 +Photo</span>}
                  </div>
                </div>
                <div className="step-actions">
                  <button className="btn btn-secondary" onClick={() => setStep(3)}>← Back</button>
                  <button className="btn btn-success btn-lg" onClick={doSubmit} style={{ flex: 1, justifyContent: 'center' }}>✅ Submit Complaint</button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'success' && ticket && (
          <div style={{ textAlign: 'center', animation: 'fadeUp .4s ease' }}>
            <div className="card" style={{ padding: '48px 36px', maxWidth: 500, margin: '0 auto' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#1E2845', marginBottom: 8 }}>Complaint Filed!</h2>
              <div style={{ display: 'inline-block', background: '#0A7EA415', color: '#0A7EA4', padding: '9px 24px', borderRadius: 999, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, marginBottom: 18, border: '2px solid #0A7EA430' }}>{ticket.ticketId}</div>
              <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                Routed to <strong>{DEPARTMENTS.find(d => d.id === ticket.dept)?.name}</strong>. Resolution in <strong>{ticket.slaHours}hrs</strong>. SMS updates will follow.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }} onClick={() => { setView('track'); setTrackId(ticket.ticketId); setTracked(ticket); }}>🔍 Track My Complaint</button>
                <button className="btn btn-secondary btn-lg" style={{ justifyContent: 'center' }} onClick={() => { setView('home'); setStep(1); setForm({ name: '', phone: '', location: '', ward: '', title: '', description: '' }); setTriage(null); }}>File Another</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
