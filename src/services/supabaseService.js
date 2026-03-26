import { supabase, TABLES, BUCKETS } from '../config/supabase';

class SupabaseService {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.subscriptions = new Map();
    this.authPromise = null; // Prevent concurrent auth calls
  }

  // ==================== AUTHENTICATION ====================

  async signUp(email, password, userData = {}) {
    try {
      // Step 1: Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone,
            role: userData.role || 'citizen',
            is_volunteer: userData.isVolunteer || false,
            volunteer_role: userData.volunteerRole || null
          }
        }
      });

      if (error) throw error;

      // Step 2: If user created successfully, create profile manually
      if (data.user && !data.user.identities?.length === 0) {
        // User already exists, just return success
        return { 
          success: true, 
          user: data.user, 
          message: 'User already exists. Please sign in instead.' 
        };
      }

      return { 
        success: true, 
        user: data.user, 
        message: 'Account created! You can now sign in.' 
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      this.currentUser = data.user;

      // Ensure user profile exists in users table
      if (data.user) {
        try {
          await this.createUserProfile(data.user.id, {
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email.split('@')[0],
            phone: data.user.user_metadata?.phone || '',
            role: data.user.user_metadata?.role || 'citizen'
          });
        } catch (profileError) {
          console.warn('Could not create user profile:', profileError.message);
          // Continue anyway - profile might already exist
        }
      }

      return { success: true, user: data.user, session: data.session };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      // Clean up subscriptions
      this.subscriptions.forEach(subscription => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      this.currentUser = null;
      this.authPromise = null; // Reset auth promise
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  async getCurrentUser() {
    // Prevent concurrent auth calls by reusing the same promise
    if (this.authPromise) {
      return this.authPromise;
    }

    this.authPromise = this._getCurrentUserInternal();
    
    try {
      const result = await this.authPromise;
      return result;
    } catch (error) {
      // Silently handle lock errors
      if (error.message?.includes('Lock')) {
        return this.currentUser; // Return cached user if available
      }
      throw error;
    } finally {
      // Clear the promise after completion
      setTimeout(() => {
        this.authPromise = null;
      }, 200);
    }
  }

  async _getCurrentUserInternal() {
    try {
      // If we already have a cached user, return it
      if (this.currentUser) {
        return this.currentUser;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        // Don't throw on lock errors, just return null
        if (error.message?.includes('Lock')) {
          return null;
        }
        throw error;
      }
      
      if (session?.user) {
        this.currentUser = session.user;
        return session.user;
      }
      
      return null;
    } catch (error) {
      // Don't log NavigatorLock errors as they're expected during concurrent access
      if (!error.message?.includes('Lock')) {
        console.error('Get current user error:', error);
      }
      return null;
    }
  }

  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== USER MANAGEMENT ====================

  async createUserProfile(userId, userData) {
    try {
      // First check if profile already exists
      const { data: existing } = await supabase
        .from(TABLES.USERS)
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (existing) {
        console.log('User profile already exists');
        return existing;
      }

      // Create new profile
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .insert([{
          id: userId,
          email: userData.email,
          name: userData.name,
          phone: userData.phone || '',
          role: userData.role || 'citizen',
          profile_picture: userData.profile_picture || null
        }])
        .select()
        .single();

      if (error) {
        // If error is duplicate key, that's okay - profile exists
        if (error.code === '23505') {
          console.log('User profile already exists (duplicate key)');
          return { id: userId, ...userData };
        }
        throw error;
      }

      // Initialize leaderboard entry
      try {
        await supabase
          .from(TABLES.LEADERBOARD)
          .upsert([{ user_id: userId }], { 
            onConflict: 'user_id',
            ignoreDuplicates: true 
          });
      } catch (leaderboardError) {
        console.warn('Could not initialize leaderboard:', leaderboardError.message);
      }

      return data;
    } catch (error) {
      console.error('Create user profile error:', error);
      // Return basic profile even if database insert fails
      return {
        id: userId,
        email: userData.email,
        name: userData.name,
        phone: userData.phone || '',
        role: userData.role || 'citizen',
        profile_picture: null
      };
    }
  }

  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Get user profile error:', error);
        // Return fallback profile from auth user
        const user = await this.getCurrentUser();
        return {
          id: userId,
          email: user?.email,
          name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
          phone: user?.user_metadata?.phone || '',
          role: user?.user_metadata?.role || 'citizen',
          profile_picture: null,
          leaderboard: null
        };
      }

      // If no data found, return fallback
      if (!data) {
        const user = await this.getCurrentUser();
        return {
          id: userId,
          email: user?.email,
          name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
          phone: user?.user_metadata?.phone || '',
          role: user?.user_metadata?.role || 'citizen',
          profile_picture: null,
          leaderboard: null
        };
      }

      // Fetch leaderboard separately
      try {
        const { data: leaderboardData } = await supabase
          .from(TABLES.LEADERBOARD)
          .select('total_score, current_rank, level, badges, complaints_count, resolved_count')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (leaderboardData) {
          data.leaderboard = leaderboardData;
        }
      } catch (leaderboardError) {
        console.warn('Could not fetch leaderboard:', leaderboardError.message);
        data.leaderboard = null;
      }

      return data;
    } catch (error) {
      console.error('Get user profile error:', error);
      // Return fallback profile
      const user = await this.getCurrentUser();
      return {
        id: userId,
        email: user?.email,
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
        phone: user?.user_metadata?.phone || '',
        role: user?.user_metadata?.role || 'citizen',
        profile_picture: null,
        leaderboard: null
      };
    }
  }

  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  // ==================== COMPLAINTS MANAGEMENT ====================

  async createComplaint(complaintData) {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Upload photos if any
      let photoUrls = [];
      if (complaintData.photos && complaintData.photos.length > 0) {
        try {
          photoUrls = await this.uploadComplaintImages(complaintData.photos);
        } catch (uploadError) {
          console.warn('Photo upload failed, continuing without photos:', uploadError.message);
          // Continue without photos if upload fails
        }
      }

      // Try to insert into database
      try {
        // Prepare the complaint data
        const complaintInsert = {
          user_id: user.id,
          title: complaintData.title,
          description: complaintData.description,
          location: complaintData.location,
          ward: complaintData.ward,
          gps_latitude: complaintData.gpsCoordinates?.latitude || null,
          gps_longitude: complaintData.gpsCoordinates?.longitude || null,
          gps_accuracy: complaintData.gpsCoordinates?.accuracy || null,
          gps_address: complaintData.gpsCoordinates?.address || null,
          category: complaintData.category || 'other',
          priority: complaintData.priority || 'medium',
          photo_urls: photoUrls,
          ai_analysis: complaintData.aiAnalysis || null,
          clip_analysis: complaintData.clipAnalysis || null,
          department_id: complaintData.departmentId || null,
          assigned_officer_id: complaintData.assignedOfficerId || null,
          sla_hours: complaintData.slaHours || 72
        };

        const { data, error } = await supabase
          .from(TABLES.COMPLAINTS)
          .insert([complaintInsert])
          .select()
          .single();

        if (error) {
          console.error('Complaint insert error:', error);
          // If table doesn't exist, create a local complaint
          if (error.message.includes('relation') || error.message.includes('does not exist') || error.code === 'PGRST116' || error.code === '42P01') {
            console.warn('Database tables not set up, creating local complaint');
            return this.createLocalComplaint(complaintData, user, photoUrls);
          }
          throw error;
        }

        // Fetch related data separately
        let complaintWithRelations = { ...data };
        
        // Fetch department info
        if (data.department_id) {
          try {
            const { data: dept } = await supabase
              .from(TABLES.DEPARTMENTS)
              .select('name, icon, color')
              .eq('id', data.department_id)
              .single();
            if (dept) {
              complaintWithRelations.departments = dept;
            }
          } catch (deptError) {
            console.warn('Could not fetch department:', deptError.message);
          }
        }

        // Fetch officer info
        if (data.assigned_officer_id) {
          try {
            const { data: officer } = await supabase
              .from(TABLES.OFFICERS)
              .select('id, badge_number, user_id')
              .eq('id', data.assigned_officer_id)
              .single();
            
            if (officer && officer.user_id) {
              const { data: officerUser } = await supabase
                .from(TABLES.USERS)
                .select('name')
                .eq('id', officer.user_id)
                .single();
              
              complaintWithRelations.officers = {
                ...officer,
                users: officerUser
              };
            }
          } catch (officerError) {
            console.warn('Could not fetch officer:', officerError.message);
          }
        }

        // Update leaderboard
        try {
          await this.updateLeaderboardScore(user.id, 'complaint_filed', 10);
        } catch (leaderboardError) {
          console.warn('Leaderboard update failed:', leaderboardError.message);
        }

        // Create initial update
        try {
          await this.createComplaintUpdate(data.id, {
            message: `Complaint registered and auto-routed to ${complaintWithRelations.departments?.name || 'department'}`,
            updated_by_name: 'NagarVani AI',
            updated_by_role: 'admin',
            status: 'acknowledged'
          });
        } catch (updateError) {
          console.warn('Initial update failed:', updateError.message);
        }

        // Create genesis block for audit trail
        try {
          const { createGenesisBlock } = await import('../lib/auditChain');
          await createGenesisBlock(data.id, {
            ticket_id: data.ticket_id,
            category: data.category,
            priority: data.priority,
            location: data.location,
            department: complaintWithRelations.departments?.name,
            user_id: user.id
          });
        } catch (auditError) {
          console.warn('Audit genesis block failed:', auditError.message);
        }

        return complaintWithRelations;
      } catch (dbError) {
        console.warn('Database error, creating local complaint:', dbError.message);
        return this.createLocalComplaint(complaintData, user, photoUrls);
      }
    } catch (error) {
      console.error('Create complaint error:', error);
      throw error;
    }
  }

  // Create a local complaint when database is not available
  createLocalComplaint(complaintData, user, photoUrls) {
    const ticketId = 'NV-' + String(Date.now()).slice(-6);
    const complaint = {
      id: Date.now(),
      ticket_id: ticketId,
      user_id: user.id,
      title: complaintData.title,
      description: complaintData.description,
      location: complaintData.location,
      ward: complaintData.ward,
      gps_latitude: complaintData.gpsCoordinates?.latitude,
      gps_longitude: complaintData.gpsCoordinates?.longitude,
      gps_accuracy: complaintData.gpsCoordinates?.accuracy,
      gps_address: complaintData.gpsCoordinates?.address,
      category: complaintData.category || 'other',
      priority: complaintData.priority || 'medium',
      status: 'open',
      photo_urls: photoUrls,
      ai_analysis: complaintData.aiAnalysis,
      clip_analysis: complaintData.clipAnalysis,
      department_id: complaintData.departmentId,
      assigned_officer_id: complaintData.assignedOfficerId,
      sla_hours: complaintData.slaHours || 72,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Mock department data
      departments: {
        name: complaintData.aiAnalysis?.department?.name || 'Public Works',
        icon: complaintData.aiAnalysis?.department?.icon || '🏗️',
        color: complaintData.aiAnalysis?.department?.color || '#0ea5e9'
      },
      users: {
        name: user.name || user.email,
        phone: user.phone || '',
        email: user.email
      }
    };

    // Store in localStorage as backup
    try {
      const localComplaints = JSON.parse(localStorage.getItem('nagarvani_complaints') || '[]');
      localComplaints.push(complaint);
      localStorage.setItem('nagarvani_complaints', JSON.stringify(localComplaints));
    } catch (storageError) {
      console.warn('Could not save to localStorage:', storageError.message);
    }

    return complaint;
  }

  async getComplaints(filters = {}) {
    try {
      let query = supabase
        .from(TABLES.COMPLAINTS)
        .select('*');

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.departmentId) {
        query = query.eq('department_id', filters.departmentId);
      }
      if (filters.assignedOfficerId) {
        query = query.eq('assigned_officer_id', filters.assignedOfficerId);
      }

      // Sorting
      query = query.order('created_at', { ascending: false });

      // Pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch related data for each complaint
      const complaintsWithRelations = await Promise.all(
        data.map(async (complaint) => {
          const enriched = { ...complaint };

          // Fetch department
          if (complaint.department_id) {
            try {
              const { data: dept } = await supabase
                .from(TABLES.DEPARTMENTS)
                .select('name, icon, color')
                .eq('id', complaint.department_id)
                .single();
              if (dept) enriched.departments = dept;
            } catch (err) {
              console.warn('Could not fetch department:', err.message);
            }
          }

          // Fetch user info
          if (complaint.user_id) {
            try {
              const { data: userInfo } = await supabase
                .from(TABLES.USERS)
                .select('name, phone')
                .eq('id', complaint.user_id)
                .single();
              if (userInfo) enriched.users = userInfo;
            } catch (err) {
              console.warn('Could not fetch user:', err.message);
            }
          }

          return enriched;
        })
      );

      return complaintsWithRelations;
    } catch (error) {
      console.error('Get complaints error:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  async getComplaint(complaintId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.COMPLAINTS)
        .select(`
          *,
          departments (name, icon, color),
          officers (
            id,
            badge_number,
            rating,
            users (name)
          ),
          users (name, phone, email),
          complaint_updates (
            id,
            message,
            updated_by_name,
            updated_by_role,
            status,
            attachments,
            is_public,
            created_at
          )
        `)
        .eq('id', complaintId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get complaint error:', error);
      throw error;
    }
  }

  async updateComplaint(complaintId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.COMPLAINTS)
        .update(updates)
        .eq('id', complaintId)
        .select()
        .maybeSingle();

      if (error) throw error;

      // Add audit block for status change
      if (updates.status) {
        try {
          const { addBlock } = await import('../lib/auditChain');
          const action = updates.status === 'resolved' ? 'complaint_resolved'
            : updates.status === 'escalated' ? 'escalated'
            : 'status_updated';
          await addBlock(complaintId, action, { 
            new_status: updates.status,
            updated_by: updates.updated_by || 'officer'
          });
        } catch (auditErr) {
          console.warn('Audit block failed:', auditErr.message);
        }
      }

      // If status changed to resolved, update leaderboard
      if (updates.status === 'resolved') {
        try {
          const complaint = data;
          if (complaint?.user_id) {
            await this.updateLeaderboardScore(complaint.user_id, 'complaint_resolved', 20);
          }
        } catch (e) { console.warn('Leaderboard update failed:', e.message); }
      }

      return data;
    } catch (error) {
      console.error('Update complaint error:', error);
      throw error;
    }
  }

  async createComplaintUpdate(complaintId, updateData) {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from(TABLES.COMPLAINT_UPDATES)
        .insert([{
          complaint_id: complaintId,
          message: updateData.message,
          updated_by: user?.id,
          updated_by_name: updateData.updated_by_name || user?.user_metadata?.name || 'Unknown',
          updated_by_role: updateData.updated_by_role || 'citizen',
          status: updateData.status,
          attachments: updateData.attachments || [],
          is_public: updateData.is_public !== false
        }])
        .select()
        .single();

      if (error) throw error;

      // Update complaint status if provided
      if (updateData.status) {
        await this.updateComplaint(complaintId, { status: updateData.status });
      }

      return data;
    } catch (error) {
      console.error('Create complaint update error:', error);
      throw error;
    }
  }

  // ==================== DEPARTMENTS & OFFICERS ====================

  async getOfficerProfile(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.OFFICERS)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Get officer profile error:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Fetch department separately
      if (data.department_id) {
        try {
          const { data: dept } = await supabase
            .from(TABLES.DEPARTMENTS)
            .select('name, icon, color')
            .eq('id', data.department_id)
            .maybeSingle();
          if (dept) {
            data.departments = dept;
          }
        } catch (deptError) {
          console.warn('Could not fetch department:', deptError.message);
        }
      }

      return data;
    } catch (error) {
      console.error('Get officer profile error:', error);
      return null;
    }
  }

  async createOfficerProfile(userId, departmentId, badgeNumber) {
    try {
      // CRITICAL: Ensure user profile exists first
      try {
        const userProfile = await this.getUserProfile(userId);
        if (!userProfile || !userProfile.id) {
          // User profile doesn't exist, create it
          const user = await this.getCurrentUser();
          if (user) {
            await this.createUserProfile(userId, {
              email: user.email,
              name: user.user_metadata?.name || user.email.split('@')[0],
              phone: user.user_metadata?.phone || '',
              role: user.user_metadata?.role || 'officer'
            });
          }
        }
      } catch (profileError) {
        console.warn('Could not ensure user profile exists:', profileError.message);
      }

      // Check if officer profile already exists
      const existing = await this.getOfficerProfile(userId);
      if (existing) {
        console.log('Officer profile already exists, returning existing profile');
        return existing;
      }

      const { data, error } = await supabase
        .from(TABLES.OFFICERS)
        .insert([{
          user_id: userId,
          department_id: departmentId,
          badge_number: badgeNumber,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        // If duplicate key error, fetch and return existing profile
        if (error.code === '23505') {
          console.log('Officer profile already exists (duplicate key), fetching existing');
          const existingProfile = await this.getOfficerProfile(userId);
          if (existingProfile) {
            return existingProfile;
          }
        }
        // If RLS policy error (409 conflict)
        if (error.code === '42501' || error.message.includes('policy')) {
          console.error('RLS Policy Error: Run fix_officer_rls_409.sql in Supabase SQL Editor');
          throw new Error('Permission denied. Please contact administrator to run database fix script.');
        }
        console.error('Officer profile creation error details:', error);
        throw error;
      }

      // Fetch department info
      if (data.department_id) {
        try {
          const { data: dept } = await supabase
            .from(TABLES.DEPARTMENTS)
            .select('name, icon, color')
            .eq('id', data.department_id)
            .maybeSingle();
          if (dept) {
            data.departments = dept;
          }
        } catch (deptError) {
          console.warn('Could not fetch department:', deptError.message);
        }
      }

      return data;
    } catch (error) {
      console.error('Create officer profile error:', error);
      throw error;
    }
  }

  async getDepartments() {
    try {
      const { data, error } = await supabase
        .from(TABLES.DEPARTMENTS)
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        // If table doesn't exist, provide helpful error message
        if (error.message.includes('relation "departments" does not exist')) {
          throw new Error('Database not set up. Please run the SQL setup script first.');
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Get departments error:', error);
      throw error;
    }
  }

  async getOfficers(departmentId = null) {
    try {
      let query = supabase
        .from(TABLES.OFFICERS)
        .select(`
          *,
          users (name, email),
          departments (name, icon, color)
        `)
        .eq('is_active', true);

      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }

      const { data, error } = await query.order('badge_number');
      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Get officers error:', error);
      throw error;
    }
  }

  // ==================== LEADERBOARD ====================

  async getLeaderboard(limit = 10) {
    try {
      const { data, error } = await supabase
        .from(TABLES.LEADERBOARD)
        .select(`
          *,
          users (name, profile_picture)
        `)
        .order('total_score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Add ranks
      return data.map((entry, index) => ({
        ...entry,
        rank: index + 1,
        medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null
      }));
    } catch (error) {
      console.error('Get leaderboard error:', error);
      throw error;
    }
  }

  async updateLeaderboardScore(userId, action, points) {
    try {
      const { error } = await supabase.rpc('update_leaderboard_score', {
        p_user_id: userId,
        p_action: action,
        p_points: points
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Update leaderboard score error:', error);
      return false;
    }
  }

  async getUserRank(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.LEADERBOARD)
        .select(`
          *,
          users (name)
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      // Get total users count
      const { count } = await supabase
        .from(TABLES.LEADERBOARD)
        .select('*', { count: 'exact', head: true });

      return {
        ...data,
        totalUsers: count
      };
    } catch (error) {
      console.error('Get user rank error:', error);
      throw error;
    }
  }

  // ==================== FILE STORAGE ====================

  async uploadComplaintImages(files) {
    try {
      const uploadPromises = files.map(async (file, index) => {
        // Handle both File objects and Blobs
        const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
        const fileName = `${Date.now()}-${index}.${fileExt}`;
        const filePath = `complaints/${fileName}`;

        console.log('Uploading image:', filePath, 'size:', file.size, 'type:', file.type);

        const { data, error } = await supabase.storage
          .from(BUCKETS.COMPLAINT_IMAGES)
          .upload(filePath, file, {
            contentType: file.type || 'image/jpeg',
            upsert: false
          });

        if (error) {
          console.error('Storage upload error:', error);
          throw error;
        }

        console.log('Upload successful:', data);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKETS.COMPLAINT_IMAGES)
          .getPublicUrl(filePath);

        console.log('Public URL:', publicUrl);
        return publicUrl;      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Upload complaint images error:', error);
      throw error;
    }
  }

  async uploadProfilePicture(userId, file) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/profile.${fileExt}`;

      const { error } = await supabase.storage
        .from(BUCKETS.PROFILE_PICTURES)
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKETS.PROFILE_PICTURES)
        .getPublicUrl(fileName);

      // Update user profile
      await this.updateUserProfile(userId, { profile_picture: publicUrl });

      return publicUrl;
    } catch (error) {
      console.error('Upload profile picture error:', error);
      throw error;
    }
  }

  // ==================== REALTIME SUBSCRIPTIONS ====================

  subscribeToComplaints(callback, filters = {}) {
    try {
      let channel = supabase
        .channel('complaints-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: TABLES.COMPLAINTS,
          filter: filters.userId ? `user_id=eq.${filters.userId}` : undefined
        }, callback);

      channel.subscribe();
      
      const subscriptionId = `complaints-${Date.now()}`;
      this.subscriptions.set(subscriptionId, channel);
      
      return subscriptionId;
    } catch (error) {
      console.error('Subscribe to complaints error:', error);
      return null;
    }
  }

  subscribeToComplaintUpdates(complaintId, callback) {
    try {
      const channel = supabase
        .channel(`complaint-updates-${complaintId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: TABLES.COMPLAINT_UPDATES,
          filter: `complaint_id=eq.${complaintId}`
        }, callback);

      channel.subscribe();
      
      const subscriptionId = `complaint-updates-${complaintId}`;
      this.subscriptions.set(subscriptionId, channel);
      
      return subscriptionId;
    } catch (error) {
      console.error('Subscribe to complaint updates error:', error);
      return null;
    }
  }

  subscribeToLeaderboard(callback) {
    try {
      const channel = supabase
        .channel('leaderboard-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: TABLES.LEADERBOARD
        }, callback);

      channel.subscribe();
      
      const subscriptionId = 'leaderboard';
      this.subscriptions.set(subscriptionId, channel);
      
      return subscriptionId;
    } catch (error) {
      console.error('Subscribe to leaderboard error:', error);
      return null;
    }
  }

  unsubscribe(subscriptionId) {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete(subscriptionId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Unsubscribe error:', error);
      return false;
    }
  }

  // ==================== ANALYTICS & DASHBOARD ====================

  async getDashboardStats() {
    try {
      // Get complaint counts by status
      const { data: complaints } = await supabase
        .from(TABLES.COMPLAINTS)
        .select('status');

      const statusCounts = complaints?.reduce((acc, complaint) => {
        acc[complaint.status] = (acc[complaint.status] || 0) + 1;
        return acc;
      }, {}) || {};

      // Get department-wise stats
      const { data: departmentStats } = await supabase
        .from(TABLES.COMPLAINTS)
        .select(`
          department_id,
          status,
          departments (name)
        `);

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from(TABLES.COMPLAINT_UPDATES)
        .select(`
          *,
          complaints (ticket_id, title)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        statusCounts,
        departmentStats,
        recentActivity,
        totalComplaints: Object.values(statusCounts).reduce((a, b) => a + b, 0)
      };
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  async isUserAuthenticated() {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch (error) {
      return false;
    }
  }

  async getUserRole() {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      const profile = await this.getUserProfile(user.id);
      return profile?.role || 'citizen';
    } catch (error) {
      console.error('Get user role error:', error);
      return 'citizen';
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // ==================== VOLUNTEER SYSTEM ====================

  async createVolunteerProfile(userId, volunteerData) {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .insert([{
          user_id: userId,
          name: volunteerData.name,
          phone: volunteerData.phone,
          role: volunteerData.role || 'citizen',
          lat: volunteerData.lat,
          lng: volunteerData.lng,
          location_address: volunteerData.location_address,
          is_available: true
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create volunteer profile error:', error);
      throw error;
    }
  }

  async getVolunteerProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get volunteer profile error:', error);
      return null;
    }
  }

  async updateVolunteerAvailability(volunteerId, isAvailable) {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
        .eq('id', volunteerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update volunteer availability error:', error);
      throw error;
    }
  }

  async findNearbyVolunteers(lat, lng, maxDistance = 10, limit = 5) {
    try {
      const { data, error } = await supabase
        .rpc('find_nearby_volunteers', {
          complaint_lat: lat,
          complaint_lng: lng,
          max_distance_km: maxDistance,
          limit_count: limit
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Find nearby volunteers error:', error);
      return [];
    }
  }

  async createVolunteerTask(complaintId, volunteerId, distance) {
    try {
      const { data, error } = await supabase
        .from('volunteer_tasks')
        .insert([{
          complaint_id: complaintId,
          volunteer_id: volunteerId,
          status: 'offered',
          distance_km: distance
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create volunteer task error:', error);
      throw error;
    }
  }

  async getVolunteerTasks(volunteerId, status = null) {
    try {
      let query = supabase
        .from('volunteer_tasks')
        .select('*, complaints(*)')
        .eq('volunteer_id', volunteerId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Get volunteer tasks error:', error);
      return [];
    }
  }

  async acceptVolunteerTask(taskId, volunteerId) {
    try {
      const { data: task, error: taskError } = await supabase
        .from('volunteer_tasks')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', taskId)
        .eq('volunteer_id', volunteerId)
        .select()
        .single();

      if (taskError) throw taskError;

      const { data: complaint, error: complaintError } = await supabase
        .from(TABLES.COMPLAINTS)
        .update({
          assigned_volunteer_id: volunteerId,
          assigned_role: 'volunteer',
          is_volunteer_assigned: true,
          volunteer_accepted_at: new Date().toISOString(),
          status: 'in_progress'
        })
        .eq('id', task.complaint_id)
        .select()
        .single();

      if (complaintError) throw complaintError;

      // Audit block: assigned to volunteer
      try {
        const { addBlock } = await import('../lib/auditChain');
        await addBlock(task.complaint_id, 'assigned_volunteer', { volunteer_id: volunteerId, task_id: taskId });
      } catch (e) { console.warn('Audit block failed:', e.message); }

      await supabase.from('volunteers').update({ tasks_accepted: supabase.raw('tasks_accepted + 1') }).eq('id', volunteerId);
      const volunteer = await this.getVolunteerProfile(volunteerId);
      if (volunteer?.user_id) await this.updateVolunteerLeaderboard(volunteer.user_id, 'task_accepted', 20);

      return { task, complaint };
    } catch (error) {
      console.error('Accept volunteer task error:', error);
      throw error;
    }
  }

  async completeVolunteerTask(taskId, volunteerId, completionData) {
    try {
      const { data: task, error: taskError } = await supabase
        .from('volunteer_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          proof_image_url: completionData.proofImageUrl,
          completion_notes: completionData.notes
        })
        .eq('id', taskId)
        .eq('volunteer_id', volunteerId)
        .select()
        .single();

      if (taskError) throw taskError;

      const { data: complaint, error: complaintError } = await supabase
        .from(TABLES.COMPLAINTS)
        .update({ status: 'resolved', volunteer_resolved_at: new Date().toISOString() })
        .eq('id', task.complaint_id)
        .select()
        .single();

      if (complaintError) throw complaintError;

      // Audit block: resolved by volunteer + image proof
      try {
        const { addBlock } = await import('../lib/auditChain');
        await addBlock(task.complaint_id, 'complaint_resolved', { resolved_by: 'volunteer', volunteer_id: volunteerId });
        if (completionData.proofImageUrl) {
          await addBlock(task.complaint_id, 'image_uploaded', { url: completionData.proofImageUrl, type: 'proof' });
        }
      } catch (e) { console.warn('Audit block failed:', e.message); }

      await supabase.from('volunteers').update({ tasks_completed: supabase.raw('tasks_completed + 1') }).eq('id', volunteerId);
      const volunteer = await this.getVolunteerProfile(volunteerId);
      if (volunteer?.user_id) await this.updateVolunteerLeaderboard(volunteer.user_id, 'task_completed', 50);

      return { task, complaint };
    } catch (error) {
      console.error('Complete volunteer task error:', error);
      throw error;
    }
  }

  async createVolunteerNotification(volunteerId, complaintId, title, message) {
    try {
      const { data, error } = await supabase
        .from('volunteer_notifications')
        .insert([{
          volunteer_id: volunteerId,
          complaint_id: complaintId,
          title,
          message,
          type: 'task_available'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create volunteer notification error:', error);
      throw error;
    }
  }

  async getVolunteerNotifications(volunteerId) {
    try {
      const { data, error } = await supabase
        .from('volunteer_notifications')
        .select('*')
        .eq('volunteer_id', volunteerId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get volunteer notifications error:', error);
      return [];
    }
  }

  async markNotificationRead(notificationId) {
    try {
      const { error } = await supabase
        .from('volunteer_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Mark notification read error:', error);
      return false;
    }
  }

  async updateVolunteerLeaderboard(userId, action, points) {
    try {
      const { error } = await supabase.rpc('update_volunteer_leaderboard', {
        p_user_id: userId,
        p_action: action,
        p_points: points
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Update volunteer leaderboard error:', error);
      return false;
    }
  }

  subscribeToVolunteerTasks(volunteerId, callback) {
    try {
      const channel = supabase
        .channel(`volunteer-tasks-${volunteerId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'volunteer_tasks',
          filter: `volunteer_id=eq.${volunteerId}`
        }, callback);

      channel.subscribe();
      
      const subscriptionId = `volunteer-tasks-${volunteerId}`;
      this.subscriptions.set(subscriptionId, channel);
      
      return subscriptionId;
    } catch (error) {
      console.error('Subscribe to volunteer tasks error:', error);
      return null;
    }
  }

  // ============================================
  // ADMIN METHODS - Get all data for admin dashboard
  // Updated: Added getAllOfficers and getAllVolunteers
  // ============================================

  async getAllOfficers() {
    try {
      const { data, error } = await supabase
        .from('officers')
        .select(`
          *,
          departments (
            id,
            name,
            icon,
            color
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get all officers error:', error);
      return [];
    }
  }

  async getAllVolunteers() {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .order('rating', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get all volunteers error:', error);
      return [];
    }
  }
}

// Export singleton instance
const supabaseService = new SupabaseService();
export default supabaseService;