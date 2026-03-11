import React, { useState } from 'react';
import { STATUS_COLORS, PRIORITY_COLORS } from '../data/constants';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

export function StatusBadge({ s }) {
  const c = STATUS_COLORS[s] || '#6B7280';
  return (
    <span className="badge" style={{ background: c + '20', color: c }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, display: 'inline-block' }} />
      {s}
    </span>
  );
}

export function PrioBadge({ p }) {
  const c = PRIORITY_COLORS[p] || '#6B7280';
  const icon = p === 'Critical' ? '🔴' : p === 'High' ? '🟠' : p === 'Medium' ? '🟡' : '🟢';
  return (
    <span className="badge" style={{ background: c + '18', color: c }}>
      {icon} {p}
    </span>
  );
}

export function Spinner({ size = 20, color = '#0A7EA4' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2.5px solid ${color}25`,
      borderTop: `2.5px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin .7s linear infinite',
    }} />
  );
}

export function StatCard({ label, value, icon, color, sub, trend }) {
  return (
    <div className="card" style={{ padding: '18px 22px', animation: 'fadeUp .4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 30, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: color || '#1E2845' }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>{sub}</div>}
        </div>
        <div style={{ width: 44, height: 44, background: (color || '#1A3A8F') + '15', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
      </div>
      {trend !== undefined && (
        <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: trend >= 0 ? '#22C55E' : '#EF4444' }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week
        </div>
      )}
    </div>
  );
}

export function TopNav({ title, sub, role }) {
  const { setRole, complaints } = useApp();
  const { t } = useTranslation();
  const roleColors = { citizen: '#0A7EA4', officer: '#8B5CF6', admin: '#0D1B40' };
  const open = complaints.filter(c => ['Open', 'Escalated'].includes(c.status)).length;
  return (
    <nav style={{
      background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '0 28px',
      height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(13,27,64,.06)',
    }}>
      <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
        <div className="brand-logo" style={{ background: 'linear-gradient(135deg,#0D1B40,#1A3A8F)', color: '#fff', padding: '5px 14px', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>
          Nagar<span style={{ color: '#00C2E0' }}>Vani</span>
        </div>
        <div style={{ height: 20, width: 1, background: '#E2E8F0', flexShrink: 0 }} />
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div className="nav-title" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#1E2845', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          {sub && <div className="nav-subtitle" style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
        </div>
      </div>
      <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <LanguageSelector />
        {role === 'citizen' && <NotificationBell />}
        {role === 'admin' && (
          <div className="nav-badge" style={{ background: '#EF444420', color: '#EF4444', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
            <span style={{ width: 6, height: 6, background: '#EF4444', borderRadius: '50%', display: 'inline-block' }} />
            {open} Active
          </div>
        )}
        <div className="nav-badge" style={{ background: (roleColors[role] || '#0A7EA4') + '15', color: roleColors[role] || '#0A7EA4', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {role === 'citizen' ? '🧑‍💼' : role === 'officer' ? '👮' : '📊'} {role?.charAt(0).toUpperCase() + role?.slice(1)}
        </div>
        <button
          onClick={() => setRole('landing')}
          style={{ background: 'none', border: '1.5px solid #E2E8F0', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#64748B', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}
        >
          ← <span>{t('switchRole')}</span>
        </button>
      </div>
    </nav>
  );
}

export function timeAgo(ts) {
  const d = (Date.now() - ts) / 1000;
  if (d < 60) return `${~~d}s ago`;
  if (d < 3600) return `${~~(d / 60)}m ago`;
  if (d < 86400) return `${~~(d / 3600)}h ago`;
  return `${~~(d / 86400)}d ago`;
}

export function NotificationToast({ notification, onClose }) {
  if (!notification) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 80,
      right: 20,
      width: 320,
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      border: '1px solid #E2E8F0',
      zIndex: 1001,
      animation: 'notificationSlide 0.3s ease',
      overflow: 'hidden'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0A7EA4, #0891B2)',
        padding: '12px 16px',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{notification.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700 }}>New Notification</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 16,
            padding: 0,
            opacity: 0.8
          }}
        >
          ×
        </button>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{
          fontWeight: 700,
          fontSize: 13,
          color: '#1E2845',
          marginBottom: 6,
          lineHeight: 1.3
        }}>
          {notification.title}
        </div>
        <div style={{
          fontSize: 12,
          color: '#64748B',
          lineHeight: 1.4,
          marginBottom: 8
        }}>
          {notification.message}
        </div>
        {notification.ticketId && (
          <div style={{
            background: '#0A7EA415',
            color: '#0A7EA4',
            padding: '4px 8px',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
            display: 'inline-block'
          }}>
            {notification.ticketId}
          </div>
        )}
      </div>
    </div>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead, clearNotifications } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="notification-bell"
      >
        🔔
        {unreadCount > 0 && (
          <div className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#1E2845', margin: 0 }}>
                Notifications
              </h3>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
            {notifications.length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0A7EA4',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: 6
                    }}
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={clearNotifications}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#EF4444',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 6
                  }}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#94A3B8'
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No notifications yet</p>
                <p style={{ fontSize: 12 }}>We'll notify you about complaint updates</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      fontSize: 20,
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      {notification.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: '#1E2845',
                        marginBottom: 4,
                        lineHeight: 1.3
                      }}>
                        {notification.title}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: '#64748B',
                        marginBottom: 8,
                        lineHeight: 1.4
                      }}>
                        {notification.message}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        {notification.ticketId && (
                          <span style={{
                            background: '#0A7EA415',
                            color: '#0A7EA4',
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700
                          }}>
                            {notification.ticketId}
                          </span>
                        )}
                        <span style={{
                          fontSize: 10,
                          color: '#94A3B8',
                          fontWeight: 600
                        }}>
                          {timeAgo(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {showDropdown && (
        <div
          onClick={() => setShowDropdown(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
        />
      )}
    </div>
  );
}
