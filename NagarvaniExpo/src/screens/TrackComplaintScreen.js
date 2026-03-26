import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
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

const TrackComplaintScreen = ({ navigation }) => {
  const { complaints, notify, addNotification } = useApp();
  const [trackId, setTrackId] = useState('');
  const [tracked, setTracked] = useState(null);

  const doTrack = () => {
    const complaint = complaints.find(c => 
      c.ticketId === trackId.toUpperCase() || c.ticketId === trackId
    );
    
    if (complaint) {
      setTracked(complaint);
      addNotification({
        type: 'track_details',
        title: 'Complaint Details Viewed',
        message: `You viewed details for complaint "${complaint.title}" (${complaint.ticketId})`,
        ticketId: complaint.ticketId,
        icon: '👁️',
        priority: complaint.priority,
        department: complaint.dept
      });
    } else {
      notify('Not found. Try NV-001 through NV-012.', 'error');
    }
  };

  const renderComplaintDetails = (complaint) => {
    const department = DEPARTMENTS.find(d => d.id === complaint.dept);
    
    return (
      <View style={styles.detailsCard}>
        <View style={styles.detailsHeader}>
          <Text style={styles.ticketId}>{complaint.ticketId}</Text>
          <StatusBadge status={complaint.status} />
        </View>
        
        <Text style={styles.complaintTitle}>{complaint.title}</Text>
        <Text style={styles.complaintDescription}>{complaint.description}</Text>
        
        <View style={styles.metaInfo}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>📍 Location:</Text>
            <Text style={styles.metaValue}>{complaint.location}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>🏛️ Department:</Text>
            <Text style={styles.metaValue}>
              {department?.icon} {department?.name}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>⚡ Priority:</Text>
            <Text style={styles.metaValue}>{complaint.priority}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>📅 Filed:</Text>
            <Text style={styles.metaValue}>{timeAgo(complaint.createdAt)}</Text>
          </View>
          {complaint.slaHours && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>⏱️ SLA:</Text>
              <Text style={styles.metaValue}>{complaint.slaHours} hours</Text>
            </View>
          )}
        </View>

        {complaint.updates && complaint.updates.length > 0 && (
          <View style={styles.updatesSection}>
            <Text style={styles.updatesTitle}>📋 Status Updates</Text>
            {complaint.updates.map((update, index) => (
              <View key={index} style={styles.updateItem}>
                <View style={styles.updateDot} />
                <View style={styles.updateContent}>
                  <Text style={styles.updateMessage}>{update.msg}</Text>
                  <Text style={styles.updateMeta}>
                    {update.by} • {timeAgo(update.time)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {complaint.triageData && (
          <View style={styles.aiSection}>
            <Text style={styles.aiTitle}>🤖 AI Analysis</Text>
            <View style={styles.aiGrid}>
              <View style={styles.aiItem}>
                <Text style={styles.aiLabel}>Category</Text>
                <Text style={styles.aiValue}>{complaint.category}</Text>
              </View>
              <View style={styles.aiItem}>
                <Text style={styles.aiLabel}>Confidence</Text>
                <Text style={styles.aiValue}>{complaint.confidence}%</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Track Complaint</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔍 Track Your Complaint</Text>
          <Text style={styles.cardSubtitle}>
            Enter your ticket ID. Try: NV-001 through NV-012
          </Text>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="e.g. NV-001"
              value={trackId}
              onChangeText={setTrackId}
              onSubmitEditing={doTrack}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.searchButton} onPress={doTrack}>
              <Text style={styles.searchButtonText}>Track →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {tracked && renderComplaintDetails(tracked)}
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1E2845',
  },
  backButton: {
    color: '#0A7EA4',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E2845',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  searchButton: {
    backgroundColor: '#0A7EA4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ticketId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A7EA4',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  complaintTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E2845',
    marginBottom: 8,
  },
  complaintDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
  },
  metaInfo: {
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 14,
    color: '#64748B',
    width: 100,
  },
  metaValue: {
    fontSize: 14,
    color: '#1E2845',
    fontWeight: '600',
    flex: 1,
  },
  updatesSection: {
    marginBottom: 20,
  },
  updatesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E2845',
    marginBottom: 12,
  },
  updateItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  updateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0A7EA4',
    marginTop: 6,
    marginRight: 12,
  },
  updateContent: {
    flex: 1,
  },
  updateMessage: {
    fontSize: 14,
    color: '#1E2845',
    marginBottom: 4,
  },
  updateMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  aiSection: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E2845',
    marginBottom: 12,
  },
  aiGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  aiItem: {
    flex: 1,
  },
  aiLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  aiValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E2845',
  },
});

export default TrackComplaintScreen;