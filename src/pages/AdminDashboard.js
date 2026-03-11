import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TopNav, StatCard, StatusBadge, PrioBadge, timeAgo } from '../components/UI';
import { BarChartSVG, LineChartSVG, DonutChart } from '../components/Charts';
import LiveMap from '../components/LiveMap';
import { DEPARTMENTS, OFFICERS, PRIORITY_COLORS, STATUS_COLORS, WEEKLY_TREND, DEPT_LOAD, STATUS_DIST } from '../data/constants';

export default function AdminDashboard() {
  const { complaints } = useApp();
  const [tab, setTab] = useState('overview');
  const [alert, setAlert] = useState(true);

  const total = complaints.length;
  const res = complaints.filter(c => c.status === 'Resolved').length;
  const open = complaints.filter(c => c.status === 'Open').length;
  const esc = complaints.filter(c => c.status === 'Escalated').length;
  const crit = complaints.filter(c => c.priority === 'Critical' && c.status !== 'Resolved').length;

  const tabs = ['overview', 'analytics', 'map', 'complaints', 'officers'];
  const tabIcons = { overview: '📊', analytics: '📈', map: '🗺️', complaints: '🎫', officers: '👮' };

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FA' }}>
      <TopNav title="Command Center" sub="National Grievance Analytics" role="admin" />

      {alert && crit > 0 && (
        <div style={{ background: '#EF4444', color: '#fff', padding: '10px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
          <span>🚨 {crit} CRITICAL complaints — SLA breach risk detected</span>
          <button onClick={() => setAlert(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
      )}

      <div style={{ padding: '22px 28px' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#fff', padding: 4, borderRadius: 10, width: 'fit-content', border: '1px solid #E2E8F0' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, background: tab === t ? '#0D1B40' : 'transparent', color: tab === t ? '#fff' : '#64748B', transition: 'all .2s', textTransform: 'capitalize' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
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
              <LiveMap complaints={complaints} height={380} showLegend={false} />
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
                  const cnt = complaints.filter(x => x.priority === p).length;
                  const pct = Math.round(cnt / complaints.length * 100);
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
              <LiveMap complaints={complaints} height={540} showLegend={true} />
            </div>
            <div className="card" style={{ padding: '22px' }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#1E2845', marginBottom: 16 }}>🏛️ Department Performance</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                {DEPARTMENTS.map(dept => {
                  const dc = complaints.filter(c => c.dept === dept.id);
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
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 19, color: '#1E2845' }}>All Complaints ({complaints.length})</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#22C55E', background: '#22C55E12', padding: '5px 12px', borderRadius: 999, fontWeight: 700 }}>
                <span style={{ width: 7, height: 7, background: '#22C55E', borderRadius: '50%', display: 'inline-block' }} />Live
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px 90px', padding: '10px 18px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                <span>Complaint</span><span>Priority</span><span>Department</span><span>Status</span><span>Filed</span>
              </div>
              {complaints.map((c, i) => {
                const d = DEPARTMENTS.find(x => x.id === c.dept);
                return (
                  <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px 90px', padding: '12px 18px', borderBottom: i < complaints.length - 1 ? '1px solid #F1F5F9' : 'none', alignItems: 'center', transition: 'background .15s', cursor: 'pointer', borderLeft: `3px solid ${d?.color || 'transparent'}`, animation: `fadeUp .3s ease ${i * .03}s both` }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#1E2845', marginBottom: 2 }}>{c.title}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>#{c.ticketId} • {c.citizenName} • {c.location?.split(',')[0]}</div>
                    </div>
                    <PrioBadge p={c.priority} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: d?.color }}>{d?.icon} {d?.name}</span>
                    <StatusBadge s={c.status} />
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{timeAgo(c.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* OFFICERS TAB */}
        {tab === 'officers' && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 19, color: '#1E2845', marginBottom: 18 }}>👮 Officer Performance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
              {OFFICERS.map((o, i) => {
                const dept = DEPARTMENTS.find(d => d.id === o.dept);
                const mine = complaints.filter(c => c.officer === o.id);
                const resolved = mine.filter(c => c.status === 'Resolved').length;
                const rate = mine.length > 0 ? Math.round(resolved / mine.length * 100) : 0;
                const color = ['#0A7EA4', '#8B5CF6', '#F97316', '#22C55E', '#EC4899', '#EAB308'][i];
                return (
                  <div key={o.id} className="card" style={{ padding: '22px', animation: `fadeUp .4s ease ${i * .07}s both` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg,${color},${color}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>{o.avatar}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#1E2845' }}>{o.name}</div>
                        <div style={{ fontSize: 11, color: dept?.color, fontWeight: 700 }}>{dept?.icon} {dept?.name}</div>
                      </div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color }}>{o.rating}⭐</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                      {[['Active', o.load, color], ['Resolved', resolved, '#22C55E'], ['Rate', rate + '%', '#0A7EA4']].map(([l, v, c]) => (
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
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
