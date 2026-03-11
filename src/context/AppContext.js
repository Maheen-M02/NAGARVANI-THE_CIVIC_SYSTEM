import React, { createContext, useContext, useState, useCallback } from 'react';
import { SEED_COMPLAINTS } from '../data/seed';
import { aiTriage } from '../data/aiTriage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [complaints, setComplaints] = useState(SEED_COMPLAINTS);
  const [role, setRole] = useState('landing');
  const [notif, setNotif] = useState(null);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'complaint_created',
      title: 'Complaint Filed Successfully',
      message: 'Your complaint "Large pothole on MG Road causing accidents" has been filed and assigned ticket ID NV-001',
      ticketId: 'NV-001',
      icon: '📝',
      priority: 'High',
      department: 'PWD Roads',
      timestamp: Date.now() - 8 * 3600000,
      read: false
    },
    {
      id: 2,
      type: 'status_update',
      title: 'Work Started on Your Complaint',
      message: 'Your complaint "Large pothole on MG Road causing accidents" is now being worked on by our team',
      ticketId: 'NV-001',
      icon: '🔧',
      priority: 'High',
      department: 'PWD Roads',
      timestamp: Date.now() - 2 * 3600000,
      read: false
    },
    {
      id: 3,
      type: 'complaint_resolved',
      title: 'Complaint Resolved!',
      message: 'Great news! Your complaint "Garbage not collected for 5 days" has been successfully resolved',
      ticketId: 'NV-004',
      icon: '✅',
      priority: 'Medium',
      department: 'Sanitation',
      timestamp: Date.now() - 4 * 3600000,
      read: true
    }
  ]);
  const [unreadCount, setUnreadCount] = useState(2);

  const notify = useCallback((msg, type = 'success') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3200);
  }, []);

  const addNotification = useCallback((notification) => {
    const newNotif = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      read: false,
      ...notification
    };
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const submitComplaint = useCallback((form) => {
    const t = aiTriage(form.description + ' ' + form.title, form.photo);
    const complaint = {
      id: t.ticketId,
      ticketId: t.ticketId,
      ...form,
      category: t.category,
      dept: t.department.id,
      priority: t.priority,
      status: 'Open',
      officer: t.officer?.id,
      slaHours: t.slaHours,
      confidence: t.confidence,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lat: null,
      lng: null,
      updates: [
        { time: Date.now(), msg: `AI triage: "${t.category}" — ${t.confidence}% confidence`, by: 'NagarVani AI' },
        { time: Date.now(), msg: `Auto-routed to ${t.department.name}. Officer ${t.officer?.name || 'TBD'} assigned. SLA: ${t.slaHours}hrs`, by: 'NagarVani AI' },
      ],
      triageData: t,
    };
    
    // Add notification for new complaint
    addNotification({
      type: 'complaint_created',
      title: 'Complaint Filed Successfully',
      message: `Your complaint "${complaint.title}" has been filed and assigned ticket ID ${complaint.ticketId}`,
      ticketId: complaint.ticketId,
      icon: '📝',
      priority: complaint.priority,
      department: t.department.name
    });
    
    setComplaints(prev => [complaint, ...prev]);
    return complaint;
  }, [addNotification]);

  const updateComplaint = useCallback((id, status, note, by) => {
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) return;

    // Add notification for status changes
    const statusNotifications = {
      'In Progress': {
        type: 'status_update',
        title: 'Work Started on Your Complaint',
        message: `Your complaint "${complaint.title}" is now being worked on by our team`,
        icon: '🔧',
      },
      'Resolved': {
        type: 'complaint_resolved',
        title: 'Complaint Resolved!',
        message: `Great news! Your complaint "${complaint.title}" has been successfully resolved`,
        icon: '✅',
      },
      'Escalated': {
        type: 'status_update',
        title: 'Complaint Escalated',
        message: `Your complaint "${complaint.title}" has been escalated for priority handling`,
        icon: '⚠️',
      }
    };

    if (statusNotifications[status]) {
      addNotification({
        ...statusNotifications[status],
        ticketId: complaint.ticketId,
        priority: complaint.priority,
        department: complaint.dept
      });
    }

    setComplaints(prev => prev.map(c =>
      c.id !== id ? c : {
        ...c,
        status,
        updatedAt: Date.now(),
        updates: [...c.updates, { time: Date.now(), msg: note || `Status → ${status}`, by: by || 'Officer' }],
      }
    ));
  }, [complaints, addNotification]);

  return (
    <AppContext.Provider value={{ 
      complaints, 
      role, 
      setRole, 
      notif, 
      notify, 
      submitComplaint, 
      updateComplaint,
      notifications,
      unreadCount,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
