import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { DEPARTMENTS } from '../data/seed';

const ComplaintSuccessScreen = ({ navigation, route }) => {
  const { complaint } = route.params;
  const department = DEPARTMENTS.find(d => d.id === complaint.dept);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Complaint Filed!</Text>
          
          <View style={styles.ticketContainer}>
            <Text style={styles.ticketId}>{complaint.ticketId}</Text>
          </View>
          
          <Text style={styles.successMessage}>
            Routed to <Text style={styles.bold}>{department?.name}</Text>. 
            Resolution in <Text style={styles.bold}>{complaint.slaHours}hrs</Text>. 
            SMS updates will follow.
          </Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                navigation.navigate('TrackComplaint');
              }}
            >
              <Text style={styles.primaryButtonText}>🔍 Track My Complaint</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
                });
              }}
            >
              <Text style={styles.secondaryButtonText}>File Another</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    backgroundColor: '#fff',
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  successIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E2845',
    marginBottom: 8,
  },
  ticketContainer: {
    backgroundColor: '#0A7EA415',
    borderColor: '#0A7EA430',
    borderWidth: 2,
    paddingHorizontal: 24,
    paddingVertical: 9,
    borderRadius: 999,
    marginBottom: 18,
  },
  ticketId: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0A7EA4',
  },
  successMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  bold: {
    fontWeight: 'bold',
    color: '#1E2845',
  },
  actionButtons: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#0A7EA4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ComplaintSuccessScreen;