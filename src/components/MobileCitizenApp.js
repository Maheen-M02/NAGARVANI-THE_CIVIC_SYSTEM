import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StatusBadge } from './UI';
import { DEPARTMENTS } from '../data/constants';
import locationService from '../services/locationService';
import { aiTriage, aiImageClassification } from '../data/aiTriage';
import VoiceAssistant from './VoiceAssistant';

// ── Status colour helper ──────────────────────────────────────
function statusColor(s) {
  const m = { Open:'#ea580c', 'In Progress':'#2563eb', Resolved:'#16a34a', Escalated:'#dc2626', pending:'#ea580c', in_progress:'#2563eb', resolved:'#16a34a' };
  return m[s] || '#64748b';
}
function statusBg(s) {
  const m = { Open:'#fff7ed', 'In Progress':'#eff6ff', Resolved:'#f0fdf4', Escalated:'#fef2f2', pending:'#fff7ed', in_progress:'#eff6ff', resolved:'#f0fdf4' };
  return m[s] || '#f8fafc';
}
function statusLabel(s) {
  const m = { pending:'Open', acknowledged:'Open', in_progress:'In Progress', resolved:'Resolved', closed:'Resolved', rejected:'Rejected' };
  return m[s] || s;
}

// ── Home Screen ───────────────────────────────────────────────
function HomeScreen({ user, complaints, onNavigate, signOut, t }) {
  const total = complaints.length;
  const resolved = complaints.filter(c => ['Resolved','resolved','closed'].includes(c.status)).length;
  const open = complaints.filter(c => ['Open','pending','acknowledged'].includes(c.status)).length;

  const actions = [
    { icon:'📝', label:t('citizen.fileComplaint'), sub:t('citizen.fileComplaintDesc'), color:'#eff6ff', iconBg:'#1e3a8a', view:'file' },
    { icon:'📸', label:t('citizen.snapReport'), sub:t('citizen.snapReportDesc'), color:'#f0fdf4', iconBg:'#16a34a', view:'snap' },
    { icon:'🔍', label:t('citizen.trackStatus'), sub:t('citizen.trackStatusDesc'), color:'#fef3c7', iconBg:'#d97706', view:'track' },
    { icon:'📞', label:'Call & Report', sub:'Voice complaint', color:'#fdf4ff', iconBg:'#7c3aed', view:'voice' },
  ];

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,#0D1B40,#1A3A8F)', borderRadius:'0 0 28px 28px', padding:'20px 16px 28px', marginBottom:16 }}>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', marginBottom:4 }}>Good day,</div>
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:'#fff', marginBottom:18 }}>
          {user?.name || 'Citizen'} 👋
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {[['🎫', total, t('citizen.totalComplaints')], ['📂', open, t('admin.open')], ['✅', resolved, t('admin.resolved')]].map(([ic,v,l]) => (
            <div key={l} style={{ flex:1, background:'rgba(255,255,255,0.12)', borderRadius:14, padding:'10px 8px', textAlign:'center', backdropFilter:'blur(10px)' }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800, color:'#00C2E0' }}>{ic} {v}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.65)', fontWeight:600, marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding:'0 12px', marginBottom:20 }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'#1e2845', marginBottom:12 }}>{t('citizen.fileComplaint')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {actions.map(a => (
            <button key={a.view} onClick={() => onNavigate(a.view)}
              style={{ background:'#fff', borderRadius:18, padding:'18px 12px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, border:'none', cursor:'pointer', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', WebkitTapHighlightColor:'transparent' }}>
              <div style={{ width:52, height:52, borderRadius:16, background:a.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>{a.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#1e2845' }}>{a.label}</div>
              <div style={{ fontSize:11, color:'#94a3b8' }}>{a.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ padding:'0 12px', marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'#1e2845' }}>{t('citizen.recentActivity')}</div>
          <button onClick={() => onNavigate('track')} style={{ fontSize:12, fontWeight:600, color:'#0ea5e9', background:'none', border:'none', cursor:'pointer' }}>See all</button>
        </div>
        {complaints.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:16, padding:'24px', textAlign:'center', color:'#94a3b8', fontSize:13 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
            No complaints yet. File your first one!
          </div>
        ) : complaints.slice(0,4).map(c => {
          const ticketId = c.ticket_id || c.ticketId;
          const dept = c.departments || DEPARTMENTS.find(d => d.id === (c.department_id || c.dept));
          const st = statusLabel(c.status);
          return (
            <div key={c.id} onClick={() => onNavigate('track', ticketId)}
              style={{ background:'#fff', borderRadius:16, padding:'14px 16px', marginBottom:10, display:'flex', alignItems:'center', gap:12, boxShadow:'0 2px 8px rgba(0,0,0,0.05)', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
              <div style={{ width:44, height:44, borderRadius:14, background:(dept?.color||'#0ea5e9')+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                {dept?.icon || '📋'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#1e2845', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:3 }}>{c.title}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {ticketId && <span style={{ fontSize:11, fontWeight:700, color:'#0ea5e9', background:'#e0f2fe', padding:'2px 8px', borderRadius:6 }}>{ticketId}</span>}
                  <span style={{ fontSize:11, color:'#94a3b8' }}>{dept?.name || 'Dept'}</span>
                </div>
              </div>
              <span style={{ fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:999, background:statusBg(c.status), color:statusColor(c.status), flexShrink:0 }}>{st}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── File Complaint Screen ─────────────────────────────────────
function FileScreen({ user, onBack, onSuccess, notify, submitComplaint, departments }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: user?.name||'', phone: user?.phone||'', location:'', ward:'', title:'', description:'', photo:null, gpsCoordinates:null });
  const [photoMode, setPhotoMode] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = React.useRef();
  const videoRef = React.useRef();
  const canvasRef = React.useRef();
  const [stream, setStream] = useState(null);
  const f = (k,v) => setForm(p => ({...p,[k]:v}));

  const captureGPS = async () => {
    try {
      const r = await locationService.getCurrentLocation();
      if (r.success) { f('gpsCoordinates', r.location); f('location', r.location.address || `${r.location.latitude.toFixed(4)}, ${r.location.longitude.toFixed(4)}`); notify('📍 Location captured', 'success'); }
    } catch(e) {}
  };

  React.useEffect(() => { captureGPS(); }, []);

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'environment' } });
      setStream(ms);
      setPhotoMode(true); // render video element first
    } catch(e) {
      console.error('Camera error:', e);
      notify('Camera access failed. Please allow camera permission.', 'error');
    }
  };

  // Attach stream to video element after it renders
  React.useEffect(() => {
    if (photoMode && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [photoMode, stream]);

  const stopCamera = () => { stream?.getTracks().forEach(t => t.stop()); setStream(null); setPhotoMode(false); };

  const capturePhoto = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) { notify('Camera not ready', 'error'); return; }

    // Wait for video to have dimensions
    const width = v.videoWidth || v.clientWidth || 640;
    const height = v.videoHeight || v.clientHeight || 480;

    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    ctx.drawImage(v, 0, 0, width, height);

    c.toBlob(blob => {
      if (!blob) { notify('Failed to capture photo', 'error'); return; }
      const file = new File([blob], 'issue.jpg', { type:'image/jpeg' });
      f('photo', file);
      stopCamera();
      analyzePhoto(file);
    }, 'image/jpeg', 0.85);
  };

  const analyzePhoto = async (photo) => {
    setAnalyzing(true);
    try {
      const r = await aiImageClassification(photo);
      f('title', r.title); f('description', r.description);
      notify('🤖 AI analyzed your photo!', 'success');
    } catch(e) { notify('AI analysis failed', 'error'); }
    setAnalyzing(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.location) { notify('Fill all required fields', 'error'); return; }
    if (submitting) return;
    setSubmitting(true);
    try {
      const c = await submitComplaint(form);
      if (c) { onSuccess(c); }
    } catch(e) { notify('Failed to submit. Try again.', 'error'); }
    setSubmitting(false);
  };

  const steps = ['Your Info', 'Issue Details', 'Review & Submit'];

  return (
    <div style={{ paddingBottom:80 }}>
      {/* Hidden canvas - always mounted for photo capture */}
      <canvas ref={canvasRef} style={{ display:'none' }} />

      {/* Back header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px 8px' }}>
        <button onClick={onBack} style={{ background:'#f1f5f9', border:'none', borderRadius:12, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:18 }}>←</button>
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:17, fontWeight:700, color:'#1e2845' }}>File Complaint</div>
      </div>

      {/* Step dots */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'8px 16px 16px' }}>
        {steps.map((s,i) => (
          <div key={i} style={{ height:8, borderRadius:4, background: i+1 < step ? '#22c55e' : i+1 === step ? '#1e3a8a' : '#e2e8f0', width: i+1 === step ? 28 : 8, transition:'all 0.3s' }} />
        ))}
        <span style={{ fontSize:12, color:'#94a3b8', marginLeft:8 }}>{steps[step-1]}</span>
      </div>

      <div style={{ padding:'0 12px' }}>
        {/* Step 1 */}
        {step === 1 && (
          <div style={{ background:'#fff', borderRadius:20, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'#1e2845', marginBottom:16 }}>👤 Your Information</div>
            {[['Full Name *','name','text','Your full name'],['Phone *','phone','tel','Your phone number']].map(([label,key,type,ph]) => (
              <div key={key} style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#64748b', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
                <input value={form[key]} onChange={e=>f(key,e.target.value)} type={type} placeholder={ph}
                  style={{ width:'100%', padding:'14px', borderRadius:12, border:'1.5px solid #e2e8f0', fontSize:16, background:'#f8fafc', outline:'none', boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#64748b', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Location *</div>
              <div style={{ display:'flex', gap:8 }}>
                <input value={form.location} onChange={e=>f('location',e.target.value)} placeholder="Street, Area, City"
                  style={{ flex:1, padding:'14px', borderRadius:12, border:'1.5px solid #e2e8f0', fontSize:16, background:'#f8fafc', outline:'none' }} />
                <button onClick={captureGPS} style={{ padding:'14px', borderRadius:12, background:'#eff6ff', border:'none', cursor:'pointer', fontSize:18 }}>📍</button>
              </div>
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#64748b', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Ward / Pincode</div>
              <input value={form.ward} onChange={e=>f('ward',e.target.value)} placeholder="e.g. Ward 42 or 110001"
                style={{ width:'100%', padding:'14px', borderRadius:12, border:'1.5px solid #e2e8f0', fontSize:16, background:'#f8fafc', outline:'none', boxSizing:'border-box' }} />
            </div>
            <button onClick={() => { if(!form.name||!form.phone||!form.location){notify('Fill required fields','error');return;} setStep(2); }}
              style={{ width:'100%', padding:16, background:'linear-gradient(135deg,#1e3a8a,#1e40af)', color:'#fff', border:'none', borderRadius:16, fontSize:16, fontWeight:700, cursor:'pointer', minHeight:54 }}>
              Next →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            {/* Photo */}
            <div style={{ background:'#fff', borderRadius:20, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:12 }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'#1e2845', marginBottom:14 }}>📸 Photo Evidence</div>
              {!form.photo && !photoMode && (
                <div>
                  <div style={{ border:'2px dashed #e2e8f0', borderRadius:16, padding:'24px 16px', textAlign:'center', background:'#f8fafc', marginBottom:12 }}>
                    <div style={{ fontSize:36, marginBottom:8 }}>📷</div>
                    <div style={{ fontSize:13, color:'#64748b', marginBottom:12 }}>Add a photo to help AI identify the issue</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <button onClick={startCamera} style={{ padding:12, borderRadius:12, background:'linear-gradient(135deg,#1e3a8a,#1e40af)', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700 }}>📷 Camera</button>
                      <button onClick={() => fileRef.current?.click()} style={{ padding:12, borderRadius:12, background:'#f1f5f9', border:'none', cursor:'pointer', fontSize:13, fontWeight:700, color:'#1e2845' }}>📁 Upload</button>
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { const file=e.target.files[0]; if(file){f('photo',file);analyzePhoto(file);} }} />
                </div>
              )}
              {photoMode && (
                <div>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width:'100%', borderRadius:12, maxHeight:260, objectFit:'cover', display:'block' }} />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:10 }}>
                    <button onClick={capturePhoto} style={{ padding:14, borderRadius:12, background:'#22c55e', color:'#fff', border:'none', cursor:'pointer', fontWeight:700 }}>📸 Capture</button>
                    <button onClick={stopCamera} style={{ padding:14, borderRadius:12, background:'#f1f5f9', border:'none', cursor:'pointer', fontWeight:700 }}>✕ Cancel</button>
                  </div>
                </div>
              )}
              {form.photo && (
                <div style={{ textAlign:'center' }}>
                  <img src={URL.createObjectURL(form.photo)} alt="evidence" style={{ width:'100%', maxHeight:200, objectFit:'cover', borderRadius:12, marginBottom:8 }} />
                  {analyzing && <div style={{ fontSize:13, color:'#0ea5e9', fontWeight:600 }}>🤖 AI analyzing...</div>}
                  <button onClick={() => f('photo',null)} style={{ fontSize:12, color:'#dc2626', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Remove photo</button>
                </div>
              )}
            </div>

            {/* Title & Description */}
            <div style={{ background:'#fff', borderRadius:20, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:12 }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'#1e2845', marginBottom:14 }}>📋 Issue Details</div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#64748b', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Title *</div>
                <input value={form.title} onChange={e=>f('title',e.target.value)} placeholder="e.g. Deep pothole on MG Road"
                  style={{ width:'100%', padding:'14px', borderRadius:12, border:'1.5px solid #e2e8f0', fontSize:16, background:'#f8fafc', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#64748b', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Description *</div>
                <textarea value={form.description} onChange={e=>f('description',e.target.value)} placeholder="Describe the issue in detail..."
                  style={{ width:'100%', padding:'14px', borderRadius:12, border:'1.5px solid #e2e8f0', fontSize:16, background:'#f8fafc', outline:'none', minHeight:100, resize:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }} />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <button onClick={() => setStep(1)} style={{ padding:16, borderRadius:16, background:'#f1f5f9', border:'none', cursor:'pointer', fontWeight:700, fontSize:15 }}>← Back</button>
              <button onClick={() => { if(!form.title||!form.description){notify('Fill title and description','error');return;} setStep(3); }}
                style={{ padding:16, borderRadius:16, background:'linear-gradient(135deg,#1e3a8a,#1e40af)', color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:15 }}>
                Review →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <div style={{ background:'#fff', borderRadius:20, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:12 }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'#1e2845', marginBottom:16 }}>✅ Review & Submit</div>
              {[['👤 Name', form.name], ['📞 Phone', form.phone], ['📍 Location', form.location], ['📋 Title', form.title]].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f1f5f9', fontSize:14 }}>
                  <span style={{ color:'#64748b', fontWeight:600 }}>{l}</span>
                  <span style={{ color:'#1e2845', fontWeight:700, maxWidth:'60%', textAlign:'right' }}>{v || '—'}</span>
                </div>
              ))}
              {form.photo && (
                <div style={{ marginTop:12 }}>
                  <img src={URL.createObjectURL(form.photo)} alt="evidence" style={{ width:'100%', height:120, objectFit:'cover', borderRadius:12 }} />
                </div>
              )}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <button onClick={() => setStep(2)} style={{ padding:16, borderRadius:16, background:'#f1f5f9', border:'none', cursor:'pointer', fontWeight:700, fontSize:15 }}>← Back</button>
              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding:16, borderRadius:16, background:'linear-gradient(135deg,#16a34a,#15803d)', color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:15, opacity:submitting?0.7:1 }}>
                {submitting ? '⏳ Submitting...' : '🚀 Submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Success Screen ────────────────────────────────────────────
function SuccessScreen({ ticket, onHome, onTrack }) {
  const ticketId = ticket?.ticket_id || ticket?.ticketId;
  const dept = ticket?.departments;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', minHeight:'70vh', textAlign:'center' }}>
      <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#22c55e,#16a34a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, marginBottom:20, boxShadow:'0 8px 24px rgba(34,197,94,0.35)', animation:'successPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275)' }}>✅</div>
      <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:'#1e2845', marginBottom:8 }}>Complaint Filed!</div>
      <div style={{ fontSize:14, color:'#64748b', marginBottom:24 }}>Your complaint has been registered and routed to the {dept?.name || 'concerned'} department.</div>
      <div style={{ background:'linear-gradient(135deg,#eff6ff,#dbeafe)', border:'2px solid #3b82f6', borderRadius:20, padding:'20px 32px', marginBottom:24, width:'100%' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'1px', marginBottom:6 }}>Your Ticket ID</div>
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:30, fontWeight:800, color:'#1e3a8a', letterSpacing:3 }}>{ticketId}</div>
        <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>Save this for tracking</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, width:'100%' }}>
        <button onClick={onTrack} style={{ padding:16, borderRadius:16, background:'linear-gradient(135deg,#1e3a8a,#1e40af)', color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:14 }}>🔍 Track Status</button>
        <button onClick={onHome} style={{ padding:16, borderRadius:16, background:'#f1f5f9', border:'none', cursor:'pointer', fontWeight:700, fontSize:14, color:'#1e2845' }}>🏠 Home</button>
      </div>
    </div>
  );
}

// ── Track Screen ──────────────────────────────────────────────
function TrackScreen({ onBack, complaints, supabaseService, user, notify, initialTicketId }) {
  const [trackId, setTrackId] = useState(initialTicketId || '');
  const [tracked, setTracked] = useState(null);
  const [loading, setLoading] = useState(false);

  const doTrack = async () => {
    if (!trackId) { notify('Enter a ticket ID', 'error'); return; }
    setLoading(true);
    try {
      const local = complaints.find(x => x.ticket_id === trackId.toUpperCase() || x.ticketId === trackId.toUpperCase() || x.ticket_id === trackId || x.ticketId === trackId);
      if (local) { setTracked(local); setLoading(false); return; }
      const all = await supabaseService.getComplaints({ userId: user.id });
      const found = all.find(x => x.ticket_id === trackId.toUpperCase() || x.ticket_id === trackId);
      if (!found) { notify('Ticket not found', 'error'); } else { setTracked(found); }
    } catch(e) { notify('Error tracking complaint', 'error'); }
    setLoading(false);
  };

  const dept = tracked ? (tracked.departments || DEPARTMENTS.find(d => d.id === (tracked.department_id || tracked.dept))) : null;
  const st = tracked ? statusLabel(tracked.status) : '';

  return (
    <div style={{ paddingBottom:80 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px 16px' }}>
        <button onClick={onBack} style={{ background:'#f1f5f9', border:'none', borderRadius:12, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:18 }}>←</button>
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:17, fontWeight:700, color:'#1e2845' }}>Track Complaint</div>
      </div>
      <div style={{ padding:'0 12px', marginBottom:16 }}>
        <div style={{ display:'flex', gap:8 }}>
          <input value={trackId} onChange={e=>setTrackId(e.target.value)} placeholder="Enter Ticket ID (e.g. NV-123456)"
            style={{ flex:1, padding:'14px 16px', borderRadius:14, border:'1.5px solid #e2e8f0', fontSize:16, background:'#fff', outline:'none' }}
            onKeyDown={e => e.key==='Enter' && doTrack()} />
          <button onClick={doTrack} disabled={loading}
            style={{ padding:'14px 18px', borderRadius:14, background:'#1e3a8a', color:'#fff', border:'none', fontWeight:700, fontSize:14, cursor:'pointer', whiteSpace:'nowrap' }}>
            {loading ? '⏳' : '🔍 Track'}
          </button>
        </div>
      </div>

      {tracked && (
        <div style={{ padding:'0 12px' }}>
          <div style={{ background:'#fff', borderRadius:20, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:800, color:'#1e2845', marginBottom:4 }}>{tracked.title}</div>
                <div style={{ fontSize:12, fontWeight:700, color:'#0ea5e9', background:'#e0f2fe', padding:'3px 10px', borderRadius:6, display:'inline-block' }}>{tracked.ticket_id || tracked.ticketId}</div>
              </div>
              <span style={{ fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:999, background:statusBg(tracked.status), color:statusColor(tracked.status) }}>{st}</span>
            </div>
            {[['🏛️ Department', dept?.name || 'N/A'], ['📍 Location', tracked.location], ['⚡ Priority', tracked.priority]].map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f1f5f9', fontSize:13 }}>
                <span style={{ color:'#64748b' }}>{l}</span>
                <span style={{ color:'#1e2845', fontWeight:700 }}>{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent complaints list */}
      {!tracked && complaints.length > 0 && (
        <div style={{ padding:'0 12px' }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:'#64748b', marginBottom:10 }}>Your Recent Complaints</div>
          {complaints.slice(0,5).map(c => {
            const ticketId = c.ticket_id || c.ticketId;
            const d = c.departments || DEPARTMENTS.find(x => x.id === (c.department_id || c.dept));
            return (
              <div key={c.id} onClick={() => { setTrackId(ticketId||''); setTracked(c); }}
                style={{ background:'#fff', borderRadius:14, padding:'12px 14px', marginBottom:8, display:'flex', alignItems:'center', gap:10, cursor:'pointer', boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize:20 }}>{d?.icon || '📋'}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#1e2845', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.title}</div>
                  <div style={{ fontSize:11, color:'#94a3b8' }}>{ticketId}</div>
                </div>
                <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:999, background:statusBg(c.status), color:statusColor(c.status) }}>{statusLabel(c.status)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Mobile App Shell ─────────────────────────────────────
export default function MobileCitizenApp() {
  const { user, complaints, signOut, supabaseService, submitComplaint, notify, departments } = useApp();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [screen, setScreen] = useState('home');
  const [ticket, setTicket] = useState(null);
  const [initialTicketId, setInitialTicketId] = useState('');

  const goTo = (s, data) => {
    if (s === 'leaderboard') { navigate('/leaderboard'); return; }
    if (data) setInitialTicketId(data);
    setScreen(s);
    window.scrollTo(0, 0);
  };

  const handleSuccess = (c) => {
    setTicket(c);
    setScreen('success');
  };

  const tabs = [
    { id:'home',  icon:'🏠', label:t('bottomNav.home') },
    { id:'file',  icon:'📝', label:t('bottomNav.file') },
    { id:'track', icon:'🔍', label:t('bottomNav.track') },
    { id:'leaderboard', icon:'🏆', label:t('bottomNav.ranks') },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4fa', fontFamily:'DM Sans,sans-serif' }}>
      {/* App Header */}
      <div style={{ position:'fixed', top:0, left:0, right:0, height:56, background:'#0D1B40', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', paddingTop:'env(safe-area-inset-top)', zIndex:200, boxShadow:'0 2px 12px rgba(0,0,0,0.3)' }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'#fff' }}>
          Nagar<span style={{ color:'#00C2E0' }}>Vani</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>{user?.name?.split(' ')[0]}</div>
          <button onClick={async () => { await signOut(); navigate('/'); }}
            style={{ background:'rgba(220,38,38,0.2)', border:'1px solid rgba(220,38,38,0.4)', borderRadius:8, padding:'5px 10px', fontSize:11, fontWeight:700, color:'#fca5a5', cursor:'pointer' }}>
            {t('nav.signOut')}
          </button>
        </div>
      </div>

      {/* Page content */}
      <div style={{ paddingTop:56 }}>
        {screen === 'home' && <HomeScreen user={user} complaints={complaints} onNavigate={goTo} signOut={signOut} t={t} />}
        {screen === 'file' && <FileScreen user={user} onBack={() => setScreen('home')} onSuccess={handleSuccess} notify={notify} submitComplaint={submitComplaint} departments={departments} />}
        {screen === 'snap' && <FileScreen user={user} onBack={() => setScreen('home')} onSuccess={handleSuccess} notify={notify} submitComplaint={submitComplaint} departments={departments} />}
        {screen === 'track' && <TrackScreen onBack={() => setScreen('home')} complaints={complaints} supabaseService={supabaseService} user={user} notify={notify} initialTicketId={initialTicketId} />}
        {screen === 'success' && <SuccessScreen ticket={ticket} onHome={() => setScreen('home')} onTrack={() => { setInitialTicketId(ticket?.ticket_id||ticket?.ticketId||''); setScreen('track'); }} />}
        {screen === 'voice' && (
          <div style={{ paddingBottom: 80 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px 16px' }}>
              <button onClick={() => setScreen('home')} style={{ background:'#f1f5f9', border:'none', borderRadius:12, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:18 }}>←</button>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:17, fontWeight:700, color:'#1e2845' }}>Voice Complaint</div>
            </div>
            <div style={{ padding:'0 12px' }}>
              <div style={{ background:'#fff', borderRadius:20, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:12 }}>
                <div style={{ fontSize:14, color:'#64748b', marginBottom:16, lineHeight:1.6 }}>
                  📞 Call our AI assistant and report your civic issue by voice. Available in English and Hindi.
                </div>
                <VoiceAssistant onComplaintCreated={(c) => { notify(`Voice complaint registered! Ticket: ${c.ticket_id}`, 'success'); setScreen('home'); }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, height:'calc(60px + env(safe-area-inset-bottom))', background:'#fff', borderTop:'1px solid #e2e8f0', display:'flex', alignItems:'flex-start', justifyContent:'space-around', paddingTop:8, paddingBottom:'env(safe-area-inset-bottom)', zIndex:200, boxShadow:'0 -4px 20px rgba(0,0,0,0.08)' }}>
        {tabs.map(t => {
          const active = screen === t.id;
          return (
            <button key={t.id} onClick={() => goTo(t.id)}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flex:1, background:'none', border:'none', cursor:'pointer', color: active ? '#1e3a8a' : '#94a3b8', padding:0, WebkitTapHighlightColor:'transparent' }}>
              <span style={{ fontSize:22, lineHeight:1, transform: active ? 'scale(1.15)' : 'scale(1)', transition:'transform 0.15s' }}>{t.icon}</span>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.3px' }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes successPop {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
