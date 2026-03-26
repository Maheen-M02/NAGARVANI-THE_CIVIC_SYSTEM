import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { TopNav, StatusBadge, PrioBadge, timeAgo } from '../components/UI';
import LiveMap from '../components/LiveMap';
import OfficerSetup from '../components/OfficerSetup';
import AuditTrail from '../components/AuditTrail';
import { DEPARTMENTS, STATUS_COLORS, AI_SUGGESTIONS } from '../data/constants';
import '../styles/officer-portal.css';

function ComplaintDetail({ sel, newStatus, setNewStatus, note, setNote, doUpdate, getSLA }) {
  const dept = DEPARTMENTS.find(x => x.id === sel.dept);
  const sla = getSLA(sel);
  const suggestions = AI_SUGGESTIONS[sel.category] || ['Investigate on-site', 'Coordinate with relevant teams', 'Update citizen within 2 hours'];

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ background: 'linear-gradient(135deg,#0D1B40,#1A3A8F)', borderRadius: 14, padding: '22px 26px', marginBottom: 18, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: '#00C2E0', fontWeight: 700, letterSpacing: '1px', marginBottom: 5 }}>{dept?.icon} {dept?.name} • {sel.ticketId}</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 7 }}>{sel.title}</h2>
            <div style={{ fontSize: 13, color: '#8899BB', lineHeight: 1.5 }}>{sel.description}</div>
          </div>
          <StatusBadge s={sel.status} />
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 18 }}>
        {[
          ['Priority', <PrioBadge p={sel.priority} />],
          ['SLA', <span style={{ fontWeight: 800, color: sla.c, fontSize: 14 }}>{sla.l}</span>],
          ['AI', <span style={{ fontWeight: 800, color: '#0A7EA4', fontSize: 14 }}>{sel.confidence}%</span>],
          ['Filed', <span style={{ fontWeight: 700, fontSize: 13 }}>{timeAgo(sel.createdAt)}</span>],
        ].map(([l, v]) => (
          <div key={l} className="card" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ marginBottom: 5 }}>{v}</div>
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700 }}>{l}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 18 }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>👤 Citizen</div>
          {[['Name', sel.citizenName], ['Phone', sel.phone], ['Location', sel.location], ['Ward', sel.ward]].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 12 }}>
              <span style={{ color: '#64748B' }}>{l}</span>
              <span style={{ fontWeight: 700, color: '#1E2845' }}>{v}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: '16px', borderTop: '3px solid #0A7EA4' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0A7EA4', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>🤖 AI Suggestions</div>
          {suggestions.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 9 }}>
              <div style={{ width: 18, height: 18, background: '#0A7EA415', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#0A7EA4', fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ fontSize: 12, color: '#1E2845', lineHeight: 1.4 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Photos */}
      {(() => {
        const photos = sel.photo_urls || sel.photoUrls || (sel.imageUrl ? [sel.imageUrl] : []);
        if (!photos || photos.length === 0) return null;
        return (
          <div className="card" style={{ padding: '22px', marginBottom: 18 }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#1E2845', marginBottom: 14 }}>
              📷 Evidence Photos ({photos.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: photos.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                  <img
                    src={url}
                    alt={`Evidence ${i + 1}`}
                    style={{ width: '100%', height: photos.length === 1 ? 320 : 180, objectFit: 'cover', borderRadius: 10, border: '2px solid #E2E8F0', cursor: 'pointer', transition: 'transform .2s', background: '#F8FAFC' }}
                    onMouseOver={e => e.target.style.transform = 'scale(1.02)'}
                    onMouseOut={e => e.target.style.transform = 'scale(1)'}
                    onError={e => e.target.parentElement.style.display = 'none'}
                  />
                </a>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 8 }}>Click image to view full size</div>
          </div>
        );
      })()}

      <div className="card" style={{ padding: '22px', marginBottom: 18, border: '2px solid #8B5CF630' }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#1E2845', marginBottom: 14 }}>✏️ Update Status</h3>
        <div style={{ display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap' }}>
          {['In Progress', 'Resolved', 'Escalated'].map(s => {
            const c = STATUS_COLORS[s];
            return (
              <button key={s} onClick={() => setNewStatus(s)} style={{ padding: '7px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `2px solid ${newStatus === s ? c : '#E2E8F0'}`, background: newStatus === s ? c + '18' : '#fff', color: newStatus === s ? c : '#64748B', transition: 'all .2s' }}>
                {s === 'In Progress' ? '🔄' : s === 'Resolved' ? '✅' : '⚠️'} {s}
              </button>
            );
          })}
        </div>
        <textarea className="textarea" placeholder="Add a note about action taken..." value={note} onChange={e => setNote(e.target.value)} style={{ minHeight: 70, marginBottom: 12 }} />
        <button className="btn btn-primary btn-lg" onClick={doUpdate} disabled={!newStatus} style={{ opacity: newStatus ? 1 : .5 }}>Update Status →</button>
      </div>

      <div className="card" style={{ padding: '22px' }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#1E2845', marginBottom: 16 }}>📋 Activity Log</h3>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 13, top: 0, bottom: 0, width: 2, background: '#E2E8F0' }} />
          {(sel.updates && Array.isArray(sel.updates) ? [...sel.updates].reverse() : []).map((u, i) => (
            <div key={i} style={{ display: 'flex', gap: 13, marginBottom: 14, animation: `slideIn .3s ease ${i * .04}s both` }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: u.by?.includes('AI') || u.by === 'System' ? '#0A7EA4' : '#8B5CF6', flexShrink: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff' }}>
                {u.by?.includes('AI') || u.by === 'System' ? '🤖' : '👮'}
              </div>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div style={{ fontSize: 12, color: '#1E2845', lineHeight: 1.5 }}>{u.msg}</div>
                <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3 }}>{u.by} • {timeAgo(u.time)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blockchain Audit Trail */}
      <div style={{ marginTop: 18 }}>
        <AuditTrail complaintId={sel.id} ticketId={sel.ticketId || sel.ticket_id} />
      </div>
    </div>
  );
}

export default function OfficerDashboard() {
  const { complaints, updateComplaint, notify, user, supabaseService } = useApp();
  const [sel, setSel] = useState(null);
  const [filt, setFilt] = useState('all');
  const [note, setNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [activeView, setActiveView] = useState('queue'); // 'queue' | 'map'
  const [officerProfile, setOfficerProfile] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deptComplaints, setDeptComplaints] = useState([]);

  const loadDepartmentComplaints = useCallback(async () => {
    if (!officerProfile?.department_id) return;
    
    try {
      console.log('Loading complaints for department:', officerProfile.department_id);
      const allComplaints = await supabaseService.getComplaints({ 
        departmentId: officerProfile.department_id 
      });
      console.log('Loaded complaints:', allComplaints);
      setDeptComplaints(allComplaints);
    } catch (error) {
      console.error('Error loading department complaints:', error);
      // Fallback to complaints from context
      setDeptComplaints(complaints.filter(c => 
        c.department_id === officerProfile?.department_id || 
        c.dept === officerProfile?.department_id
      ));
    }
  }, [officerProfile, supabaseService, complaints]);

  const checkOfficerProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      const profile = await supabaseService.getOfficerProfile(user.id);
      
      if (!profile) {
        setNeedsSetup(true);
      } else {
        setOfficerProfile(profile);
        setNeedsSetup(false);
      }
    } catch (error) {
      console.error('Error checking officer profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabaseService]);

  // Check if officer profile exists
  useEffect(() => {
    checkOfficerProfile();
  }, [checkOfficerProfile]);

  // Load department complaints when officer profile is loaded
  useEffect(() => {
    if (officerProfile?.department_id) {
      loadDepartmentComplaints();
      
      // Set up polling to refresh complaints every 10 seconds
      const pollInterval = setInterval(() => {
        console.log('Polling for department complaint updates...');
        loadDepartmentComplaints();
      }, 10000);
      
      return () => clearInterval(pollInterval);
    }
  }, [officerProfile, loadDepartmentComplaints]);

  const handleSetupComplete = (profile) => {
    setOfficerProfile(profile);
    setNeedsSetup(false);
  };

  // Show setup modal if needed
  if (loading) {
    return (
      <div className="officer-portal" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white' }}>
            Loading Officer Dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return <OfficerSetup onComplete={handleSetupComplete} />;
  }

  // Use department complaints instead of user complaints
  // Combine and deduplicate complaints from database and local state
  const allComplaints = [...deptComplaints, ...complaints.filter(c => 
    c.department_id === officerProfile?.department_id || 
    c.dept === officerProfile?.department_id
  )];
  
  // Deduplicate by ID
  const uniqueComplaints = allComplaints.reduce((acc, complaint) => {
    const existingIndex = acc.findIndex(c => c.id === complaint.id);
    if (existingIndex === -1) {
      acc.push(complaint);
    } else {
      // Keep the one with more data (from database usually has more fields)
      if (Object.keys(complaint).length > Object.keys(acc[existingIndex]).length) {
        acc[existingIndex] = complaint;
      }
    }
    return acc;
  }, []);
  
  // Normalize complaints to expected format
  const normalizedComplaints = uniqueComplaints.map(c => {
    // Map database status to UI status
    const statusMap = {
      'pending': 'Open',
      'acknowledged': 'Open',
      'in_progress': 'In Progress',
      'resolved': 'Resolved',
      'closed': 'Resolved',
      'rejected': 'Rejected'
    };
    
    const uiStatus = statusMap[c.status] || c.status;
    
    return {
      ...c,
      // Ensure both formats exist
      ticketId: c.ticket_id || c.ticketId,
      ticket_id: c.ticket_id || c.ticketId,
      dept: c.department_id || c.dept,
      department_id: c.department_id || c.dept,
      citizenName: c.users?.name || c.citizenName || 'Unknown',
      phone: c.users?.phone || c.phone || 'N/A',
      createdAt: c.created_at ? new Date(c.created_at).getTime() : (c.createdAt || Date.now()),
      created_at: c.created_at || new Date(c.createdAt).toISOString(),
      slaHours: c.sla_hours || c.slaHours || 72,
      sla_hours: c.sla_hours || c.slaHours || 72,
      confidence: c.ai_analysis?.confidence || c.confidence || 85,
      updates: c.updates || [],
      officer: c.assigned_officer_id || c.officer,
      // GPS coordinates for map
      lat: c.gps_latitude || c.lat,
      lng: c.gps_longitude || c.lng,
      gps_latitude: c.gps_latitude || c.lat,
      gps_longitude: c.gps_longitude || c.lng,
      // Map status to UI-friendly format
      status: uiStatus
    };
  });
  
  // Filter by status with proper mapping
  const filtered = filt === 'all' ? normalizedComplaints : normalizedComplaints.filter(c => {
    if (filt === 'Escalated') {
      // Escalated complaints are high/critical priority in_progress
      return c.status === 'In Progress' && (c.priority === 'High' || c.priority === 'Critical' || c.priority === 'high' || c.priority === 'critical');
    }
    return c.status === filt;
  });
  const priSort = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  const sorted = [...filtered].sort((a, b) => priSort[b.priority] - priSort[a.priority]);

  const getSLA = c => {
    const e = (Date.now() - c.createdAt) / 3600000;
    const p = e / c.slaHours;
    if (p > 1) return { l: 'BREACHED', c: '#EF4444', p: 100 };
    if (p > .75) return { l: 'AT RISK', c: '#F97316', p: p * 100 };
    return { l: 'ON TRACK', c: '#22C55E', p: p * 100 };
  };

  const doUpdate = async () => {
    if (!newStatus || !sel) return;
    
    try {
      console.log('Updating complaint:', sel.id, 'to status:', newStatus);
      
      // Call updateComplaint from context
      await updateComplaint(sel.id, newStatus, note, user?.name || 'Officer');
      
      // Update local selected complaint state
      setSel(s => s ? { 
        ...s, 
        status: newStatus.toLowerCase().replace(/\s+/g, '_'), 
        updates: [...(s.updates || []), { 
          time: Date.now(), 
          msg: note || `Status → ${newStatus}`, 
          by: user?.name || 'Officer' 
        }] 
      } : null);
      
      // Reload department complaints to reflect changes
      await loadDepartmentComplaints();
      
      notify(`${sel.ticketId || sel.ticket_id} updated to "${newStatus}"`, 'success');
      setNote(''); 
      setNewStatus('');
    } catch (error) {
      console.error('Update error:', error);
      notify('Failed to update complaint: ' + error.message, 'error');
    }
  };

  const stats = {
    open: normalizedComplaints.filter(c => c.status === 'Open').length,
    prog: normalizedComplaints.filter(c => c.status === 'In Progress' && !(c.priority === 'High' || c.priority === 'Critical' || c.priority === 'high' || c.priority === 'critical')).length,
    res: normalizedComplaints.filter(c => c.status === 'Resolved').length,
    esc: normalizedComplaints.filter(c => c.status === 'In Progress' && (c.priority === 'High' || c.priority === 'Critical' || c.priority === 'high' || c.priority === 'critical')).length,
  };

  const dept = DEPARTMENTS.find(d => d.id === officerProfile?.department_id) || officerProfile?.departments;

  return (
    <div className="officer-portal" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%)' }}>
      <TopNav title="Officer Dashboard" sub={`${user?.name || 'Officer'} — ${dept?.name || 'Department'}`} role="officer" />

      {/* View toggle bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => setActiveView('queue')} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, background: activeView === 'queue' ? '#0D1B40' : 'transparent', color: activeView === 'queue' ? '#fff' : '#64748B', transition: 'all .2s' }}>
          📋 Task Queue
        </button>
        <button onClick={() => setActiveView('map')} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, background: activeView === 'map' ? dept?.color || '#8B5CF6' : 'transparent', color: activeView === 'map' ? '#fff' : '#64748B', transition: 'all .2s' }}>
          🗺️ Live Map — {dept?.icon} {dept?.name}
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {[['Open', stats.open, '#F97316'], ['Active', stats.prog, '#0EA5E9'], ['Done', stats.res, '#22C55E'], ['⚠️', stats.esc, '#EF4444']].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: 'center', padding: '4px 12px', background: c + '12', borderRadius: 8, minWidth: 50 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: c }}>{v}</div>
              <div style={{ fontSize: 9, color: '#64748B', fontWeight: 700 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Map view */}
      {activeView === 'map' && (
        <div style={{ padding: '20px 24px', animation: 'fadeUp .3s ease' }}>
          <LiveMap complaints={normalizedComplaints} filterDept={officerProfile?.department_id} height={580} showLegend={true} />
        </div>
      )}

      {/* Queue view */}
      {activeView === 'queue' && (
        <div style={{ display: 'flex', height: 'calc(100vh - 112px)' }}>
          {/* Left panel */}
          <div style={{ width: 400, borderRight: '1px solid #E2E8F0', background: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {['all', 'Open', 'In Progress', 'Escalated', 'Resolved'].map(s => {
                const c = STATUS_COLORS[s] || '#0A7EA4';
                return (
                  <button key={s} onClick={() => setFilt(s)} style={{ padding: '4px 11px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${filt === s ? c : '#E2E8F0'}`, background: filt === s ? c + '15' : '#fff', color: filt === s ? c : '#64748B', transition: 'all .2s' }}>
                    {s === 'all' ? 'All' : s}
                  </button>
                );
              })}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
              {sorted.map((c, i) => {
                const d = DEPARTMENTS.find(x => x.id === c.dept);
                const sla = getSLA(c);
                const isSel = sel?.id === c.id;
                return (
                  <div key={c.id} onClick={() => setSel(c)} style={{ padding: '12px 14px', borderRadius: 10, marginBottom: 7, cursor: 'pointer', borderTop: `1.5px solid ${isSel ? '#8B5CF6' : '#E2E8F0'}`, borderRight: `1.5px solid ${isSel ? '#8B5CF6' : '#E2E8F0'}`, borderBottom: `1.5px solid ${isSel ? '#8B5CF6' : '#E2E8F0'}`, borderLeft: `4px solid ${d?.color || '#E2E8F0'}`, background: isSel ? '#8B5CF608' : '#fff', transition: 'all .2s', animation: `fadeUp .3s ease ${i * .04}s both` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#1E2845', flex: 1, marginRight: 8, lineHeight: 1.4 }}>{c.title}</div>
                      <StatusBadge s={c.status} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}><PrioBadge p={c.priority} /><span style={{ fontSize: 10, color: '#94A3B8' }}>#{c.ticketId}</span></div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: sla.c, background: sla.c + '15', padding: '2px 7px', borderRadius: 999 }}>{sla.l}</span>
                    </div>
                    <div style={{ marginTop: 6, height: 3, background: '#E2E8F0', borderRadius: 999 }}>
                      <div style={{ height: '100%', width: sla.p + '%', background: sla.c, borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '22px 26px' }}>
            {!sel ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748B', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 40 }}>👈</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#1E2845' }}>Select a complaint</div>
                <div style={{ fontSize: 13 }}>Click any complaint to view details and update status</div>
              </div>
            ) : (
              <ComplaintDetail sel={sel} newStatus={newStatus} setNewStatus={setNewStatus} note={note} setNote={setNote} doUpdate={doUpdate} getSLA={getSLA} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
