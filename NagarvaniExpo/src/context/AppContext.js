import React, { createContext, useContext, useState, useCallback } from 'react';
import { SEED_COMPLAINTS } from '../data/seed';
import { aiTriage } from '../data/aiTriage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [complaints, setComplaints] = useState(SEED_COMPLAINTS);
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
    }
  ]);
  const [unreadCount, setUnreadCount] = useState(1);

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
      updates: [
        { time: Date.now(), msg: `AI triage: "${t.category}" — ${t.confidence}% confidence`, by: 'NagarVani AI' },
        { time: Date.now(), msg: `Auto-routed to ${t.department.name}. Officer ${t.officer?.name || 'TBD'} assigned. SLA: ${t.slaHours}hrs`, by: 'NagarVani AI' },
      ],
      triageData: t,
    };
    
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

  return (
    <AppContext.Provider value={{ 
      complaints, 
      notif, 
      notify, 
      submitComplaint,
      notifications,
      unreadCount,
      addNotification
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);