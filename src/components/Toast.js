import React from 'react';
import { useApp } from '../context/AppContext';

export default function Toast() {
  const { notif } = useApp();
  if (!notif) return null;
  const colors = { success: '#22C55E', error: '#EF4444', info: '#0EA5E9', warning: '#F97316' };
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const col = colors[notif.type] || '#0EA5E9';
  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999,
      background: col, color: '#fff', padding: '13px 20px', borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,.2)', fontWeight: 600, fontSize: 14,
      animation: 'fadeUp .3s ease', display: 'flex', alignItems: 'center',
      gap: 8, maxWidth: 340,
    }}>
      {icons[notif.type] || 'ℹ️'} {notif.msg}
    </div>
  );
}
