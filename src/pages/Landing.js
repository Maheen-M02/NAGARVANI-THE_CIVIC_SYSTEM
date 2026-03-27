import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import GridDistortion from '../components/GridDistortion';
import NagarVaniLogo from '../components/NagarVaniLogo';
import AuthModal from '../components/AuthModal';

// ── Mobile Landing ────────────────────────────────────────────
function MobileLanding({ user, complaints, handleRoleSelect, handleAuthClick, handleSignOut }) {
  const total = complaints.length;
  const res = complaints.filter(c => c.status === 'resolved').length;

  const roles = [
    { id:'citizen', icon:'🧑‍💼', title:'Citizen Portal', tag:'File & Track Complaints', color:'#0A7EA4',
      desc:'Submit a grievance in 60 seconds. AI routes it to the right department instantly.' },
    { id:'officer', icon:'👮', title:'Officer Dashboard', tag:'Manage & Resolve', color:'#8B5CF6',
      desc:'AI-prioritized task queue. Update status from the field. Hit your SLA targets.' },
    { id:'admin', icon:'📊', title:'Command Center', tag:'Govern at Scale', color:'#F5A623',
      desc:'Live analytics across every department. Spot trends. Prevent SLA breaches.' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#0D1B40', display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle at 30% 20%, #1A3A8F40 0%, transparent 60%), radial-gradient(circle at 70% 80%, #0A7EA430 0%, transparent 50%)', pointerEvents:'none' }} />

      {/* Header */}
      <div style={{ position:'relative', zIndex:10, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 20px 0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <NagarVaniLogo size={32} />
          <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'#fff' }}>
            Nagar<span style={{ color:'#00C2E0' }}>Vani</span>
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'#22C55E20', padding:'5px 12px', borderRadius:999, border:'1px solid #22C55E40' }}>
          <span style={{ width:6, height:6, background:'#22C55E', borderRadius:'50%', display:'inline-block' }} />
          <span style={{ fontSize:11, fontWeight:700, color:'#22C55E' }}>LIVE</span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ position:'relative', zIndex:10, textAlign:'center', padding:'32px 24px 24px' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(0,194,224,0.12)', border:'1px solid rgba(0,194,224,0.25)', borderRadius:999, padding:'5px 14px', marginBottom:16 }}>
          <span style={{ fontSize:11, fontWeight:700, color:'#00C2E0' }}>🇮🇳 AI-Powered Civic Platform</span>
        </div>
        <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:800, color:'#fff', lineHeight:1.2, marginBottom:12, letterSpacing:'-0.5px' }}>
          Every Complaint<br />
          <span style={{ background:'linear-gradient(90deg,#00C2E0,#0A7EA4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Heard &amp; Resolved
          </span>
        </h1>
        <p style={{ fontSize:14, color:'#8899BB', lineHeight:1.6, marginBottom:20, maxWidth:300, margin:'0 auto 20px' }}>
          Complaint to resolution in under 48 hours. Powered by AI + Blockchain.
        </p>
        <div style={{ display:'flex', justifyContent:'center', gap:20 }}>
          {[['🎫', total, 'Complaints'], ['✅', res, 'Resolved'], ['📈', total > 0 ? Math.round(res/total*100)+'%' : '0%', 'Rate']].map(([ic,v,l]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:800, color:'#00C2E0' }}>{ic} {v}</div>
              <div style={{ fontSize:10, color:'#8899BB', fontWeight:600 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Role cards */}
      <div style={{ position:'relative', zIndex:10, flex:'1 1 auto', padding:'0 0 16px' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#F5A623', textAlign:'center', marginBottom:14 }}>👇 Select your role</div>
        <div style={{ display:'flex', gap:14, overflowX:'auto', padding:'4px 20px 8px', scrollSnapType:'x mandatory', scrollbarWidth:'none', WebkitOverflowScrolling:'touch' }}>
          {roles.map(r => (
            <div key={r.id} onClick={() => handleRoleSelect(r.id)}
              style={{ flexShrink:0, width:'calc(100vw - 60px)', scrollSnapAlign:'center', background:'rgba(255,255,255,0.06)', border:`1.5px solid ${r.color}40`, borderRadius:24, padding:'24px 20px', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
              <div style={{ width:56, height:56, background:r.color+'22', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, marginBottom:16, border:`1px solid ${r.color}35` }}>{r.icon}</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#fff', marginBottom:4 }}>{r.title}</div>
              <div style={{ fontSize:12, color:r.color, fontWeight:700, marginBottom:10, letterSpacing:'0.5px' }}>{r.tag}</div>
              <div style={{ fontSize:13, color:'#8899BB', lineHeight:1.6, marginBottom:20 }}>{r.desc}</div>
              <div style={{ background:r.color, color: r.id==='admin' ? '#0D1B40' : '#fff', padding:'13px 18px', borderRadius:14, fontWeight:700, fontSize:15, fontFamily:'Syne,sans-serif', textAlign:'center' }}>
                Enter as {r.id.charAt(0).toUpperCase()+r.id.slice(1)} →
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auth buttons */}
      <div style={{ position:'relative', zIndex:10, padding:'0 20px 36px' }}>
        {user ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:13, color:'#8899BB', marginBottom:12 }}>Welcome back, {user.name || user.email}</div>
            <button onClick={handleSignOut}
              style={{ width:'100%', padding:14, borderRadius:14, background:'rgba(220,38,38,0.15)', border:'1px solid rgba(220,38,38,0.3)', color:'#fca5a5', fontWeight:700, fontSize:14, cursor:'pointer' }}>
              Sign Out
            </button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <button onClick={() => handleAuthClick('signin')}
              style={{ padding:14, borderRadius:14, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer' }}>
              Sign In
            </button>
            <button onClick={() => handleAuthClick('signup')}
              style={{ padding:14, borderRadius:14, background:'linear-gradient(135deg,#0A7EA4,#00C2E0)', border:'none', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer' }}>
              Sign Up
            </button>
          </div>
        )}
        <div style={{ textAlign:'center', marginTop:16, fontSize:11, color:'#3D4F6E' }}>
          Built for India's 1.4B citizens • AI + Blockchain • NagarVani 2025
        </div>
      </div>
    </div>
  );
}

// ── Main Landing ──────────────────────────────────────────────
export default function Landing() {
  const { setRole, complaints, user, role, signOut } = useApp();
  const navigate = useNavigate();
  const [hov, setHov] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const total = complaints.length;
  const res = complaints.filter(c => c.status === 'resolved').length;

  useEffect(() => {
    if (user && role && role !== 'landing') {
      if (role === 'citizen') navigate('/citizen', { replace: true });
      else if (role === 'officer') navigate('/officer', { replace: true });
      else if (role === 'admin') navigate('/admin', { replace: true });
    }
  }, [user, role, navigate]);

  const handleRoleSelect = (roleId) => {
    if (!user) { setAuthMode('signin'); setShowAuthModal(true); return; }
    setRole(roleId);
    navigate(`/${roleId}`);
  };

  const handleAuthClick = (mode) => { setAuthMode(mode); setShowAuthModal(true); };
  const handleSignOut = async () => { await signOut(); navigate('/'); };

  // Mobile version
  if (window.innerWidth <= 768) {
    return (
      <>
        <MobileLanding user={user} complaints={complaints} handleRoleSelect={handleRoleSelect} handleAuthClick={handleAuthClick} handleSignOut={handleSignOut} />
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} defaultMode={authMode} />
      </>
    );
  }

  // Desktop version
  const roles = [
    { id:'citizen', icon:'🧑‍💼', title:'Citizen Portal', tag:'File & Track Complaints', desc:'Submit a grievance in 60 seconds. AI instantly routes it to the right department.', features:['File complaint in 60 seconds','AI auto-routes to right dept','Live status tracking','22 languages supported'], color:'#0A7EA4', cta:'Enter as Citizen →' },
    { id:'officer', icon:'👮', title:'Officer Dashboard', tag:'Manage & Resolve Complaints', desc:'Your task queue, AI-prioritized. Update status from the field. Hit your SLA.', features:['Smart task assignment','Priority queue view','Field update with notes','SLA timer per complaint'], color:'#8B5CF6', cta:'Enter as Officer →' },
    { id:'admin', icon:'📊', title:'Command Center', tag:'Govern at Scale', desc:'See every complaint across every department in real time. Spot trends. Act fast.', features:['Live analytics dashboard','Real-time map tracking','SLA breach alerts','AI trend prediction'], color:'#F5A623', cta:'Enter as Admin →' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#0D1B40', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle at 20% 50%, #1A3A8F30 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0A7EA430 0%, transparent 50%), radial-gradient(circle at 60% 80%, #00C2E020 0%, transparent 40%)', pointerEvents:'none', zIndex:1 }} />
      <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:2 }}>
        <GridDistortion grid={15} mouse={0.25} strength={0.4} relaxation={0.75} className="landing-distortion" />
      </div>

      <div style={{ position:'relative', zIndex:3, padding:'0 36px' }}>
        {/* Header */}
        <div style={{ paddingTop:24, paddingBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <NagarVaniLogo size={40} />
            <div style={{ background:'linear-gradient(135deg,#1A3A8F,#0A7EA4)', color:'#fff', padding:'7px 16px', borderRadius:10, fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20 }}>
              Nagar<span style={{ color:'#00C2E0' }}>Vani</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:20, alignItems:'center' }}>
            {[['🎫',total,'Complaints'],['✅',res,'Resolved'],['📈',Math.round(res/total*100)+'%','Rate']].map(([ic,v,l]) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:800, fontFamily:'Syne,sans-serif', color:'#00C2E0' }}>{ic} {v}</div>
                <div style={{ fontSize:10, color:'#8899BB' }}>{l}</div>
              </div>
            ))}
            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:999, background:'#22C55E20', color:'#22C55E', fontSize:11, fontWeight:700 }}>
              <span style={{ width:6, height:6, background:'#22C55E', borderRadius:'50%', display:'inline-block' }} />LIVE
            </div>
            {user ? (
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ fontSize:12, color:'#8899BB' }}>Welcome, {user.name}</div>
                <button onClick={handleSignOut} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', padding:'6px 12px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer' }}>Sign Out</button>
              </div>
            ) : (
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => handleAuthClick('signin')} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', padding:'6px 12px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer' }}>Sign In</button>
                <button onClick={() => handleAuthClick('signup')} style={{ background:'linear-gradient(135deg,#0A7EA4,#00C2E0)', border:'none', color:'#fff', padding:'6px 12px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer' }}>Sign Up</button>
              </div>
            )}
          </div>
        </div>

        {/* Hero */}
        <div style={{ textAlign:'center', padding:'36px 0 48px', animation:'fadeUp .5s ease' }}>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(32px,5.5vw,64px)', fontWeight:800, color:'#fff', lineHeight:1.1, marginBottom:16, letterSpacing:'-1px' }}>
            Every Citizen Complaint<br />
            <span style={{ background:'linear-gradient(90deg,#00C2E0,#0A7EA4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Heard. Resolved. Accountable.
            </span>
          </h1>
          <p style={{ fontSize:17, color:'#8899BB', maxWidth:520, margin:'0 auto 14px', lineHeight:1.7 }}>
            AI-powered grievance management for India's 1.4 billion citizens — complaint to resolution in under 48 hours.
          </p>
          <div style={{ fontSize:13, color:'#F5A623', fontWeight:700 }}>👇 Select your role to explore</div>
        </div>

        {/* Role cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:22, maxWidth:1060, margin:'0 auto', paddingBottom:48 }}>
          {roles.map((r,i) => (
            <div key={r.id} onClick={() => handleRoleSelect(r.id)} onMouseEnter={() => setHov(r.id)} onMouseLeave={() => setHov(null)}
              style={{ background: hov===r.id ? '#ffffff12' : '#ffffff08', border:`1.5px solid ${hov===r.id ? r.color : '#ffffff15'}`, borderRadius:18, padding:'28px 24px', cursor:'pointer', transition:'all .3s', transform: hov===r.id ? 'translateY(-5px)' : 'none', boxShadow: hov===r.id ? `0 20px 50px ${r.color}25` : 'none', animation:`fadeUp .5s ease ${i*.1}s both` }}>
              <div style={{ width:56, height:56, background:r.color+'22', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, marginBottom:18, border:`1px solid ${r.color}35` }}>{r.icon}</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#fff', marginBottom:3 }}>{r.title}</div>
              <div style={{ fontSize:12, color:r.color, fontWeight:700, marginBottom:10, letterSpacing:'.5px' }}>{r.tag}</div>
              <div style={{ fontSize:13, color:'#8899BB', lineHeight:1.6, marginBottom:20 }}>{r.desc}</div>
              <div style={{ marginBottom:24 }}>
                {r.features.map(feat => (
                  <div key={feat} style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:'#B0C4DE', marginBottom:7 }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background:r.color, flexShrink:0 }} />{feat}
                  </div>
                ))}
              </div>
              <div style={{ background:r.color, color: r.id==='admin' ? '#0D1B40' : '#fff', padding:'11px 18px', borderRadius:10, fontWeight:700, fontSize:14, fontFamily:'Syne,sans-serif', textAlign:'center' }}>{r.cta}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', paddingBottom:28, color:'#3D4F6E', fontSize:12 }}>
          Built for India's 1.4B citizens • AI + Blockchain powered • NagarVani 2025
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} defaultMode={authMode} />
    </div>
  );
}
