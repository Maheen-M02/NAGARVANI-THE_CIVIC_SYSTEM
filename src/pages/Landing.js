import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import GridDistortion from '../components/GridDistortion';

export default function Landing() {
  const { setRole, complaints } = useApp();
  const [hov, setHov] = useState(null);
  const total = complaints.length;
  const res = complaints.filter(c => c.status === 'Resolved').length;

  const roles = [
    {
      id: 'citizen', icon: '🧑‍💼', title: 'Citizen Portal', tag: 'File & Track Complaints',
      desc: 'Submit a grievance in 60 seconds. AI instantly routes it to the right department.',
      features: ['File complaint in 60 seconds', 'AI auto-routes to right dept', 'Live status tracking', '22 languages supported'],
      color: '#0A7EA4', cta: 'Enter as Citizen →',
    },
    {
      id: 'officer', icon: '👮', title: 'Officer Dashboard', tag: 'Manage & Resolve Complaints',
      desc: 'Your task queue, AI-prioritized. Update status from the field. Hit your SLA.',
      features: ['Smart task assignment', 'Priority queue view', 'Field update with notes', 'SLA timer per complaint'],
      color: '#8B5CF6', cta: 'Enter as Officer →',
    },
    {
      id: 'admin', icon: '📊', title: 'Command Center', tag: 'Govern at Scale',
      desc: 'See every complaint across every department in real time. Spot trends. Act fast.',
      features: ['Live analytics dashboard', 'Real-time map tracking', 'SLA breach alerts', 'AI trend prediction'],
      color: '#F5A623', cta: 'Enter as Admin →',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0D1B40', position: 'relative', overflow: 'hidden' }}>
      {/* Existing background gradients */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, #1A3A8F30 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0A7EA430 0%, transparent 50%), radial-gradient(circle at 60% 80%, #00C2E020 0%, transparent 40%)', pointerEvents: 'none', zIndex: 1 }} />
      
      {/* Grid Distortion Background - replaces the static grid */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 2
      }}>
        <GridDistortion
          grid={15}
          mouse={0.25}
          strength={0.4}
          relaxation={0.75}
          className="landing-distortion"
        />
      </div>

      <div style={{ position: 'relative', zIndex: 3, padding: '0 36px' }}>
        {/* Header */}
        <div style={{ paddingTop: 32, paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'linear-gradient(135deg,#1A3A8F,#0A7EA4)', color: '#fff', padding: '7px 16px', borderRadius: 10, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20 }}>
              Nagar<span style={{ color: '#00C2E0' }}>Vani</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {[['🎫', total, 'Complaints'], ['✅', res, 'Resolved'], ['📈', Math.round(res / total * 100) + '%', 'Rate']].map(([ic, v, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: '#00C2E0' }}>{ic} {v}</div>
                <div style={{ fontSize: 10, color: '#8899BB' }}>{l}</div>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 999, background: '#22C55E20', color: '#22C55E', fontSize: 11, fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, background: '#22C55E', borderRadius: '50%', display: 'inline-block' }} />LIVE
            </div>
          </div>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '36px 0 48px', animation: 'fadeUp .5s ease' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(32px,5.5vw,64px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 16, letterSpacing: '-1px' }}>
            Every Citizen Complaint<br />
            <span style={{ background: 'linear-gradient(90deg,#00C2E0,#0A7EA4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Heard. Resolved. Accountable.
            </span>
          </h1>
          <p style={{ fontSize: 17, color: '#8899BB', maxWidth: 520, margin: '0 auto 14px', lineHeight: 1.7 }}>
            AI-powered grievance management for India's 1.4 billion citizens — complaint to resolution in under 48 hours.
          </p>
          <div style={{ fontSize: 13, color: '#F5A623', fontWeight: 700 }}>👇 Select your role to explore</div>
        </div>

        {/* Role cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 22, maxWidth: 1060, margin: '0 auto', paddingBottom: 48 }}>
          {roles.map((r, i) => (
            <div
              key={r.id}
              onClick={() => setRole(r.id)}
              onMouseEnter={() => setHov(r.id)}
              onMouseLeave={() => setHov(null)}
              style={{
                background: hov === r.id ? '#ffffff12' : '#ffffff08',
                border: `1.5px solid ${hov === r.id ? r.color : '#ffffff15'}`,
                borderRadius: 18, padding: '28px 24px', cursor: 'pointer',
                transition: 'all .3s',
                transform: hov === r.id ? 'translateY(-5px)' : 'none',
                boxShadow: hov === r.id ? `0 20px 50px ${r.color}25` : 'none',
                animation: `fadeUp .5s ease ${i * .1}s both`,
              }}
            >
              <div style={{ width: 56, height: 56, background: r.color + '22', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 18, border: `1px solid ${r.color}35` }}>{r.icon}</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff', marginBottom: 3 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: r.color, fontWeight: 700, marginBottom: 10, letterSpacing: '.5px' }}>{r.tag}</div>
              <div style={{ fontSize: 13, color: '#8899BB', lineHeight: 1.6, marginBottom: 20 }}>{r.desc}</div>
              <div style={{ marginBottom: 24 }}>
                {r.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#B0C4DE', marginBottom: 7 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: r.color, flexShrink: 0 }} />{f}
                  </div>
                ))}
              </div>
              <div style={{ background: r.color, color: r.id === 'admin' ? '#0D1B40' : '#fff', padding: '11px 18px', borderRadius: 10, fontWeight: 700, fontSize: 14, fontFamily: 'Syne, sans-serif', textAlign: 'center' }}>
                {r.cta}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', paddingBottom: 28, color: '#3D4F6E', fontSize: 12 }}>
          Built for India's 1.4B citizens • AI + Blockchain powered • NagarVani 2025
        </div>
      </div>
    </div>
  );
}
