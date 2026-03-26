import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import NagarVaniLogo from './NagarVaniLogo';
import '../styles/auth-modal.css';

const AuthModal = ({ isOpen, onClose, defaultMode = 'signin' }) => {
  const { signIn, signUp, notify } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState(defaultMode);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'citizen',
    isVolunteer: false,
    volunteerRole: 'citizen'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        console.log('AuthModal: Attempting sign in...');
        const result = await signIn(formData.email, formData.password);
        console.log('AuthModal: Sign in result:', result);
        
        if (result.success) {
          onClose();
          const userRole = result.user?.user_metadata?.role || 'citizen';
          console.log('AuthModal: Navigating to portal for role:', userRole);
          
          if (userRole === 'citizen') {
            navigate('/citizen');
          } else if (userRole === 'officer') {
            navigate('/officer');
          } else if (userRole === 'admin') {
            navigate('/admin');
          }
        } else {
          console.error('AuthModal: Sign in failed:', result.error);
          if (result.error.includes('Invalid login credentials')) {
            notify('Invalid email or password. If you just signed up, please check your email for confirmation or try creating your account in the Supabase Dashboard.', 'error');
          } else if (result.error.includes('Email not confirmed')) {
            notify('Please check your email and click the confirmation link before signing in.', 'error');
          } else {
            notify(result.error, 'error');
          }
        }
      } else {
        console.log('AuthModal: Attempting sign up...');
        const result = await signUp(formData.email, formData.password, {
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          isVolunteer: formData.isVolunteer,
          volunteerRole: formData.volunteerRole,
          is_volunteer: formData.isVolunteer, // Also store in metadata
          volunteer_role: formData.volunteerRole // Also store in metadata
        });
        console.log('AuthModal: Sign up result:', result);
        
        if (result.success) {
          if (result.message.includes('already exists')) {
            notify('Account already exists. Please sign in instead.', 'error');
            setMode('signin');
          } else {
            setMode('signin');
            notify('Account created! You can now sign in.', 'success');
          }
        } else {
          console.error('AuthModal: Sign up failed:', result.error);
          if (result.error.includes('rate limit')) {
            notify('⚠️ Rate limit exceeded. Please create your account directly in Supabase Dashboard (Authentication → Users → Add User) or wait 1 hour.', 'error');
          } else if (result.error.includes('already exists')) {
            notify('Account already exists. Please sign in instead.', 'error');
            setMode('signin');
          } else {
            notify(result.error, 'error');
          }
        }
      }
    } catch (error) {
      console.error('AuthModal: Exception:', error);
      notify('Authentication failed: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-container">
        {/* Close button */}
        <button onClick={onClose} className="auth-modal-close">
          ×
        </button>

        {/* Left Side - Branding */}
        <div className="auth-modal-branding">
          <div className="auth-branding-content">
            <div className="auth-logo-container">
              <NagarVaniLogo size={80} />
            </div>
            <h1 className="auth-brand-title">NagarVani</h1>
            <p className="auth-brand-subtitle">Your Voice, Our Priority</p>
            <div className="auth-brand-divider"></div>
            <p className="auth-brand-description">
              Empowering citizens to report civic issues and track their resolution in real-time. 
              Join thousands of citizens making their city better.
            </p>
            <div className="auth-brand-features">
              <div className="auth-feature-item">
                <span className="auth-feature-icon">📸</span>
                <span className="auth-feature-text">AI-Powered Issue Detection</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-icon">📍</span>
                <span className="auth-feature-text">GPS Auto-Tagging</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-icon">🏆</span>
                <span className="auth-feature-text">Citizen Leaderboard</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-icon">⚡</span>
                <span className="auth-feature-text">Real-Time Updates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-modal-form">
          <div className="auth-form-content">
            <div className="auth-form-header">
              <h2 className="auth-form-title">
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="auth-form-subtitle">
                {mode === 'signin' 
                  ? 'Sign in to access your portal' 
                  : 'Join NagarVani to make your voice heard'
                }
              </p>
            </div>

            {mode === 'signin' && (
              <div className="auth-info-banner">
                <span className="auth-info-icon">💡</span>
                <span className="auth-info-text">
                  <strong>First time?</strong> Click "Create Account" below to sign up.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'signup' && (
                <>
                  <div className="auth-form-group">
                    <label className="auth-label">
                      <span className="auth-label-icon">👤</span>
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="auth-input"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="auth-form-group">
                    <label className="auth-label">
                      <span className="auth-label-icon">📱</span>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="auth-input"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div className="auth-form-group">
                    <label className="auth-label">
                      <span className="auth-label-icon">🎭</span>
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="auth-input auth-select"
                    >
                      <option value="citizen">Citizen</option>
                      <option value="officer">Officer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Volunteer Opt-in */}
                  <div className="auth-form-group" style={{ 
                    background: 'linear-gradient(135deg, #8B5CF615 0%, #6366F115 100%)', 
                    padding: '1rem', 
                    borderRadius: '12px',
                    border: '2px solid #8B5CF630'
                  }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem', 
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      <input
                        type="checkbox"
                        name="isVolunteer"
                        checked={formData.isVolunteer}
                        onChange={handleInputChange}
                        style={{ 
                          width: '20px', 
                          height: '20px', 
                          cursor: 'pointer',
                          accentColor: '#8B5CF6'
                        }}
                      />
                      <span style={{ flex: 1 }}>
                        <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>🤝</span>
                        I want to volunteer for civic help
                      </span>
                    </label>
                    {formData.isVolunteer && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #8B5CF630' }}>
                        <label className="auth-label">
                          <span className="auth-label-icon">🎯</span>
                          Volunteer Type
                        </label>
                        <select
                          name="volunteerRole"
                          value={formData.volunteerRole}
                          onChange={handleInputChange}
                          className="auth-input auth-select"
                        >
                          <option value="citizen">Individual Citizen</option>
                          <option value="student">Student Group</option>
                          <option value="ngo">NGO/Organization</option>
                        </select>
                        <p style={{ 
                          fontSize: '0.75rem', 
                          color: '#8B5CF6', 
                          marginTop: '0.5rem',
                          lineHeight: '1.4'
                        }}>
                          ✨ Help your community by responding to nearby civic issues. Earn points and badges!
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="auth-form-group">
                <label className="auth-label">
                  <span className="auth-label-icon">✉️</span>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="auth-input"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">
                  <span className="auth-label-icon">🔒</span>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="auth-input"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-submit-btn"
              >
                {loading ? (
                  <>
                    <span className="auth-spinner"></span>
                    Please wait...
                  </>
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                    <span className="auth-btn-arrow">→</span>
                  </>
                )}
              </button>
            </form>

            <div className="auth-form-footer">
              <div className="auth-divider">
                <span className="auth-divider-text">or</span>
              </div>
              <p className="auth-switch-text">
                {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
              </p>
              <button
                type="button"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="auth-switch-btn"
              >
                {mode === 'signin' ? 'Create Account' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;