// Singleton auth manager to prevent concurrent auth calls
class AuthManager {
  constructor() {
    this.isInitializing = false;
    this.initPromise = null;
    this.user = null;
  }

  async initialize(supabaseService) {
    if (this.isInitializing) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = this._doInitialize(supabaseService);
    
    try {
      const result = await this.initPromise;
      return result;
    } finally {
      this.isInitializing = false;
      this.initPromise = null;
    }
  }

  async _doInitialize(supabaseService) {
    try {
      // Add delay to prevent immediate lock conflicts
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const user = await supabaseService.getCurrentUser();
      this.user = user;
      return user;
    } catch (error) {
      console.warn('Auth manager initialization warning:', error.message);
      return null;
    }
  }

  getUser() {
    return this.user;
  }

  setUser(user) {
    this.user = user;
  }

  clearUser() {
    this.user = null;
  }
}

// Export singleton instance
export const authManager = new AuthManager();
export default authManager;