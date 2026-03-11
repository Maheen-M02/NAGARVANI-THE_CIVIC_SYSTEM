import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { DEPARTMENTS, PRIORITY_COLORS, STATUS_COLORS } from '../data/constants';

// Fix Leaflet default marker icon paths broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default function LiveMap({ complaints, filterDept, height = 520, showLegend = true }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef([]);
  const [selComplaint, setSelComplaint] = useState(null);
  const [activeDept, setActiveDept] = useState(filterDept || 'all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  // Init Leaflet map once
  useEffect(() => {
    if (leafletMap.current || !mapRef.current) return;

    leafletMap.current = L.map(mapRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
      attributionControl: false,
    });

    // Use a colorful satellite/hybrid tile layer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '© Esri, Maxar, Earthstar Geographics'
    }).addTo(leafletMap.current);

    // Add street labels overlay for better readability
    L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-hybrid/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      opacity: 0.6,
      attribution: '© Stamen Design, © OpenStreetMap'
    }).addTo(leafletMap.current);

    L.control.attribution({ prefix: false }).addTo(leafletMap.current);

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Update markers when filters/complaints change
  useEffect(() => {
    if (!leafletMap.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filtered = complaints.filter(c => {
      if (activeDept !== 'all' && c.dept !== activeDept) return false;
      if (activeStatus !== 'all' && c.status !== activeStatus) return false;
      return c.lat && c.lng;
    });

    filtered.forEach(c => {
      const dept = DEPARTMENTS.find(d => d.id === c.dept);
      const priColor = PRIORITY_COLORS[c.priority] || '#6B7280';
      const isCritical = c.priority === 'Critical' || c.status === 'Escalated';

      const svgIcon = L.divIcon({
        className: '',
        html: `<div class="${isCritical ? 'nv-marker-pulse' : ''}" style="position:relative;width:40px;height:40px;">
          <div style="position:absolute;inset:0;border-radius:50%;background:linear-gradient(135deg, ${priColor}40, ${priColor}20);border:3px solid ${priColor};box-shadow:0 4px 12px rgba(0,0,0,0.3);"></div>
          <div style="position:absolute;inset:8px;border-radius:50%;background:linear-gradient(135deg, ${dept?.color || priColor}, ${dept?.color || priColor}CC);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:12px;line-height:1;">
            ${dept?.icon || '📍'}
          </div>
          ${isCritical ? `<div style="position:absolute;top:-2px;right:-2px;width:16px;height:16px;background:linear-gradient(135deg, #EF4444, #DC2626);border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(239,68,68,0.4);animation:pulse 2s ease infinite;"></div>` : ''}
          <div style="position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:20px;height:8px;background:rgba(0,0,0,0.2);border-radius:50%;filter:blur(2px);"></div>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -25],
      });

      const marker = L.marker([c.lat, c.lng], { icon: svgIcon });

      const elapsed = Math.round((Date.now() - c.createdAt) / 3600000);
      const slaPct = Math.min(100, (elapsed / c.slaHours) * 100);
      const slaColor = slaPct > 90 ? '#EF4444' : slaPct > 70 ? '#F97316' : '#22C55E';

      const popupHtml = `
        <div style="font-family:'DM Sans',sans-serif;width:280px;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
          <div style="background:linear-gradient(135deg, ${dept?.color || '#1A3A8F'}, ${dept?.color || '#1A3A8F'}DD);padding:16px 18px;position:relative;">
            <div style="position:absolute;top:0;right:0;width:60px;height:60px;background:rgba(255,255,255,0.1);border-radius:50%;transform:translate(20px,-20px);"></div>
            <div style="position:relative;z-index:1;">
              <div style="font-size:10px;color:rgba(255,255,255,.8);font-weight:700;letter-spacing:1px;margin-bottom:4px;">${dept?.icon} ${dept?.name} • ${c.ticketId}</div>
              <div style="font-size:14px;font-weight:700;color:#fff;line-height:1.3;margin-bottom:8px;">${c.title}</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <span style="background:rgba(255,255,255,0.2);color:#fff;padding:4px 10px;border-radius:999px;font-size:10px;font-weight:700;backdrop-filter:blur(10px);">${c.priority}</span>
                <span style="background:rgba(255,255,255,0.2);color:#fff;padding:4px 10px;border-radius:999px;font-size:10px;font-weight:700;backdrop-filter:blur(10px);">${c.status}</span>
              </div>
            </div>
          </div>
          <div style="padding:16px 18px;background:linear-gradient(135deg, #fff, #f8fafc);">
            <div style="font-size:12px;color:#64748B;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
              <span style="font-size:14px;">📍</span> ${c.location}
            </div>
            <div style="margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;font-size:10px;color:#64748B;margin-bottom:6px;">
                <span style="font-weight:600;">SLA Progress</span>
                <span style="color:${slaColor};font-weight:700;">${elapsed}h / ${c.slaHours}h</span>
              </div>
              <div style="height:6px;background:#E2E8F0;border-radius:999px;overflow:hidden;">
                <div style="height:100%;width:${slaPct}%;background:linear-gradient(90deg, ${slaColor}, ${slaColor}CC);border-radius:999px;transition:width 0.3s ease;"></div>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="font-size:11px;color:#94A3B8;display:flex;align-items:center;gap:6px;">
                <span>👤 ${c.citizenName}</span>
              </div>
              <div style="background:linear-gradient(135deg, #22C55E20, #22C55E10);color:#22C55E;padding:4px 8px;border-radius:6px;font-size:10px;font-weight:700;display:flex;align-items:center;gap:4px;">
                🤖 ${c.confidence}%
              </div>
            </div>
          </div>
        </div>`;

      marker.bindPopup(popupHtml, { className: 'nv-popup', maxWidth: 300, closeButton: false });
      marker.on('click', () => setSelComplaint(c));
      marker.addTo(leafletMap.current);
      markersRef.current.push(marker);
    });

    if (filtered.length > 0) {
      const bounds = L.latLngBounds(filtered.map(c => [c.lat, c.lng]));
      leafletMap.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    }
  }, [complaints, activeDept, activeStatus]);

  const visibleCount = complaints.filter(c => {
    if (activeDept !== 'all' && c.dept !== activeDept) return false;
    if (activeStatus !== 'all' && c.status !== activeStatus) return false;
    return c.lat && c.lng;
  }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Toolbar */}
      <div style={{
        background: 'linear-gradient(135deg, #0D1B40, #1A3A8F, #0A7EA4)', 
        borderRadius: '14px 14px 0 0',
        padding: '14px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: 'rgba(0,194,224,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, background: 'rgba(245,166,35,0.08)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, background: 'linear-gradient(135deg, #22C55E, #16A34A)', borderRadius: '50%', animation: 'pulse 2s ease infinite', boxShadow: '0 0 10px rgba(34,197,94,0.4)' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#22C55E', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>LIVE MAP</span>
          </div>
          <span style={{ fontSize: 11, color: '#B8D4F0', fontWeight: 600 }}>{liveTime}</span>
          <div style={{ background: 'rgba(0,194,224,0.2)', color: '#00C2E0', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, border: '1px solid rgba(0,194,224,0.3)', backdropFilter: 'blur(10px)' }}>
            {visibleCount} pins shown
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Dept filters — hidden when map is scoped to one dept */}
          {!filterDept && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setActiveDept('all')} style={pillStyle(activeDept === 'all', '#00C2E0')}>All Depts</button>
              {DEPARTMENTS.map(d => (
                <button key={d.id} onClick={() => setActiveDept(d.id)} style={pillStyle(activeDept === d.id, d.color)}>{d.icon}</button>
              ))}
            </div>
          )}
          {/* Status filters */}
          <div style={{ display: 'flex', gap: 4 }}>
            {['all', 'Open', 'In Progress', 'Escalated', 'Resolved'].map(s => {
              const sc = STATUS_COLORS[s] || '#00C2E0';
              return (
                <button key={s} onClick={() => setActiveStatus(s)} style={pillStyle(activeStatus === s, sc)}>
                  {s === 'all' ? 'All' : s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map container */}
      <div className="map-panel" style={{ borderRadius: '0 0 14px 14px', borderTop: 'none' }}>
        <div ref={mapRef} style={{ height, width: '100%' }} />

        {/* Priority legend */}
        {showLegend && (
          <div style={{ position: 'absolute', bottom: 20, left: 16, zIndex: 1000, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '12px 16px', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#1E2845', marginBottom: 8, letterSpacing: '1px', textTransform: 'uppercase' }}>Priority Levels</div>
            {Object.entries(PRIORITY_COLORS).map(([p, c]) => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12, color: '#1E2845', fontWeight: 600 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: `linear-gradient(135deg, ${c}, ${c}CC)`, border: '2px solid #fff', boxShadow: `0 2px 8px ${c}40` }} /> 
                {p}
              </div>
            ))}
          </div>
        )}

        {/* Dept legend */}
        {showLegend && !filterDept && (
          <div style={{ position: 'absolute', bottom: 20, right: 16, zIndex: 1000, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '12px 16px', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#1E2845', marginBottom: 8, letterSpacing: '1px', textTransform: 'uppercase' }}>Departments</div>
            {DEPARTMENTS.map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12, color: '#1E2845', fontWeight: 600 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: `linear-gradient(135deg, ${d.color}, ${d.color}CC)`, border: '2px solid #fff', boxShadow: `0 2px 8px ${d.color}40` }} />
                <span style={{ fontSize: 14 }}>{d.icon}</span> {d.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected complaint strip */}
      {selComplaint && (() => {
        const dept = DEPARTMENTS.find(d => d.id === selComplaint.dept);
        return (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 14px 14px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <div style={{ width: 36, height: 36, background: dept?.color + '20', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{dept?.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1E2845' }}>{selComplaint.title}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>📍 {selComplaint.location} • {selComplaint.ticketId}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <span className="badge" style={{ background: (STATUS_COLORS[selComplaint.status] || '#6B7280') + '20', color: STATUS_COLORS[selComplaint.status] || '#6B7280' }}>{selComplaint.status}</span>
              <span className="badge" style={{ background: (PRIORITY_COLORS[selComplaint.priority] || '#6B7280') + '18', color: PRIORITY_COLORS[selComplaint.priority] || '#6B7280' }}>{selComplaint.priority}</span>
              <button onClick={() => setSelComplaint(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function pillStyle(active, color) {
  return {
    padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
    border: `2px solid ${active ? color : 'rgba(255,255,255,0.3)'}`,
    background: active ? `linear-gradient(135deg, ${color}25, ${color}15)` : 'rgba(255,255,255,0.1)',
    color: active ? color : '#B8D4F0',
    fontFamily: 'DM Sans, sans-serif',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
    boxShadow: active ? `0 2px 8px ${color}30` : 'none',
  };
}
