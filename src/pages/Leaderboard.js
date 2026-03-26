import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import leaderboardService from '../services/leaderboardService';
import NagarVaniLogo from '../components/NagarVaniLogo';
import '../styles/government-portal.css';

const Leaderboard = () => {
  const { notify } = useApp();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Load leaderboard data
  const loadLeaderboard = useCallback(async () => {
    try {
      const topCitizens = leaderboardService.getTopCitizens(10);
      const leaderboardStats = leaderboardService.getLeaderboardStats();
      const userRank = leaderboardService.getCitizenRank('citizen_001'); // Mock current user
      
      setLeaderboard(topCitizens);
      setStats(leaderboardStats);
      setCurrentUser(userRank);
      setLoading(false);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      notify('Failed to load leaderboard', 'error');
      setLoading(false);
    }
  }, [notify]);

  // Refresh leaderboard
  const refreshLeaderboard = async () => {
    setRefreshing(true);
    
    // Simulate some activity for demo
    leaderboardService.simulateActivity();
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    await loadLeaderboard();
    setRefreshing(false);
    notify('Leaderboard updated!', 'success');
  };

  useEffect(() => {
    loadLeaderboard();
    
    // Set up real-time updates simulation
    const interval = setInterval(() => {
      if (!refreshing) {
        leaderboardService.simulateActivity();
        loadLeaderboard();
      }
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [refreshing, loadLeaderboard]);

  if (loading) {
    return (
      <div className="gov-portal">
        <div className="gov-header">
          <div className="gov-header-content">
            <div className="gov-emblem">
              <NagarVaniLogo size={80} />
              <div>
                <h1 className="gov-title">NagarVani Leaderboard</h1>
                <p className="gov-subtitle">Government of India - Citizen Recognition Portal</p>
                <p className="gov-tagline">"Voice of the City" - Excellence in Civic Participation</p>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
          <div className="gov-card">
            <div className="gov-card-body" style={{ padding: '3rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid var(--gov-primary)',
                borderTop: '4px solid var(--gov-accent)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1.5rem'
              }}></div>
              <h2 style={{ color: 'var(--gov-dark)', marginBottom: '0.5rem' }}>🏆 Loading Citizen Leaderboard</h2>
              <p style={{ color: 'var(--gov-text-light)' }}>Fetching latest rankings and achievements...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gov-portal">
      {/* Government Header */}
      <div className="gov-header">
        <div className="gov-header-content">
          <div className="gov-emblem">
            <NagarVaniLogo size={80} />
            <div>
              <h1 className="gov-title">NagarVani Leaderboard</h1>
              <p className="gov-subtitle">Government of India - Citizen Recognition Portal</p>
              <p className="gov-tagline">"Voice of the City" - Honoring Outstanding Civic Participation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Government Navigation */}
      <div className="gov-nav">
        <div className="gov-nav-content">
          <div className="gov-nav-brand">
            <NagarVaniLogo size={32} />
            Citizen Leaderboard
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              onClick={refreshLeaderboard}
              disabled={refreshing}
              className={`gov-btn ${refreshing ? 'gov-btn-secondary' : 'gov-btn-primary'}`}
              style={{ opacity: refreshing ? 0.6 : 1 }}
            >
              <span style={{ 
                display: 'inline-block',
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                marginRight: '0.5rem'
              }}>🔄</span>
              {refreshing ? 'Updating...' : 'Refresh Rankings'}
            </button>
            <button onClick={() => navigate('/citizen')} className="gov-btn gov-btn-secondary">
              ← Back to Portal
            </button>
            <button onClick={() => navigate('/')} className="gov-btn gov-btn-outline">
              🏠 Home
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Government Statistics Overview */}
        <div className="gov-stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="gov-stat-card">
            <h3 className="gov-stat-number">👥 {stats.totalCitizens}</h3>
            <p className="gov-stat-label">Active Citizens</p>
          </div>
          <div className="gov-stat-card">
            <h3 className="gov-stat-number">📝 {stats.totalComplaints}</h3>
            <p className="gov-stat-label">Total Complaints</p>
          </div>
          <div className="gov-stat-card">
            <h3 className="gov-stat-number">✅ {stats.totalResolved}</h3>
            <p className="gov-stat-label">Resolved Issues</p>
          </div>
          <div className="gov-stat-card">
            <h3 className="gov-stat-number">📊 {stats.resolutionRate}%</h3>
            <p className="gov-stat-label">Resolution Rate</p>
          </div>
        </div>

        {/* Current User Rank */}
        {currentUser && (
          <div className="gov-card" style={{ marginBottom: '2rem' }}>
            <div className="gov-card-header">
              <h3 className="gov-card-title">
                <div className="gov-card-icon">👤</div>
                Your Current Ranking
              </h3>
              <div className="gov-badge gov-badge-success">
                <span style={{ marginRight: '0.5rem' }}>{currentUser.badge.icon}</span>
                {currentUser.badge.name}
              </div>
            </div>
            <div className="gov-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--gov-primary)', marginBottom: '0.5rem' }}>
                    #{currentUser.rank}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gov-text-light)' }}>
                    out of {currentUser.totalCitizens} citizens
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--gov-accent)', marginBottom: '0.5rem' }}>
                    {currentUser.score}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gov-text-light)' }}>
                    Total Points
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gov-secondary)', marginBottom: '0.5rem' }}>
                    {currentUser.complaints_filed}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gov-text-light)' }}>
                    Complaints Filed
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gov-success)', marginBottom: '0.5rem' }}>
                    {currentUser.complaints_resolved}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gov-text-light)' }}>
                    Issues Resolved
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gov-primary)', marginBottom: '0.5rem' }}>
                    Lv.{currentUser.level}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gov-text-light)' }}>
                    Current Level
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Citizens Leaderboard */}
        <div className="gov-card">
          <div className="gov-card-header">
            <h3 className="gov-card-title">
              <div className="gov-card-icon">🏅</div>
              Top 10 Civic Champions
            </h3>
            <div style={{ fontSize: '0.875rem', color: 'var(--gov-text-light)' }}>
              Recognizing excellence in citizen participation
            </div>
          </div>
          <div className="gov-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {leaderboard.map((citizen, index) => (
                <div 
                  key={citizen.id} 
                  className="gov-card"
                  style={{
                    background: index < 3 ? 'linear-gradient(135deg, var(--gov-accent), #ffd700)' : '#f8fafc',
                    border: currentUser?.user_id === citizen.user_id ? '3px solid var(--gov-success)' : '1px solid #e2e8f0',
                    position: 'relative'
                  }}
                >
                  <div className="gov-card-body" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      {/* Rank Display */}
                      <div style={{
                        width: '80px',
                        height: '80px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: index < 3 ? '2.5rem' : '1.5rem',
                        fontWeight: '900',
                        background: index < 3 ? 'rgba(255, 255, 255, 0.9)' : 'var(--gov-primary)',
                        color: index < 3 ? 'var(--gov-dark)' : 'white',
                        borderRadius: '50%',
                        border: '3px solid var(--gov-primary)'
                      }}>
                        {citizen.medal || `#${citizen.rank}`}
                      </div>
                      
                      {/* Citizen Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div>
                            <h4 style={{ 
                              margin: '0 0 0.5rem 0', 
                              fontSize: '1.5rem', 
                              fontWeight: '700',
                              color: index < 3 ? 'var(--gov-dark)' : 'var(--gov-dark)'
                            }}>
                              {citizen.name}
                            </h4>
                            <div className="gov-badge gov-badge-primary" style={{ fontSize: '0.875rem' }}>
                              <span style={{ marginRight: '0.5rem' }}>{citizen.badge.icon}</span>
                              {citizen.badge.name}
                            </div>
                          </div>
                          
                          {/* Score Display */}
                          <div style={{
                            textAlign: 'center',
                            padding: '1rem 1.5rem',
                            background: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '12px',
                            border: '2px solid var(--gov-primary)'
                          }}>
                            <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--gov-primary)' }}>
                              {citizen.score}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gov-text-light)', fontWeight: '600' }}>
                              POINTS
                            </div>
                          </div>
                        </div>
                        
                        {/* Performance Stats */}
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                          gap: '1rem',
                          fontSize: '0.875rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>📝</span>
                            <span style={{ fontWeight: '600', color: 'var(--gov-dark)' }}>
                              {citizen.complaints_filed} Filed
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>✅</span>
                            <span style={{ fontWeight: '600', color: 'var(--gov-success)' }}>
                              {citizen.complaints_resolved} Resolved
                            </span>
                          </div>
                          {citizen.volunteer_tasks_completed > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '1.2rem' }}>🤝</span>
                              <span style={{ fontWeight: '600', color: '#8B5CF6' }}>
                                {citizen.volunteer_tasks_completed} Volunteer Tasks
                              </span>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>⭐</span>
                            <span style={{ fontWeight: '600', color: 'var(--gov-accent)' }}>
                              Level {citizen.level}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Special Indicators */}
                    {index === 0 && (
                      <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '2rem' }}>👑</div>
                    )}
                    {index < 3 && (
                      <div style={{ position: 'absolute', top: '1rem', right: index === 0 ? '4rem' : '1rem', fontSize: '1.5rem' }}>✨</div>
                    )}
                    {currentUser?.user_id === citizen.user_id && (
                      <div className="gov-badge gov-badge-success" style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                        You
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scoring System Information */}
        <div className="gov-card" style={{ marginTop: '2rem' }}>
          <div className="gov-card-header">
            <h3 className="gov-card-title">
              <div className="gov-card-icon">🎯</div>
              Point System & Rewards
            </h3>
          </div>
          <div className="gov-card-body">
            <div className="gov-alert gov-alert-info" style={{ marginBottom: '1.5rem' }}>
              <div>
                <strong>🏛️ Government Recognition Program:</strong> Earn points for active civic participation and help build a better community. Your contributions make a difference!
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              {[
                { points: '+10', action: 'Complaint Filed', icon: '📝', color: 'var(--gov-primary)' },
                { points: '+20', action: 'Issue Resolved', icon: '✅', color: 'var(--gov-success)' },
                { points: '+30', action: 'High Priority Bonus', icon: '⚡', color: 'var(--gov-accent)' },
                { points: '+50', action: 'Critical Priority Bonus', icon: '🚨', color: 'var(--gov-error)' }
              ].map((item, index) => (
                <div key={index} className="gov-service-card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: item.color,
                      color: 'white',
                      borderRadius: '50%',
                      fontSize: '1.5rem'
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: item.color }}>
                        {item.points}
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gov-dark)' }}>
                        {item.action}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;