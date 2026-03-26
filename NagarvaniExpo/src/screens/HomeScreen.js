import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { DEPARTMENTS } from '../data/seed';

const StatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'Open': return '#F59E0B';
      case 'In Progress': return '#3B82F6';
      case 'Resolved': return '#22C55E';
      case 'Escalated': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
};

const timeAgo = (timestamp) => {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
};

const HomeScreen = ({ navigation }) => {
  const { complaints } = useApp();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>NagarVani</Text>
          <Text style={styles.subtitle}>Your Voice, Your City</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Your Voice Matters</Text>
          <Text style={styles.heroSubtitle}>
            Report civic issues and track their resolution
          </Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => navigation.navigate('FileComplaint')}
            >
              <Text style={styles.actionButtonIcon}>📝</Text>
              <Text style={styles.actionButtonText}>File Complaint</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.photoButton]}
              onPress={() => navigation.navigate('FileComplaint', { photoMode: true })}
            >
              <Text style={styles.actionButtonIcon}>📸</Text>
              <Text style={styles.actionButtonText}>Snap & Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => navigation.navigate('TrackComplaint')}
            >
              <Text style={styles.actionButtonIcon}>🔍</Text>
              <Text style={styles.actionButtonText}>Track Status</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Recent Activity</Text>
          {complaints.slice(0, 4).map(complaint => {
            const department = DEPARTMENTS.find(d => d.id === complaint.dept);
            return (
              <TouchableOpacity
                key={complaint.id}
                style={[styles.complaintCard, { borderLeftColor: department?.color }]}
                onPress={() => navigation.navigate('ComplaintDetails', { complaint })}
              >
                <View style={styles.complaintHeader}>
                  <Text style={styles.complaintTitle} numberOfLines={2}>
                    {complaint.title}
                  </Text>
                  <StatusBadge status={complaint.status} />
                </View>
                <Text style={styles.complaintMeta}>
                  📍 {complaint.location} • {timeAgo(complaint.createdAt)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#1E2845',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8899BB',
  },
  heroSection: {
    padding: 24,
    backgroundColor: '#1E2845',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#8899BB',
    marginBottom: 24,
    lineHeight: 20,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#F59E0B',
  },
  photoButton: {
    backgroundColor: '#22C55E',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8899BB',
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1E2845',
    marginBottom: 14,
  },
  complaintCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  complaintTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E2845',
    flex: 1,
    marginRight: 8,
  },
  complaintMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default HomeScreen;