import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function MobileBottomNav() {
  const { user, role } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const path = location.pathname;

  // Citizen nav
  if (role === 'citizen') {
    const items = [
      { icon: '🏠', label: 'Home',      to: '/citizen' },
      { icon: '📝', label: 'File',      to: '/citizen/file' },
      { icon: '🔍', label: 'Track',     to: '/citizen/track' },
      { icon: '🏆', label: 'Ranks',     to: '/leaderboard' },
    ];
    return <BottomNav items={items} path={path} navigate={navigate} />;
  }

  // Officer nav
  if (role === 'officer') {
    const items = [
      { icon: '📋', label: 'Queue',     to: '/officer' },
      { icon: '🗺️', label: 'Map',       to: '/officer' },
      { icon: '🏆', label: 'Ranks',     to: '/leaderboard' },
    ];
    return <BottomNav items={items} path={path} navigate={navigate} />;
  }

  // Admin nav
  if (role === 'admin') {
    const items = [
      { icon: '📊', label: 'Dashboard', to: '/admin' },
      { icon: '🏆', label: 'Ranks',     to: '/leaderboard' },
    ];
    return <BottomNav items={items} path={path} navigate={navigate} />;
  }

  return null;
}

function BottomNav({ items, path, navigate }) {
  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-bottom-nav-inner">
        {items.map(item => (
          <button
            key={item.to + item.label}
            className={`mobile-nav-item ${path === item.to ? 'active' : ''}`}
            onClick={() => navigate(item.to)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
