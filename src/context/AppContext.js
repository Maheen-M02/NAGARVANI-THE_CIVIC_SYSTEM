import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import supabaseService from '../services/supabaseService';
import { aiTriage } from '../data/aiTriage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Auth state
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('landing');
  const [loading, setLoading] = useState(true);
  
  // Data state
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // UI state
  const [notif, setNotif] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize auth state with optimized delays
  useEffect(() => {
    let mounted = true;
    let initTimeout;
    
    const initializeAuth = async () => {
      try {
        // Reduced delay for faster initial load
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!mounted) return;
        
        // Check for existing session
        const currentUser = await supabaseService.getCurrentUser();
        if (currentUser && mounted) {
          // Set user immediately from auth data
          const basicProfile = {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.user_metadata?.name || currentUser.email.split('@')[0],
            phone: currentUser.user_metadata?.phone || '',
            role: currentUser.user_metadata?.role || 'citizen',
            profile_picture: null
          };
          
          setUser(basicProfile);
          setRole(basicProfile.role);
          
          // Try to load full profile in background
          supabaseService.getUserProfile(currentUser.id)
            .then(fullProfile => {
              if (mounted) {
                setUser(fullProfile);
                setRole(fullProfile.role);
              }
            })
            .catch(err => {
              console.warn('Could not load full profile:', err.message);
              // Keep using basic profile
            });
        }
      } catch (error) {
        // Silently handle lock errors - they're expected during initialization
        if (!error.message?.includes('Lock')) {
          console.warn('Auth initialization warning:', error.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Reduced delay for faster startup
    initTimeout = setTimeout(initializeAuth, 100);

    // Listen to auth changes
    const { data: { subscription } } = supabaseService.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Set user immediately from auth data
        const authUser = session.user;
        const basicProfile = {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email.split('@')[0],
          phone: authUser.user_metadata?.phone || '',
          role: authUser.user_metadata?.role || 'citizen',
          profile_picture: null
        };
        
        setUser(basicProfile);
        setRole(basicProfile.role);
        
        // Try to load full profile in background
        supabaseService.getUserProfile(authUser.id)
          .then(fullProfile => {
            if (mounted) {
              setUser(fullProfile);
              setRole(fullProfile.role);
            }
          })
          .catch(err => {
            console.warn('Could not load full profile:', err.message);
            // Keep using basic profile
          });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole('landing');
        setComplaints([]);
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => {
      mounted = false;
      if (initTimeout) clearTimeout(initTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  // Load initial data
  useEffect(() => {
    let mounted = true;
    
    const loadInitialData = async () => {
      try {
        // Load departments with error handling
        try {
          const depts = await supabaseService.getDepartments();
          if (mounted) {
            setDepartments(depts);
          }
        } catch (deptError) {
          console.warn('Could not load departments:', deptError.message);
          // Use fallback departments if database isn't set up
          const fallbackDepts = [
            { id: 'pwd', name: 'Public Works', icon: '🏗️', color: '#0ea5e9' },
            { id: 'water', name: 'Water Board', icon: '💧', color: '#06b6d4' },
            { id: 'electric', name: 'Electricity', icon: '⚡', color: '#f59e0b' },
            { id: 'waste', name: 'Waste Management', icon: '🗑️', color: '#22c55e' }
          ];
          if (mounted) {
            setDepartments(fallbackDepts);
          }
        }

        // Load user's complaints if authenticated
        if (user) {
          try {
            const userComplaints = await supabaseService.getComplaints({ userId: user.id });
            if (mounted) {
              setComplaints(userComplaints);
            }
          } catch (complaintsError) {
            console.warn('Could not load complaints:', complaintsError.message);
            // Continue without complaints if database isn't ready
          }
        }
      } catch (error) {
        console.warn('Error loading initial data:', error.message);
      }
    };

    if (!loading) {
      loadInitialData();
    }

    return () => {
      mounted = false;
    };
  }, [user, loading]);

  // Authentication methods
  const signUp = async (email, password, userData) => {
    try {
      const result = await supabaseService.signUp(email, password, userData);
      if (result.success) {
        notify('Account created! You can now sign in.', 'success');
        
        // If user opted in as volunteer, create volunteer profile
        if (userData.isVolunteer && result.user) {
          try {
            // Try to get current location for volunteer profile
            const locationModule = await import('../services/locationService');
            const locationResult = await locationModule.default.getCurrentLocation();
            
            if (locationResult.success) {
              await supabaseService.createVolunteerProfile(result.user.id, {
                name: userData.name,
                phone: userData.phone,
                role: userData.volunteerRole || 'citizen',
                lat: locationResult.location.latitude,
                lng: locationResult.location.longitude,
                location_address: locationResult.location.address
              });
              console.log('Volunteer profile created with location');
            } else {
              // Create volunteer profile without location (can be added later)
              await supabaseService.createVolunteerProfile(result.user.id, {
                name: userData.name,
                phone: userData.phone,
                role: userData.volunteerRole || 'citizen',
                lat: null,
                lng: null,
                location_address: null
              });
              console.log('Volunteer profile created without location');
            }
          } catch (volunteerError) {
            console.error('Could not create volunteer profile:', volunteerError);
            // Store volunteer intent in user metadata for retry on sign-in
            try {
              await supabaseService.updateUserProfile(result.user.id, {
                is_volunteer: true,
                volunteer_role: userData.volunteerRole || 'citizen'
              });
            } catch (metaError) {
              console.warn('Could not store volunteer metadata:', metaError);
            }
          }
        }
      } else {
        notify(result.error, 'error');
      }
      return result;
    } catch (error) {
      notify('Sign up failed', 'error');
      return { success: false, error: error.message };
    }
  };

  const signIn = async (email, password) => {
    try {
      console.log('Starting sign in...');
      const result = await supabaseService.signIn(email, password);
      console.log('Sign in result:', result);
      
      if (result.success) {
        // Set user immediately from auth data
        const authUser = result.user;
        const basicProfile = {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email.split('@')[0],
          phone: authUser.user_metadata?.phone || '',
          role: authUser.user_metadata?.role || 'citizen',
          profile_picture: null
        };
        
        console.log('Setting user:', basicProfile);
        setUser(basicProfile);
        setRole(basicProfile.role);
        
        notify('Welcome back!', 'success');
        
        // Try to load full profile in background
        supabaseService.getUserProfile(authUser.id)
          .then(fullProfile => {
            console.log('Full profile loaded:', fullProfile);
            setUser(fullProfile);
            setRole(fullProfile.role);
          })
          .catch(err => {
            console.warn('Could not load full profile:', err.message);
            // Keep using basic profile
          });
        
        // Check if user should have volunteer profile but doesn't
        if (authUser.user_metadata?.is_volunteer || authUser.user_metadata?.volunteer_role) {
          supabaseService.getVolunteerProfile(authUser.id)
            .then(async (volunteerProfile) => {
              if (!volunteerProfile) {
                console.log('Creating missing volunteer profile...');
                try {
                  // Try to get location
                  const locationModule = await import('../services/locationService');
                  const locationResult = await locationModule.default.getCurrentLocation();
                  
                  await supabaseService.createVolunteerProfile(authUser.id, {
                    name: authUser.user_metadata?.name || authUser.email.split('@')[0],
                    phone: authUser.user_metadata?.phone || '',
                    role: authUser.user_metadata?.volunteer_role || 'citizen',
                    lat: locationResult.success ? locationResult.location.latitude : null,
                    lng: locationResult.success ? locationResult.location.longitude : null,
                    location_address: locationResult.success ? locationResult.location.address : null
                  });
                  console.log('Volunteer profile created on sign-in');
                } catch (volunteerError) {
                  console.error('Could not create volunteer profile on sign-in:', volunteerError);
                }
              }
            })
            .catch(err => {
              console.warn('Could not check volunteer profile:', err);
            });
        }
      } else {
        console.error('Sign in failed:', result.error);
        notify(result.error, 'error');
      }
      return result;
    } catch (error) {
      console.error('Sign in exception:', error);
      notify('Sign in failed: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      const result = await supabaseService.signOut();
      if (result.success) {
        notify('Signed out successfully', 'success');
      }
      return result;
    } catch (error) {
      notify('Sign out failed', 'error');
      return { success: false, error: error.message };
    }
  };

  const notify = useCallback((msg, type = 'success') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3200);
  }, []);

  const addNotification = useCallback((notification) => {
    const newNotif = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      read: false,
      ...notification
    };
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const submitComplaint = useCallback(async (form) => {
    try {
      if (!user) {
        notify('Please sign in to submit a complaint', 'error');
        return null;
      }

      // Process with AI triage
      const t = aiTriage(form.description + ' ' + form.title, form.photo);
      
      // Map AI category to valid database enum
      const categoryMap = {
        'pothole': 'pothole',
        'potholes': 'pothole',
        'garbage': 'garbage',
        'garbage_pile': 'garbage',
        'garbage_sanitation': 'garbage',
        'waste': 'garbage',
        'water_leakage': 'water_leakage',
        'water_leak': 'water_leakage',
        'leakage': 'water_leakage',
        'streetlight': 'streetlight',
        'street_light': 'streetlight',
        'broken_streetlight': 'streetlight',
        'drainage': 'drainage',
        'road_damage': 'road_damage',
        'road': 'road_damage',
        'noise_pollution': 'noise_pollution',
        'noise': 'noise_pollution',
        'illegal_construction': 'illegal_construction',
        'construction': 'illegal_construction',
        'traffic_issue': 'traffic_issue',
        'traffic': 'traffic_issue'
      };
      
      // Map categories to department names
      const categoryToDepartment = {
        'pothole': 'Public Works Department',
        'road_damage': 'Public Works Department',
        'drainage': 'Public Works Department',
        'water_leakage': 'Water Board',
        'garbage': 'Waste Management',
        'streetlight': 'Electricity Department',
        'traffic_issue': 'Traffic Police',
        'noise_pollution': 'Municipal Corporation',
        'illegal_construction': 'Municipal Corporation'
      };
      
      // Normalize category: remove special chars, convert to lowercase
      const normalizedCategory = t.category.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      const validCategory = categoryMap[normalizedCategory] || 'other';
      
      // Find appropriate department based on category
      const targetDeptName = categoryToDepartment[validCategory];
      const department = departments.find(d => 
        d.name === targetDeptName ||
        d.name.toLowerCase().includes(t.category.toLowerCase()) ||
        t.category.toLowerCase().includes(d.name.toLowerCase().split(' ')[0])
      ) || departments[0];

      console.log('Category mapping:', { 
        aiCategory: t.category, 
        normalizedCategory, 
        validCategory, 
        targetDeptName,
        selectedDept: department?.name 
      });

      const complaintData = {
        title: form.title,
        description: form.description,
        location: form.location,
        ward: form.ward,
        gpsCoordinates: form.gpsCoordinates,
        category: validCategory,
        priority: t.priority.toLowerCase(),
        photos: form.photo ? [form.photo] : [],
        aiAnalysis: t,
        clipAnalysis: form.clipAnalysis,
        departmentId: department?.id,
        slaHours: department?.default_sla_hours || 72
      };

      console.log('Submitting complaint with data:', complaintData);
      
      const complaint = await supabaseService.createComplaint(complaintData);
      
      console.log('Complaint created:', complaint);
      
      // Update local state
      setComplaints(prev => [complaint, ...prev]);
      
      // Add notification for new complaint
      addNotification({
        type: 'complaint_created',
        title: 'Complaint Filed Successfully',
        message: `Your complaint "${complaint.title}" has been filed and assigned ticket ID ${complaint.ticket_id || complaint.ticketId}`,
        ticketId: complaint.ticket_id || complaint.ticketId,
        icon: '📝',
        priority: complaint.priority,
        department: department?.name
      });

      // Add gamification notification
      const pointsEarned = complaint.priority === 'critical' ? 60 : complaint.priority === 'high' ? 40 : 10;
      addNotification({
        type: 'points_earned',
        title: 'Points Earned! 🎉',
        message: `You earned ${pointsEarned} points for filing this complaint!`,
        icon: '⭐',
        priority: 'low'
      });
      
      // VOLUNTEER MATCHING LOGIC
      // Send ALL complaints to volunteers for testing
      if (complaint.gps_latitude && complaint.gps_longitude) {
        try {
          console.log('Finding nearby volunteers for complaint:', complaint.id);
          
          // Find nearby volunteers - increased radius to 50km for testing
          const volunteers = await supabaseService.findNearbyVolunteers(
            complaint.gps_latitude,
            complaint.gps_longitude,
            50, // 50km radius for easier testing
            5   // top 5 volunteers
          );
          
          console.log('Found volunteers:', volunteers);
          
          // Create tasks for volunteers
          if (volunteers && volunteers.length > 0) {
            for (const volunteer of volunteers) {
              await supabaseService.createVolunteerTask(
                complaint.id,
                volunteer.volunteer_id,
                volunteer.distance_km
              );
              
              // Send notification
              await supabaseService.createVolunteerNotification(
                volunteer.volunteer_id,
                complaint.id,
                'New Task Available',
                `A ${complaint.priority} priority complaint is ${volunteer.distance_km.toFixed(1)}km away from you`
              );
            }
            
            console.log(`Created tasks for ${volunteers.length} volunteers`);
          }
        } catch (volunteerError) {
          console.warn('Volunteer matching failed:', volunteerError.message);
          // Don't fail complaint submission if volunteer matching fails
        }
      }
      
      notify(`Complaint ${complaint.ticket_id || complaint.ticketId} submitted successfully!`, 'success');
      return complaint;
    } catch (error) {
      console.error('Submit complaint error:', error);
      notify('Failed to submit complaint: ' + error.message, 'error');
      throw error;
    }
  }, [user, departments, addNotification, notify]);

  const updateComplaint = useCallback(async (id, status, note, by) => {
    try {
      console.log('AppContext: Updating complaint', id, 'to status:', status);
      
      // Try to find complaint in local state, but don't fail if not found
      // (officer might be updating a complaint that's not in their personal list)
      let complaint = complaints.find(c => c.id === id);
      if (!complaint) {
        console.warn('Complaint not in local state, fetching from database:', id);
        // Fetch complaint from database
        try {
          const fetchedComplaint = await supabaseService.getComplaint(id);
          if (!fetchedComplaint) {
            console.error('Complaint not found in database:', id);
            notify('Complaint not found', 'error');
            return;
          }
          // Use fetched complaint for operations
          complaint = fetchedComplaint;
        } catch (fetchError) {
          console.error('Error fetching complaint:', fetchError);
          // Continue anyway - the update might still work
        }
      }

      // Map UI status to database status enum
      const statusMap = {
        'Open': 'pending',
        'Pending': 'pending',
        'Acknowledged': 'acknowledged',
        'In Progress': 'in_progress',
        'in_progress': 'in_progress',
        'Resolved': 'resolved',
        'Closed': 'closed',
        'Rejected': 'rejected',
        'Escalated': 'in_progress' // Escalated maps to in_progress with high priority
      };
      
      // Normalize status: convert to proper database enum value
      const normalizedStatus = statusMap[status] || status.toLowerCase().replace(/\s+/g, '_');
      console.log('Normalized status:', normalizedStatus);

      // Validate status
      const validStatuses = ['pending', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected'];
      if (!validStatuses.includes(normalizedStatus)) {
        console.error('Invalid status:', normalizedStatus);
        notify('Invalid status value', 'error');
        return;
      }

      // Update complaint in database
      const updatedComplaint = await supabaseService.updateComplaint(id, { 
        status: normalizedStatus,
        updated_at: new Date().toISOString()
      });
      
      console.log('Complaint updated in database:', updatedComplaint);
      
      // Add complaint update with note
      if (note) {
        await supabaseService.createComplaintUpdate(id, {
          message: note,
          status: normalizedStatus,
          updated_by_name: by || 'Officer'
        });
        console.log('Complaint update note added');
      }

      // Update local state immediately (only if complaint exists in local state)
      setComplaints(prev => {
        const exists = prev.some(c => c.id === id);
        if (exists) {
          return prev.map(c => c.id === id ? { 
            ...c, 
            ...updatedComplaint,
            status: normalizedStatus 
          } : c);
        }
        return prev;
      });

      // Add leaderboard points for resolution
      if (status === 'Resolved' && complaint.user_id) {
        await supabaseService.updateLeaderboardScore(complaint.user_id, 'complaint_resolved', 20);
        
        // Add gamification notification for resolution
        addNotification({
          type: 'points_earned',
          title: 'Resolution Bonus! 🎉',
          message: `You earned 20 points for your resolved complaint!`,
          icon: '🏆',
          priority: 'medium'
        });
      }

      // Add notification for status changes
      const statusNotifications = {
        'In Progress': {
          type: 'status_update',
          title: 'Work Started on Your Complaint',
          message: `Your complaint "${complaint.title}" is now being worked on by our team`,
          icon: '🔧',
        },
        'Resolved': {
          type: 'complaint_resolved',
          title: 'Complaint Resolved!',
          message: `Great news! Your complaint "${complaint.title}" has been successfully resolved`,
          icon: '✅',
        },
        'Escalated': {
          type: 'status_update',
          title: 'Complaint Escalated',
          message: `Your complaint "${complaint.title}" has been escalated for priority handling`,
          icon: '⚠️',
        }
      };

      if (statusNotifications[status]) {
        addNotification({
          ...statusNotifications[status],
          ticketId: complaint.ticket_id,
          priority: complaint.priority,
          department: complaint.departments?.name
        });
      }

      console.log('Update complaint completed successfully');
      return updatedComplaint;
    } catch (error) {
      console.error('Update complaint error:', error);
      notify('Failed to update complaint: ' + error.message, 'error');
      throw error;
    }
  }, [complaints, addNotification, notify]);

  const refreshComplaints = async () => {
    try {
      if (user) {
        const userComplaints = await supabaseService.getComplaints({ userId: user.id });
        setComplaints(userComplaints);
      }
    } catch (error) {
      console.error('Refresh complaints error:', error);
      notify('Failed to refresh complaints', 'error');
    }
  };

  return (
    <AppContext.Provider value={{ 
      // Auth state
      user,
      role, 
      setRole,
      loading,
      
      // Data
      complaints, 
      departments,
      
      // Auth methods
      signUp,
      signIn,
      signOut,
      
      // Complaint methods
      submitComplaint, 
      updateComplaint,
      refreshComplaints,
      
      // Notifications
      notif, 
      notify, 
      notifications,
      unreadCount,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      
      // Supabase service access
      supabaseService
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
