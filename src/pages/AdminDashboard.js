import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { TopNav, StatCard, StatusBadge, PrioBadge, timeAgo } from '../components/UI';
import { BarChartSVG, LineChartSVG, DonutChart } from '../components/Charts';
import LiveMap from '../components/LiveMap';
import { DEPARTMENTS, OFFICERS, PRIORITY_COLORS, WEEKLY_TREND, DEPT_LOAD, STATUS_DIST } from '../data/constants';
import '../styles/admin-portal.css';

import AuditTrail from '../components/AuditTrail';
export default function AdminDashboard() {
  const { complaints: contextComplaints, supabaseService, updateComplaint, notify, user } = useApp();
  const [tab, setTab] = useState('overview');
  const [alert, setAlert] = useState(true);
  const [allComplaints, setAllComplaints] = useState([]);
  const [allOfficers, setAllOfficers] = useState([]);
  const [allVolunteers, setAllVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  // Load all data from database
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load all complaints
      const complaintsData = await supabaseService.getComplaints({});
      setAllComplaints(complaintsData);
      
      // Load all officers - with fallback
      if (typeof supabaseService.getAllOfficers === 'function') {
        const officersData = await supabaseService.getAllOfficers();
        setAllOfficers(officersData);
      } else {
        console.warn('getAllOfficers method not available');
        setAllOfficers([]);
      }
      
      // Load all volunteers - with fallback
      if (typeof supabaseService.getAllVolunteers === 'function') {
        const volunteersData = await supabaseService.getAllVolunteers();
        setAllVolunteers(volunteersData);
      } else {
        console.warn('getAllVolunteers method not available');
        setAllVolunteers([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setLoading(false);
    }
  }, [supabaseService]);

  useEffect(() => {
    loadAllData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadAllData, 30000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  // Use database complaints if available, otherwise use context
  const complaints = allComplaints.length > 0 ? allComplaints : contextComplaints;

  // Normalize complaints for map display
  const normalizedComplaints = complaints.map(c => ({
    ...c,
    // Ensure all required fields exist
    id: c.id,
    ticketId: c.ticket_id || c.ticketId,
    ticket_id: c.ticket_id || c.ticketId,
    title: c.title,
    description: c.description,
    dept: c.department_id || c.dept,
    department_id: c.department_id || c.dept,
    priority: c.priority,
    status: c.status,
    citizenName: c.users?.name || c.citizenName || 'Unknown',
    phone: c.users?.phone || c.phone || 'N/A',
    location: c.location,
    // GPS coordinates for map
    lat: c.gps_latitude || c.lat,
    lng: c.gps_longitude || c.lng,
    gps_latitude: c.gps_latitude || c.lat,
    gps_longitude: c.gps_longitude || c.lng,
    // Image URLs (array)
    photo_urls: c.photo_urls || c.photoUrls || (c.imageUrl ? [c.imageUrl] : []),
    photoUrls: c.photo_urls || c.photoUrls || (c.imageUrl ? [c.imageUrl] : []),
    // Timestamps
    createdAt: c.created_at ? new Date(c.created_at).getTime() : (c.createdAt || Date.now()),
    created_at: c.created_at || new Date(c.createdAt).toISOString(),
    // SLA
    slaHours: c.sla_hours || c.slaHours || 72,
    sla_hours: c.sla_hours || c.slaHours || 72,
    // AI confidence
    confidence: c.ai_analysis?.confidence || c.confidence || 85,
    // Updates
    updates: c.updates || []
  }));

  const total = normalizedComplaints.length;
  const res = normalizedComplaints.filter(c => c.status === 'Resolved').length;
  const open = normalizedComplaints.filter(c => c.status === 'Open').length;
  const esc = normalizedComplaints.filter(c => c.status === 'Escalated').length;
  const crit = normalizedComplaints.filter(c => c.priority === 'Critical' && c.status !== 'Resolved').length;

  const tabs = ['overview', 'analytics', 'map', 'complaints', 'officers', 'volunteers'];
  const tabIcons = { overview: '📊', analytics: '📈', map: '🗺️', complaints: '🎫', officers: '👮', volunteers: '🤝' };

  return (
    <div className="admin-portal" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%)' }}>
      <TopNav title="Command Center" sub="National Grievance Analytics" role="admin" />

      {alert && crit > 0 && (
        <div style={{ background: '#EF4444', color: '#fff', padding: '10px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
          <span>🚨 {crit} CRITICAL complaints — SLA breach risk detected</span>
          <button onClick={() => setAlert(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
      )}

      <div style={{ padding: window.innerWidth <= 768 ? '12px' : '22px 28px', paddingBottom: window.innerWidth <= 768 ? '80px' : undefined }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', padding: 4, borderRadius: 10, width: window.innerWidth <= 768 ? '100%' : 'fit-content', border: '1px solid #E2E8F0', overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, background: tab === t ? '#0D1B40' : 'transparent', color: tab === t ? '#fff' : '#64748B', transition: 'all .2s', textTransform: 'capitalize', flexShrink: 0 }}>
              {tabIcons[t]} {t}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <div className="grid-4" style={{ marginBottom: 24 }}>
              <StatCard label="Total" value={total} icon="🎫" color="#0D1B40" sub="All time" trend={12} />
              <StatCard label="Open" value={open} icon="📂" color="#F97316" sub="Awaiting action" trend={-5} />
              <StatCard label="Resolved" value={res} icon="✅" color="#22C55E" sub={Math.round(res / total * 100) + '% rate'} trend={8} />
              <StatCard label="Escalated" value={esc} icon="⚠️" color="#EF4444" sub="Needs attention" trend={2} />
            </div>
            <div className="grid-2" style={{ marginBottom: 24 }}>
              <div className="card" style={{ padding: '22px' }}>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#1E2845', marginBottom: 18 }}>📅 Weekly Trend</h3>
                <LineChartSVG data={WEEKLY_TREND} keys={['open', 'resolved', 'escalated']} colors={['#F97316', '#22C55E', '#EF4444']} height={220} />
              </div>
              <div className="card" style={{ padding: '22px' }}>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#1E2845', marginBottom: 18 }}>🏛️ Status Breakdown</h3>
                <DonutChart data={STATUS_DIST} size={190} />
              </div>
            </div>
            <div className="card" style={{ padding: '22px', background: 'linear-gradient(135deg,#0D1B40,#1A3A8F)', marginBottom: 22 }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 16 }}>🤖 AI Engine Live Stats</h3>
              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 768 ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 16 }}>
                {[['98.2%', 'Auto-Triaged'], ['1.8 sec', 'Avg Triage Time'], ['94.6%', 'Routing Accuracy'], ['23', 'Duplicates Merged'], ['14', 'Languages Today'], ['18', 'SLA Breaches Prevented']].map(([v, l]) => (
                  <div key={l} style={{ padding: '14px', background: '#ffffff0c', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: '#00C2E0' }}>{v}</div>
                    <div style={{ fontSize: 11, color: '#8899BB', marginTop: 3 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Mini live map */}
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#1E2845', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                🗺️ Live Complaint Map
                <button onClick={() => setTab('map')} style={{ fontSize: 11, fontWeight: 700, color: '#0A7EA4', background: '#0A7EA415', border: 'none', padding: '4px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  View Full Map →
                </button>
              </div>
              <LiveMap complaints={normalizedComplaints} height={380} showLegend={false} />
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {tab === 'analytics' && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <div className="card" style={{ padding: '22px', marginBottom: 22 }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17, color: '#1E2845', marginBottom: 18 }}>🏛️ Department Load — Filed vs Resolved</h3>
              <BarChartSVG data={DEPT_LOAD} keys={['complaints', 'resolved']} colors={['#0A7EA4', '#22C55E']} height={300} />
            </div>
            <div className="grid-2">
              <div className="card" style={{ padding: '22px' }}>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#1E2845', marginBottom: 14 }}>⚡ Priority Split</h3>
                {Object.entries(PRIORITY_COLORS).map(([p, c]) => {
                  const cnt = normalizedComplaints.filter(x => x.priority === p).length;
                  const pct = normalizedComplaints.length > 0 ? Math.round(cnt / normalizedComplaints.length * 100) : 0;
                  return (
                    <div key={p} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: c }}>{p === 'Critical' ? '🔴' : p === 'High' ? '🟠' : p === 'Medium' ? '🟡' : '🟢'} {p}</span>
                        <span style={{ color: '#64748B' }}>{cnt} ({pct}%)</span>
                      </div>
                      <div style={{ height: 7, background: '#E2E8F0', borderRadius: 999 }}>
                        <div style={{ height: '100%', width: pct + '%', background: c, borderRadius: 999 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="card" style={{ padding: '22px' }}>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#1E2845', marginBottom: 14 }}>🔮 AI Predictions — Next 7 Days</h3>
                {[
                  ['warning', '⚠️ Water Surge Predicted', '40% increase in water complaints — Wards 8,13,18. Pre-deploy tankers.'],
                  ['info', '📊 Road Damage Alert', '2x pothole reports expected with monsoon. Pre-position repair crews.'],
                  ['success', '✅ Sanitation Improving', '16% drop in garbage complaints predicted due to new schedule.'],
                ].map(([t, title, desc]) => {
                  const bg = { warning: '#F5A62310', info: '#0A7EA410', success: '#22C55E10' }[t];
                  const bc = { warning: '#F5A62330', info: '#0A7EA430', success: '#22C55E30' }[t];
                  const tc = { warning: '#F5A623', info: '#0A7EA4', success: '#22C55E' }[t];
                  return (
                    <div key={title} style={{ padding: '13px', background: bg, border: `1px solid ${bc}`, borderRadius: 9, marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, color: tc, fontSize: 12, marginBottom: 4 }}>{title}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MAP TAB */}
        {tab === 'map' && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <div style={{ marginBottom: 22 }}>
              <LiveMap complaints={normalizedComplaints} height={540} showLegend={true} />
            </div>
            <div className="card" style={{ padding: '22px' }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#1E2845', marginBottom: 16 }}>🏛️ Department Performance</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                {DEPARTMENTS.map(dept => {
                  const dc = normalizedComplaints.filter(c => c.dept === dept.id);
                  const dr = dc.filter(c => c.status === 'Resolved').length;
                  const rate = dc.length > 0 ? Math.round(dr / dc.length * 100) : 0;
                  const activeCount = dc.filter(c => c.status === 'Open' || c.status === 'Escalated').length;
                  return (
                    <div key={dept.id} style={{ padding: '14px', borderRadius: 10, border: `2px solid ${dept.color}22`, background: dept.color + '08' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 18, marginBottom: 2 }}>{dept.icon}</div>
                          <div style={{ fontWeight: 700, fontSize: 12, color: '#1E2845' }}>{dept.name}</div>
                        </div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: dept.color }}>{rate}%</div>
                      </div>
                      <div style={{ fontSize: 10, color: '#64748B', marginBottom: 7 }}>{dc.length} total • {activeCount} active • {dr} resolved</div>
                      <div style={{ height: 5, background: '#E2E8F0', borderRadius: 999 }}>
                        <div style={{ height: '100%', width: rate + '%', background: dept.color, borderRadius: 999 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* COMPLAINTS TAB */}
        {tab === 'complaints' && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 19, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>All Complaints ({normalizedComplaints.length})</h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={loadAllData} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                  🔄 Refresh
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#22C55E', background: '#22C55E12', padding: '5px 12px', borderRadius: 999, fontWeight: 700 }}>
                  <span style={{ width: 7, height: 7, background: '#22C55E', borderRadius: '50%', display: 'inline-block' }} />Live
                </div>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px 90px 80px', padding: '10px 18px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                <span>Complaint</span><span>Priority</span><span>Department</span><span>Status</span><span>Filed</span><span>Action</span>
              </div>
              {normalizedComplaints.map((c, i) => {
                const d = DEPARTMENTS.find(x => x.id === c.dept || x.id === c.department_id);
                return (
                  <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px 90px 80px', padding: '12px 18px', borderBottom: i < normalizedComplaints.length - 1 ? '1px solid #F1F5F9' : 'none', alignItems: 'center', transition: 'background .15s', borderLeft: `3px solid ${d?.color || 'transparent'}`, animation: `fadeUp .3s ease ${i * .03}s both` }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#1E2845', marginBottom: 2 }}>{c.title}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>#{c.ticketId || c.ticket_id} • {c.citizenName || c.users?.name || 'Unknown'} • {c.location?.split(',')[0]}</div>
                    </div>
                    <PrioBadge p={c.priority} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: d?.color }}>{d?.icon} {d?.name}</span>
                    <StatusBadge s={c.status} />
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{timeAgo(c.createdAt || new Date(c.created_at).getTime())}</span>
                    <button 
                      onClick={() => {
                        setSelectedComplaint(c);
                        setShowComplaintModal(true);
                      }}
                      style={{ padding: '4px 8px', background: '#0A7EA4', color: 'white', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Track
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* OFFICERS TAB */}
        {tab === 'officers' && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 19, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>👮 All Officers ({allOfficers.length})</h3>
              <button onClick={loadAllData} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                🔄 Refresh
              </button>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'white' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                <div>Loading officers...</div>
              </div>
            ) : allOfficers.length === 0 ? (
              <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👮</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Officers Found</h3>
                <p style={{ color: '#64748B' }}>No officers have been registered yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
                {allOfficers.map((o, i) => {
                  // Handle both database structure and nested departments
                  const deptData = o.departments || DEPARTMENTS.find(d => d.id === o.department_id);
                  const officerName = o.name || o.users?.name || 'Unknown Officer';
                  const officerPhone = o.phone || o.users?.phone || 'N/A';
                  
                  const mine = normalizedComplaints.filter(c => c.assigned_officer_id === o.user_id || c.officer === o.user_id);
                  const resolved = mine.filter(c => c.status === 'Resolved' || c.status === 'resolved').length;
                  const rate = mine.length > 0 ? Math.round(resolved / mine.length * 100) : 0;
                  const color = ['#0A7EA4', '#8B5CF6', '#F97316', '#22C55E', '#EC4899', '#EAB308'][i % 6];
                  
                  return (
                    <div key={o.id} className="card" style={{ padding: '22px', animation: `fadeUp .4s ease ${i * .07}s both` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg,${color},${color}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>👮</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#1E2845' }}>{officerName}</div>
                          <div style={{ fontSize: 11, color: deptData?.color || '#64748B', fontWeight: 700 }}>
                            {deptData?.icon || '🏛️'} {deptData?.name || 'Department'}
                          </div>
                        </div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color }}>⭐</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                        {[['Active', mine.length, color], ['Resolved', resolved, '#22C55E'], ['Rate', rate + '%', '#0A7EA4']].map(([l, v, c]) => (
                          <div key={l} style={{ textAlign: 'center', padding: '9px 4px', background: c + '12', borderRadius: 8 }}>
                            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: c }}>{v}</div>
                            <div style={{ fontSize: 9, color: '#64748B', fontWeight: 700 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <span>Resolution Rate</span><span>{rate}%</span>
                      </div>
                      <div style={{ height: 5, background: '#E2E8F0', borderRadius: 999 }}>
                        <div style={{ height: '100%', width: rate + '%', background: color, borderRadius: 999 }} />
                      </div>
                      <div style={{ marginTop: 12, padding: '8px', background: '#F8FAFC', borderRadius: 6, fontSize: 10, color: '#64748B' }}>
                        <div><strong>Badge:</strong> {o.badge_number || 'N/A'}</div>
                        <div><strong>Phone:</strong> {officerPhone}</div>
                        <div><strong>User ID:</strong> {o.user_id?.substring(0, 8)}...</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VOLUNTEERS TAB */}
        {tab === 'volunteers' && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 19, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>🤝 All Volunteers ({allVolunteers.length})</h3>
              <button onClick={loadAllData} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                🔄 Refresh
              </button>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'white' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                <div>Loading volunteers...</div>
              </div>
            ) : allVolunteers.length === 0 ? (
              <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤝</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Volunteers Found</h3>
                <p style={{ color: '#64748B' }}>No volunteers have registered yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 18 }}>
                {allVolunteers.map((v, i) => {
                  const roleIcons = { ngo: '🏢', student: '🎓', citizen: '👤' };
                  const roleColors = { ngo: '#8B5CF6', student: '#0EA5E9', citizen: '#22C55E' };
                  const color = roleColors[v.role] || '#64748B';
                  const completionRate = v.tasks_accepted > 0 ? Math.round((v.tasks_completed / v.tasks_accepted) * 100) : 0;
                  
                  return (
                    <div key={v.id} className="card" style={{ padding: '22px', animation: `fadeUp .4s ease ${i * .07}s both`, borderTop: `4px solid ${color}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 12, background: `linear-gradient(135deg,${color},${color}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
                          {roleIcons[v.role] || '👤'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#1E2845', marginBottom: 4 }}>{v.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'capitalize', background: color + '15', padding: '2px 8px', borderRadius: 999 }}>
                              {v.role}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: v.is_available ? '#22C55E' : '#EF4444', background: v.is_available ? '#22C55E15' : '#EF444415', padding: '2px 8px', borderRadius: 999 }}>
                              {v.is_available ? '✅ Available' : '⏸️ Offline'}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#F59E0B' }}>{v.rating.toFixed(1)}</div>
                          <div style={{ fontSize: 9, color: '#64748B', fontWeight: 700 }}>⭐ Rating</div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                        {[
                          ['Completed', v.tasks_completed, '#22C55E'],
                          ['Accepted', v.tasks_accepted, '#0EA5E9'],
                          ['Rate', completionRate + '%', '#F59E0B']
                        ].map(([l, val, c]) => (
                          <div key={l} style={{ textAlign: 'center', padding: '9px 4px', background: c + '12', borderRadius: 8 }}>
                            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: c }}>{val}</div>
                            <div style={{ fontSize: 9, color: '#64748B', fontWeight: 700 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                      
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <span>Completion Rate</span><span>{completionRate}%</span>
                      </div>
                      <div style={{ height: 5, background: '#E2E8F0', borderRadius: 999, marginBottom: 12 }}>
                        <div style={{ height: '100%', width: completionRate + '%', background: color, borderRadius: 999 }} />
                      </div>
                      
                      <div style={{ padding: '10px', background: '#F8FAFC', borderRadius: 6, fontSize: 10, color: '#64748B' }}>
                        <div style={{ marginBottom: 4 }}><strong>📞 Phone:</strong> {v.phone || 'N/A'}</div>
                        <div style={{ marginBottom: 4 }}><strong>📍 Location:</strong> {v.location_address?.substring(0, 40) || 'Not set'}...</div>
                        <div><strong>🕐 Joined:</strong> {new Date(v.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Complaint Tracking Modal */}
      {showComplaintModal && selectedComplaint && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: window.innerWidth <= 768 ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: window.innerWidth <= 768 ? 0 : '2rem' }} onClick={() => setShowComplaintModal(false)}>
          <div style={{ background: 'white', borderRadius: window.innerWidth <= 768 ? '20px 20px 0 0' : 16, maxWidth: 700, width: '100%', maxHeight: window.innerWidth <= 768 ? '92vh' : '90vh', overflow: 'auto', padding: window.innerWidth <= 768 ? '20px 16px' : '2rem', position: 'relative', paddingBottom: window.innerWidth <= 768 ? 'calc(20px + env(safe-area-inset-bottom))' : '2rem' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowComplaintModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748B' }}>×</button>
            
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, color: '#1E2845', marginBottom: 16 }}>
              Complaint Tracking
            </h2>
            
            <div style={{ marginBottom: 20, padding: 16, background: '#F8FAFC', borderRadius: 12, borderLeft: '4px solid #0A7EA4' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1E2845', marginBottom: 8 }}>{selectedComplaint.title}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>{selectedComplaint.description}</div>
              {(() => {
                const photos = selectedComplaint.photo_urls || selectedComplaint.photoUrls || (selectedComplaint.imageUrl ? [selectedComplaint.imageUrl] : []);
                if (!photos || photos.length === 0) return null;
                return (
                  <div style={{ marginTop: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 8 }}>📷 Evidence Photos ({photos.length})</div>
                    <div style={{ display: 'grid', gridTemplateColumns: photos.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                      {photos.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt={`Evidence ${i + 1}`}
                            style={{ width: '100%', height: photos.length === 1 ? 240 : 120, objectFit: 'cover', borderRadius: 8, border: '2px solid #E2E8F0', cursor: 'pointer' }}
                            onError={e => e.target.parentElement.style.display = 'none'}
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11 }}>
                <span><strong>Ticket:</strong> #{selectedComplaint.ticketId || selectedComplaint.ticket_id}</span>
                <span><strong>Priority:</strong> {selectedComplaint.priority}</span>
                <span><strong>Status:</strong> {selectedComplaint.status}</span>
                <span><strong>Location:</strong> {selectedComplaint.location}</span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E2845', marginBottom: 12 }}>Update Status</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {['Open', 'In Progress', 'Resolved', 'Escalated'].map(status => (
                  <button
                    key={status}
                    onClick={async () => {
                      try {
                        await updateComplaint(selectedComplaint.id, status, `Status updated by admin to ${status}`, user?.name || 'Admin');
                        notify(`Complaint status updated to ${status}`, 'success');
                        await loadAllData();
                        setShowComplaintModal(false);
                      } catch (error) {
                        notify('Failed to update status', 'error');
                      }
                    }}
                    style={{
                      padding: '12px',
                      border: selectedComplaint.status === status ? '2px solid #0A7EA4' : '2px solid #E2E8F0',
                      background: selectedComplaint.status === status ? '#0A7EA415' : 'white',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 13,
                      color: selectedComplaint.status === status ? '#0A7EA4' : '#64748B',
                      transition: 'all 0.2s'
                    }}
                  >
                    {status === 'Open' && '📂'} {status === 'In Progress' && '🔄'} {status === 'Resolved' && '✅'} {status === 'Escalated' && '⚠️'} {status}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E2845', marginBottom: 12 }}>Activity Timeline</h3>
              <div style={{ position: 'relative', paddingLeft: 24 }}>
                <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: '#E2E8F0' }} />
                {(selectedComplaint.updates || []).map((update, i) => (
                  <div key={i} style={{ marginBottom: 16, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: -16, top: 4, width: 12, height: 12, borderRadius: '50%', background: '#0A7EA4', border: '2px solid white' }} />
                    <div style={{ fontSize: 12, color: '#1E2845', marginBottom: 4 }}>{update.msg || update.message}</div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>{update.by} • {timeAgo(update.time || new Date(update.created_at).getTime())}</div>
                  </div>
                ))}
                {(!selectedComplaint.updates || selectedComplaint.updates.length === 0) && (
                  <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>No activity yet</div>
                )}
              </div>
            </div>

            {/* Blockchain Audit Trail */}
            <div style={{ marginTop: 20 }}>
              <AuditTrail complaintId={selectedComplaint.id} ticketId={selectedComplaint.ticketId || selectedComplaint.ticket_id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
