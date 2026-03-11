import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TopNav, StatusBadge, PrioBadge, timeAgo } from '../components/UI';
import LiveMap from '../components/LiveMap';
import { DEPARTMENTS, OFFICERS, STATUS_COLORS, AI_SUGGESTIONS } from '../data/constants';

const CUR_OFFICER = OFFICERS[0]; // Rajesh Kumar — PWD Roads

function ComplaintDetail({ sel, newStatus, setNewStatus, note, setNote, doUpdate, getSLA }) {
  const dept = DEPARTMENTS.find(x => x.id === sel.dept);
  const officer = OFFICERS.find(x => x.id === sel.officer);
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
          {[...sel.updates].reverse().map((u, i) => (
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
    </div>
  );
}

export default function OfficerDashboard() {
  const { complaints, updateComplaint, notify } = useApp();
  const [sel, setSel] = useState(null);
  const [filt, setFilt] = useState('all');
  const [note, setNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [activeView, setActiveView] = useState('queue'); // 'queue' | 'map'

  const mine = complaints.filter(c => c.officer === CUR_OFFICER.id || c.dept === CUR_OFFICER.dept);
  const filtered = filt === 'all' ? mine : mine.filter(c => c.status === filt);
  const priSort = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  const sorted = [...filtered].sort((a, b) => priSort[b.priority] - priSort[a.priority]);

  const getSLA = c => {
    const e = (Date.now() - c.createdAt) / 3600000;
    const p = e / c.slaHours;
    if (p > 1) return { l: 'BREACHED', c: '#EF4444', p: 100 };
    if (p > .75) return { l: 'AT RISK', c: '#F97316', p: p * 100 };
    return { l: 'ON TRACK', c: '#22C55E', p: p * 100 };
  };

  const doUpdate = () => {
    if (!newStatus || !sel) return;
    updateComplaint(sel.id, newStatus, note, CUR_OFFICER.name);
    setSel(s => s ? { ...s, status: newStatus, updates: [...s.updates, { time: Date.now(), msg: note || `Status → ${newStatus}`, by: CUR_OFFICER.name }] } : null);
    notify(`${sel.ticketId} → "${newStatus}"`, 'success');
    setNote(''); setNewStatus('');
  };

  const stats = {
    open: mine.filter(c => c.status === 'Open').length,
    prog: mine.filter(c => c.status === 'In Progress').length,
    res: mine.filter(c => c.status === 'Resolved').length,
    esc: mine.filter(c => c.status === 'Escalated').length,
  };

  const dept = DEPARTMENTS.find(d => d.id === CUR_OFFICER.dept);

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FA' }}>
      <TopNav title="Officer Dashboard" sub={`${CUR_OFFICER.name} — ${dept?.name}`} role="officer" />

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
          <LiveMap complaints={mine} filterDept={CUR_OFFICER.dept} height={580} showLegend={true} />
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
                  <div key={c.id} onClick={() => setSel(c)} style={{ padding: '12px 14px', borderRadius: 10, marginBottom: 7, cursor: 'pointer', border: `1.5px solid ${isSel ? '#8B5CF6' : '#E2E8F0'}`, background: isSel ? '#8B5CF608' : '#fff', transition: 'all .2s', borderLeft: `4px solid ${d?.color || '#E2E8F0'}`, animation: `fadeUp .3s ease ${i * .04}s both` }}>
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
