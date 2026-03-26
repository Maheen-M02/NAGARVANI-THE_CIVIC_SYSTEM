// Test script for Leaderboard functionality
// Run with: node test_leaderboard.js

const leaderboardService = require('./src/services/leaderboardService.js').default;

console.log('🏆 Testing NagarVani Leaderboard System\n');

// Test 1: Get initial leaderboard
console.log('📊 Initial Top 10 Citizens:');
const topCitizens = leaderboardService.getTopCitizens(10);
topCitizens.forEach((citizen, index) => {
  console.log(`${citizen.rank}. ${citizen.medal || '#' + citizen.rank} ${citizen.name} - ${citizen.score} points (${citizen.badge.icon} ${citizen.badge.name})`);
});

console.log('\n📈 Leaderboard Statistics:');
const stats = leaderboardService.getLeaderboardStats();
console.log(`Total Citizens: ${stats.totalCitizens}`);
console.log(`Total Complaints: ${stats.totalComplaints}`);
console.log(`Total Resolved: ${stats.totalResolved}`);
console.log(`Resolution Rate: ${stats.resolutionRate}%`);
console.log(`Average Score: ${stats.averageScore}`);

// Test 2: Get specific citizen rank
console.log('\n👤 Current User Rank:');
const userRank = leaderboardService.getCitizenRank('citizen_001');
if (userRank) {
  console.log(`${userRank.name} is ranked #${userRank.rank} out of ${userRank.totalCitizens} citizens`);
  console.log(`Score: ${userRank.score} points | Level: ${userRank.level} | Badge: ${userRank.badge.icon} ${userRank.badge.name}`);
  console.log(`Activity: ${userRank.complaints_filed} filed, ${userRank.complaints_resolved} resolved`);
}

// Test 3: Add complaint points
console.log('\n➕ Testing Point Addition:');
console.log('Filing a High priority complaint...');
const updatedCitizen = leaderboardService.addComplaintPoints('citizen_001', 'High');
console.log(`Points added! New score: ${updatedCitizen.score} (+40 points for High priority)`);

// Test 4: Add resolution points
console.log('\nResolving a complaint...');
const resolvedCitizen = leaderboardService.addResolutionPoints('citizen_001');
console.log(`Resolution bonus! New score: ${resolvedCitizen.score} (+20 points)`);

// Test 5: Check updated leaderboard
console.log('\n🔄 Updated Top 5 Citizens:');
const updatedTop = leaderboardService.getTopCitizens(5);
updatedTop.forEach((citizen, index) => {
  const highlight = citizen.user_id === 'citizen_001' ? ' ⭐ (YOU)' : '';
  console.log(`${citizen.rank}. ${citizen.medal || '#' + citizen.rank} ${citizen.name} - ${citizen.score} points${highlight}`);
});

// Test 6: Badge system
console.log('\n🎖️ Badge System Test:');
const testScores = [25, 75, 125, 175, 225];
testScores.forEach(score => {
  const badge = leaderboardService.getBadge(score);
  const level = leaderboardService.getLevel(score);
  console.log(`Score ${score}: Level ${level} - ${badge.icon} ${badge.name}`);
});

// Test 7: Simulate activity
console.log('\n🎲 Simulating Random Activity:');
for (let i = 0; i < 3; i++) {
  const randomCitizen = leaderboardService.simulateActivity();
  console.log(`Activity simulated for ${randomCitizen.name}`);
}

console.log('\n✅ Leaderboard testing complete!');
console.log('\n🚀 Ready to launch the gamification feature!');

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { leaderboardService };
}