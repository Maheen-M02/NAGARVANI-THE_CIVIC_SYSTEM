// Leaderboard Service - Handles scoring and ranking logic
class LeaderboardService {
  constructor() {
    this.leaderboard = [
      // Mock data for demonstration
      { id: 1, user_id: 'citizen_001', name: 'Arjun Mehta', role: 'citizen', score: 180, complaints_filed: 8, complaints_resolved: 4, updated_at: Date.now() - 86400000 },
      { id: 2, user_id: 'citizen_002', name: 'Sunita Devi', role: 'citizen', score: 165, complaints_filed: 7, complaints_resolved: 3, updated_at: Date.now() - 172800000 },
      { id: 3, user_id: 'citizen_003', name: 'Mohammed Iqbal', role: 'citizen', score: 150, complaints_filed: 6, complaints_resolved: 3, updated_at: Date.now() - 259200000 },
      { id: 4, user_id: 'citizen_004', name: 'Lakshmi Krishnan', role: 'citizen', score: 140, complaints_filed: 5, complaints_resolved: 4, updated_at: Date.now() - 345600000 },
      { id: 5, user_id: 'citizen_005', name: 'Ravi Shankar', role: 'citizen', score: 125, complaints_filed: 5, complaints_resolved: 2, updated_at: Date.now() - 432000000 },
      { id: 6, user_id: 'citizen_006', name: 'Geeta Verma', role: 'citizen', score: 110, complaints_filed: 4, complaints_resolved: 3, updated_at: Date.now() - 518400000 },
      { id: 7, user_id: 'citizen_007', name: 'Deepak Joshi', role: 'citizen', score: 95, complaints_filed: 4, complaints_resolved: 1, updated_at: Date.now() - 604800000 },
      { id: 8, user_id: 'citizen_008', name: 'Ananya Roy', role: 'citizen', score: 85, complaints_filed: 3, complaints_resolved: 2, updated_at: Date.now() - 691200000 },
      { id: 9, user_id: 'citizen_009', name: 'Pradeep Nair', role: 'citizen', score: 70, complaints_filed: 3, complaints_resolved: 1, updated_at: Date.now() - 777600000 },
      { id: 10, user_id: 'citizen_010', name: 'Meena Gupta', role: 'citizen', score: 60, complaints_filed: 2, complaints_resolved: 2, updated_at: Date.now() - 864000000 },
    ];
    
    // Scoring system constants
    this.POINTS = {
      COMPLAINT_SUBMITTED: 10,
      COMPLAINT_RESOLVED: 20,
      HIGH_PRIORITY_BONUS: 30,
      CRITICAL_PRIORITY_BONUS: 50
    };
  }

  /**
   * Get top citizens leaderboard
   * @param {number} limit - Number of top citizens to return (default: 10)
   * @returns {Array} Sorted leaderboard data
   */
  getTopCitizens(limit = 10) {
    return this.leaderboard
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((citizen, index) => ({
        ...citizen,
        rank: index + 1,
        medal: this.getMedal(index + 1),
        badge: this.getBadge(citizen.score),
        level: this.getLevel(citizen.score)
      }));
  }

  /**
   * Get citizen's current rank and stats
   * @param {string} userId - Citizen's user ID
   * @returns {Object} Citizen's ranking information
   */
  getCitizenRank(userId) {
    const sortedLeaderboard = this.leaderboard.sort((a, b) => b.score - a.score);
    const citizenIndex = sortedLeaderboard.findIndex(c => c.user_id === userId);
    
    if (citizenIndex === -1) {
      return null;
    }

    const citizen = sortedLeaderboard[citizenIndex];
    return {
      ...citizen,
      rank: citizenIndex + 1,
      medal: this.getMedal(citizenIndex + 1),
      badge: this.getBadge(citizen.score),
      level: this.getLevel(citizen.score),
      totalCitizens: this.leaderboard.length
    };
  }

  /**
   * Add points for complaint submission
   * @param {string} userId - Citizen's user ID
   * @param {string} priority - Complaint priority (Low, Medium, High, Critical)
   * @returns {Object} Updated citizen data
   */
  addComplaintPoints(userId, priority = 'Medium') {
    let points = this.POINTS.COMPLAINT_SUBMITTED;
    
    // Add bonus points for high priority complaints
    if (priority === 'High') {
      points += this.POINTS.HIGH_PRIORITY_BONUS;
    } else if (priority === 'Critical') {
      points += this.POINTS.CRITICAL_PRIORITY_BONUS;
    }

    return this.updateCitizenScore(userId, points, 'complaint_filed');
  }

  /**
   * Add points for complaint resolution
   * @param {string} userId - Citizen's user ID
   * @returns {Object} Updated citizen data
   */
  addResolutionPoints(userId) {
    return this.updateCitizenScore(userId, this.POINTS.COMPLAINT_RESOLVED, 'complaint_resolved');
  }

  /**
   * Update citizen's score and stats
   * @param {string} userId - Citizen's user ID
   * @param {number} points - Points to add
   * @param {string} action - Type of action (complaint_filed, complaint_resolved)
   * @returns {Object} Updated citizen data
   */
  updateCitizenScore(userId, points, action) {
    const citizenIndex = this.leaderboard.findIndex(c => c.user_id === userId);
    
    if (citizenIndex === -1) {
      // Create new citizen entry if not exists
      const newCitizen = {
        id: this.leaderboard.length + 1,
        user_id: userId,
        name: `Citizen ${userId.slice(-3)}`, // Fallback name
        role: 'citizen',
        score: points,
        complaints_filed: action === 'complaint_filed' ? 1 : 0,
        complaints_resolved: action === 'complaint_resolved' ? 1 : 0,
        updated_at: Date.now()
      };
      this.leaderboard.push(newCitizen);
      return newCitizen;
    }

    // Update existing citizen
    const citizen = this.leaderboard[citizenIndex];
    citizen.score += points;
    citizen.updated_at = Date.now();
    
    if (action === 'complaint_filed') {
      citizen.complaints_filed += 1;
    } else if (action === 'complaint_resolved') {
      citizen.complaints_resolved += 1;
    }

    this.leaderboard[citizenIndex] = citizen;
    return citizen;
  }

  /**
   * Get medal emoji for rank
   * @param {number} rank - Citizen's rank
   * @returns {string} Medal emoji or empty string
   */
  getMedal(rank) {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  }

  /**
   * Get badge based on score
   * @param {number} score - Citizen's total score
   * @returns {Object} Badge information
   */
  getBadge(score) {
    if (score >= 200) return { name: 'Champion', icon: '👑', color: '#FFD700' };
    if (score >= 150) return { name: 'Hero', icon: '🦸', color: '#FF6B35' };
    if (score >= 100) return { name: 'Guardian', icon: '🛡️', color: '#4ECDC4' };
    if (score >= 50) return { name: 'Helper', icon: '🤝', color: '#45B7D1' };
    return { name: 'Newcomer', icon: '🌟', color: '#96CEB4' };
  }

  /**
   * Get level based on score
   * @param {number} score - Citizen's total score
   * @returns {number} Citizen's level
   */
  getLevel(score) {
    return Math.floor(score / 25) + 1;
  }

  /**
   * Get leaderboard statistics
   * @returns {Object} Overall leaderboard stats
   */
  getLeaderboardStats() {
    const totalCitizens = this.leaderboard.length;
    const totalScore = this.leaderboard.reduce((sum, citizen) => sum + citizen.score, 0);
    const totalComplaints = this.leaderboard.reduce((sum, citizen) => sum + citizen.complaints_filed, 0);
    const totalResolved = this.leaderboard.reduce((sum, citizen) => sum + citizen.complaints_resolved, 0);
    
    return {
      totalCitizens,
      totalScore,
      totalComplaints,
      totalResolved,
      averageScore: Math.round(totalScore / totalCitizens),
      resolutionRate: Math.round((totalResolved / totalComplaints) * 100)
    };
  }

  /**
   * Simulate real-time updates (for demo purposes)
   */
  simulateActivity() {
    // Randomly update some citizens' scores
    const randomCitizen = this.leaderboard[Math.floor(Math.random() * this.leaderboard.length)];
    const actions = ['complaint_filed', 'complaint_resolved'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    if (action === 'complaint_filed') {
      const priorities = ['Low', 'Medium', 'High', 'Critical'];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      this.addComplaintPoints(randomCitizen.user_id, priority);
    } else {
      this.addResolutionPoints(randomCitizen.user_id);
    }
    
    return randomCitizen;
  }
}

// Export singleton instance
const leaderboardService = new LeaderboardService();
export default leaderboardService;