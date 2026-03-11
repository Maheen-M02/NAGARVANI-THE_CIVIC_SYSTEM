import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Landing from './pages/Landing';
import CitizenPortal from './pages/CitizenPortal';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Toast from './components/Toast';
import './styles/global.css';
import './i18n'; // Initialize i18n

function Router() {
  const { role } = useApp();
  if (role === 'citizen') return <CitizenPortal />;
  if (role === 'officer') return <OfficerDashboard />;
  if (role === 'admin') return <AdminDashboard />;
  return <Landing />;
}

export default function App() {
  return (
    <AppProvider>
      <Toast />
      <Router />
    </AppProvider>
  );
}
