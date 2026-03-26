import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useApp();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#F0F4FA'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #0D1B40',
            borderTop: '4px solid #00C2E0',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to landing page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If user doesn't have the required role, redirect to their appropriate portal
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to user's appropriate portal
    if (role === 'citizen') {
      return <Navigate to="/citizen" replace />;
    } else if (role === 'officer') {
      return <Navigate to="/officer" replace />;
    } else if (role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    // Fallback to landing
    return <Navigate to="/" replace />;
  }

  // User has correct role, render the component
  return children;
};

export default ProtectedRoute;
