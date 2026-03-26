import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import MobileBottomNav from './components/MobileBottomNav';
import Landing from './pages/Landing';
import CitizenPortal from './pages/CitizenPortal';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Leaderboard from './pages/Leaderboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import Toast from './components/Toast';
import './styles/global.css';
import './styles/mobile.css';
import './i18n'; // Initialize i18n

function AppRoutes() {
  const { role, user } = useApp();

  return (
    <Routes>
      {/* Landing page - accessible to everyone */}
      <Route path="/" element={<Landing />} />
      
      {/* Citizen Portal Routes - only for citizens */}
      <Route 
        path="/citizen" 
        element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <CitizenPortal />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/citizen/file" 
        element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <CitizenPortal />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/citizen/track" 
        element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <CitizenPortal />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/citizen/success" 
        element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <CitizenPortal />
          </ProtectedRoute>
        } 
      />
      
      {/* Leaderboard - accessible to all authenticated users */}
      <Route 
        path="/leaderboard" 
        element={
          <ProtectedRoute allowedRoles={['citizen', 'officer', 'admin']}>
            <Leaderboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Volunteer Dashboard - only for citizens who are volunteers */}
      <Route 
        path="/volunteer" 
        element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <VolunteerDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Officer Portal Routes - only for officers */}
      <Route 
        path="/officer" 
        element={
          <ProtectedRoute allowedRoles={['officer']}>
            <OfficerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/officer/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['officer']}>
            <OfficerDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin Portal Routes - only for admins */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Auto-redirect to appropriate portal based on role */}
      <Route path="/portal" element={
        !user ? <Navigate to="/" replace /> :
        role === 'citizen' ? <Navigate to="/citizen" replace /> :
        role === 'officer' ? <Navigate to="/officer" replace /> :
        role === 'admin' ? <Navigate to="/admin" replace /> :
        <Navigate to="/" replace />
      } />
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppProvider>
        <Toast />
        <AppRoutes />
        <MobileBottomNav />
      </AppProvider>
    </Router>
  );
}
