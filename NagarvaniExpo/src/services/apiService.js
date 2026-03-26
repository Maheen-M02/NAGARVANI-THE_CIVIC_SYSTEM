import AsyncStorage from '@react-native-async-storage/async-storage';
import imageService from './imageService';

// Local storage keys
const STORAGE_KEYS = {
  USERS: 'nagarvani_users',
  COMPLAINTS: 'nagarvani_complaints',
  UPDATES: 'nagarvani_updates',
  CURRENT_USER: 'nagarvani_current_user',
  USER_SESSION: 'nagarvani_user_session'
};

// Main API Service for React Native/Expo using AsyncStorage
class ApiService {
  constructor() {
    this.images = imageService;
    this.currentUser = null;
    this.initializeStorage();
  }

  // Initialize AsyncStorage with default data
  async initializeStorage() {
    try {
      const users = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!users) {
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
      }

      const complaints = await AsyncStorage.getItem(STORAGE_KEYS.COMPLAINTS);
      if (!complaints) {
        await AsyncStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify([]));
      }

      const updates = await AsyncStorage.getItem(STORAGE_KEYS.UPDATES);
      if (!updates) {
        await AsyncStorage.setItem(STORAGE_KEYS.UPDATES, JSON.stringify([]));
      }

      // Create demo data if no users exist
      const users = usersData ? JSON.parse(usersData) : [];
      if (users.length === 0) {
        await this.createDemoData();
      }
      
      // Restore user session
      const session = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
      if (session) {
        this.currentUser = JSON.parse(session);
      }
    } catch (error) {
      console.error('Initialize storage error:', error);
    }
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // AUTHENTICATION METHODS

  // Register new user
  async registerUser(userData) {
    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const users = usersData ? JSON.parse(usersData) : [];
      
      // Check if user already exists
      const existingUser = users.find(u => u.email === userData.email);
      if (existingUser) {
        return { success: false, error: 'User with this email already exists' };
      }

      const newUser = {
        id: this.generateId(),
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        role: userData.role || 'citizen',
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      // Auto login after registration
      this.currentUser = newUser;
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(newUser));

      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  // Login user
  async loginUser(email, password) {
    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const users = usersData ? JSON.parse(usersData) : [];
      const user = users.find(u => u.email === email);

      if (!user) {
        return { success: false, error: 'No account found with this email address' };
      }

      // In a real app, you'd verify password hash
      // For demo purposes, we'll accept any password
      this.currentUser = user;
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(user));

      return { success: true, user, userData: user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  // Logout
  async logout() {
    try {
      this.currentUser = null;
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_SESSION);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Auth state observer (simulate Firebase onAuthStateChanged)
  onAuthStateChange(callback) {
    // Initial call
    callback({ user: this.currentUser, userData: this.currentUser });
    
    // Return unsubscribe function
    return () => {};
  }

  // COMPLAINT MANAGEMENT METHODS

  // Submit new complaint with images
  async submitComplaint(complaintData, images = []) {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'Please login to submit a complaint' };
      }

      let processedImages = [];

      // Process images if provided
      if (images.length > 0) {
        const imageResult = await this.images.processComplaintImages(images);
        
        if (!imageResult.success) {
          return { success: false, error: imageResult.error };
        }
        
        processedImages = imageResult.images;
      }

      const complaintsData = await AsyncStorage.getItem(STORAGE_KEYS.COMPLAINTS);
      const complaints = complaintsData ? JSON.parse(complaintsData) : [];
      
      const newComplaint = {
        id: this.generateId(),
        userId: this.currentUser.id,
        title: complaintData.title,
        description: complaintData.description,
        category: complaintData.category,
        latitude: complaintData.latitude || 0,
        longitude: complaintData.longitude || 0,
        priority: complaintData.priority || 'Medium',
        department: complaintData.department || 'General',
        images: processedImages,
        status: 'submitted',
        createdAt: new Date().toISOString()
      };

      complaints.push(newComplaint);
      await AsyncStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));

      return {
        success: true,
        complaintId: newComplaint.id,
        imagesCount: processedImages.length,
        message: 'Complaint submitted successfully'
      };
    } catch (error) {
      console.error('Submit complaint error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's complaints
  async getUserComplaints(userId) {
    try {
      const complaintsData = await AsyncStorage.getItem(STORAGE_KEYS.COMPLAINTS);
      const complaints = complaintsData ? JSON.parse(complaintsData) : [];
      const userComplaints = complaints.filter(c => c.userId === userId);
      return { success: true, data: userComplaints };
    } catch (error) {
      console.error('Get user complaints error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all complaints (with filters)
  async getAllComplaints(filters = {}) {
    try {
      const complaintsData = await AsyncStorage.getItem(STORAGE_KEYS.COMPLAINTS);
      let complaints = complaintsData ? JSON.parse(complaintsData) : [];
      
      // Apply filters
      if (filters.status) {
        complaints = complaints.filter(c => c.status === filters.status);
      }
      if (filters.category) {
        complaints = complaints.filter(c => c.category === filters.category);
      }
      if (filters.limit) {
        complaints = complaints.slice(0, filters.limit);
      }

      return { success: true, data: complaints };
    } catch (error) {
      console.error('Get all complaints error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update complaint status
  async updateComplaintStatus(complaintId, status, message, officerId) {
    try {
      const complaintsData = await AsyncStorage.getItem(STORAGE_KEYS.COMPLAINTS);
      const complaints = complaintsData ? JSON.parse(complaintsData) : [];
      const complaintIndex = complaints.findIndex(c => c.id === complaintId);
      
      if (complaintIndex === -1) {
        return { success: false, error: 'Complaint not found' };
      }

      complaints[complaintIndex].status = status;
      if (officerId) {
        complaints[complaintIndex].assignedOfficer = officerId;
      }

      await AsyncStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));

      // Create update record
      const updatesData = await AsyncStorage.getItem(STORAGE_KEYS.UPDATES);
      const updates = updatesData ? JSON.parse(updatesData) : [];
      updates.push({
        id: this.generateId(),
        complaintId,
        officerId,
        message,
        status,
        updatedAt: new Date().toISOString()
      });
      await AsyncStorage.setItem(STORAGE_KEYS.UPDATES, JSON.stringify(updates));

      return { success: true, message: 'Complaint updated successfully' };
    } catch (error) {
      console.error('Update complaint status error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const complaintsData = await AsyncStorage.getItem(STORAGE_KEYS.COMPLAINTS);
      const complaints = complaintsData ? JSON.parse(complaintsData) : [];
      
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const users = usersData ? JSON.parse(usersData) : [];

      const stats = {
        complaints: {
          total: complaints.length,
          submitted: complaints.filter(c => c.status === 'submitted').length,
          assigned: complaints.filter(c => c.status === 'assigned').length,
          inProgress: complaints.filter(c => c.status === 'in_progress').length,
          resolved: complaints.filter(c => c.status === 'resolved').length,
          byCategory: {
            road: complaints.filter(c => c.category === 'road').length,
            garbage: complaints.filter(c => c.category === 'garbage').length,
            water: complaints.filter(c => c.category === 'water').length,
            electricity: complaints.filter(c => c.category === 'electricity').length
          }
        },
        users: {
          total: users.length,
          citizens: users.filter(u => u.role === 'citizen').length,
          officers: users.filter(u => u.role === 'officer').length,
          admins: users.filter(u => u.role === 'admin').length
        }
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return { success: false, error: error.message };
    }
  }

  // REAL-TIME LISTENERS (Simulated)

  // Listen to user's complaints
  listenToUserComplaints(userId, callback) {
    const checkForUpdates = () => {
      this.getUserComplaints(userId).then(result => {
        if (result.success) {
          callback(result.data);
        }
      });
    };

    // Initial call
    checkForUpdates();

    // Simulate real-time updates every 5 seconds
    const interval = setInterval(checkForUpdates, 5000);

    // Return unsubscribe function
    return () => clearInterval(interval);
  }

  // Listen to all complaints
  listenToAllComplaints(callback, filters = {}) {
    const checkForUpdates = () => {
      this.getAllComplaints(filters).then(result => {
        if (result.success) {
          callback(result.data);
        }
      });
    };

    // Initial call
    checkForUpdates();

    // Simulate real-time updates every 5 seconds
    const interval = setInterval(checkForUpdates, 5000);

    // Return unsubscribe function
    return () => clearInterval(interval);
  }

  // UTILITY METHODS

  // Validate complaint data
  validateComplaintData(data) {
    const errors = [];

    if (!data.title || data.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters long');
    }

    if (!data.description || data.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters long');
    }

    if (!data.category) {
      errors.push('Category is required');
    }

    if (!['road', 'garbage', 'water', 'electricity'].includes(data.category)) {
      errors.push('Invalid category');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate images
  validateImages(images) {
    return this.images.validateImages(images);
  }

  // Get image data URL
  getImageDataUrl(imageData) {
    return this.images.getImageDataUrl(imageData);
  }

  // Format file size
  formatFileSize(bytes) {
    return this.images.formatFileSize(bytes);
  }

  // Get complaint status color
  getStatusColor(status) {
    const colors = {
      submitted: '#fbbf24', // yellow
      assigned: '#3b82f6',  // blue
      in_progress: '#f59e0b', // orange
      resolved: '#10b981'   // green
    };
    return colors[status] || '#6b7280'; // gray
  }

  // Get category icon
  getCategoryIcon(category) {
    const icons = {
      road: '🛣️',
      garbage: '🗑️',
      water: '💧',
      electricity: '⚡'
    };
    return icons[category] || '📋';
  }

  // Format date
  formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Image picker methods
  async takePhoto() {
    return await this.images.takePhoto();
  }

  async pickImage() {
    return await this.images.pickImage();
  }

  async pickMultipleImages(maxImages = 3) {
    return await this.images.pickMultipleImages(maxImages);
  }

  // Create demo data
  async createDemoData() {
    const users = [
      {
        id: 'admin1',
        name: 'Admin User',
        email: 'admin@nagarvani.com',
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        id: 'officer1',
        name: 'Officer Kumar',
        email: 'officer@nagarvani.com',
        role: 'officer',
        createdAt: new Date().toISOString()
      },
      {
        id: 'citizen1',
        name: 'Citizen User',
        email: 'citizen@nagarvani.com',
        role: 'citizen',
        createdAt: new Date().toISOString()
      }
    ];

    const complaints = [
      {
        id: 'complaint1',
        userId: 'citizen1',
        title: 'Pothole on Main Road',
        description: 'Large pothole causing traffic issues',
        category: 'road',
        latitude: 28.6139,
        longitude: 77.2090,
        priority: 'High',
        department: 'PWD Roads',
        images: [],
        status: 'submitted',
        createdAt: new Date().toISOString()
      }
    ];

    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    await AsyncStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
    await AsyncStorage.setItem(STORAGE_KEYS.UPDATES, JSON.stringify([]));
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;