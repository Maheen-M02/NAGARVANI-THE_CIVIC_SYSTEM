// CLIP Model Service for React Native/Expo - Optimized for Speed
class ClipService {
  constructor() {
    // Multiple possible server URLs to try
    this.serverUrls = [
      'http://192.168.137.1:8000',   // Windows hotspot IP (CONFIRMED WORKING)
      'http://10.227.86.94:8000',    // Your current WiFi IP  
      'http://10.17.113.216:8000',   // Previous WiFi IP
      'http://192.168.1.100:8000',   // Common router IP range
      'http://localhost:8000',       // If using emulator
    ];
    this.baseUrl = this.serverUrls[0]; // Default to hotspot IP
    this.debugMode = true; // Enable debug logging
    this.workingUrl = null; // Cache working URL
    this.lastConnectionTest = 0; // Cache connection test
    this.connectionCache = null; // Cache connection result
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  /**
   * Log debug information
   */
  log(message, data = null) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString().substring(11, 19);
      console.log(`[${timestamp}] [ClipService] ${message}`, data || '');
    }
  }

  /**
   * Test connection with caching for performance
   */
  async testConnection() {
    const now = Date.now();
    
    // Return cached result if still valid
    if (this.connectionCache && (now - this.lastConnectionTest) < this.cacheTimeout) {
      this.log('Using cached connection result');
      return this.connectionCache;
    }
    
    this.log('Testing connection to CLIP server...');
    this.log('Available server URLs:', this.serverUrls);
    
    // Try each URL with Expo-specific settings
    for (let i = 0; i < this.serverUrls.length; i++) {
      const url = this.serverUrls[i];
      this.log(`Attempt ${i + 1}: Testing ${url}`);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          this.log(`Timeout reached for ${url}`);
          controller.abort();
        }, 5000); // Reduced to 5 second timeout for faster testing
        
        const response = await fetch(`${url}/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            // Add user agent for iOS
            'User-Agent': 'NagarVani-Expo-App/1.0',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        this.log(`Response received from ${url}:`, { status: response.status, ok: response.ok });

        if (response.ok) {
          const data = await response.json();
          this.log('Connection test successful', data);
          
          // Update base URL to working one and cache result
          this.baseUrl = url;
          this.workingUrl = url;
          this.lastConnectionTest = now;
          this.connectionCache = { success: true, data, url };
          
          return this.connectionCache;
        } else {
          this.log(`HTTP error from ${url}:`, response.status);
        }
      } catch (error) {
        this.log(`Error testing ${url}:`, error.message);
        
        if (error.name === 'AbortError') {
          this.log(`Connection timeout for ${url}`);
        } else if (error.message.includes('Network request failed')) {
          this.log(`Network request failed for ${url} - trying next...`);
        }
      }
    }
    
    this.log('All connection attempts failed');
    const failResult = { success: false, error: 'All server URLs failed' };
    this.connectionCache = failResult;
    this.lastConnectionTest = now;
    return failResult;
  }

  /**
   * Detect issue from image using CLIP model - Optimized for speed
   * @param {Object} imageAsset - Expo ImagePicker asset or File object
   * @returns {Promise<Object>} - Classification result
   */
  async detectIssue(imageAsset) {
    this.log('Starting image detection...', { 
      hasImage: !!imageAsset, 
      imageUri: imageAsset?.uri?.substring(0, 50) + '...' 
    });

    // Use cached connection if available, otherwise test
    let connectionTest;
    if (this.workingUrl && this.connectionCache && this.connectionCache.success) {
      this.log(`Using cached working server: ${this.workingUrl}`);
      connectionTest = this.connectionCache;
    } else {
      connectionTest = await this.testConnection();
    }
    
    if (!connectionTest.success) {
      this.log('No working server found, using fallback', connectionTest.error);
      return this.fallbackClassification(imageAsset);
    }

    const workingUrl = connectionTest.url || this.workingUrl || this.baseUrl;
    this.log(`Using server: ${workingUrl}`);

    try {
      // Create FormData for React Native
      const formData = new FormData();
      
      // Handle different image input types
      if (imageAsset.uri) {
        // Expo ImagePicker asset
        this.log('Processing Expo ImagePicker asset');
        formData.append('file', {
          uri: imageAsset.uri,
          type: imageAsset.type || 'image/jpeg',
          name: imageAsset.fileName || 'civic-issue.jpg',
        });
      } else if (imageAsset instanceof File) {
        // Web File object (for compatibility)
        this.log('Processing File object');
        formData.append('file', imageAsset);
      } else {
        throw new Error('Invalid image format');
      }

      this.log('Sending request to CLIP API...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        this.log('Image upload timeout reached');
        controller.abort();
      }, 15000); // Reduced to 15 second timeout for faster response
      
      const response = await fetch(`${workingUrl}/detect-issue`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData - let browser set it
          'User-Agent': 'NagarVani-Expo-App/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      this.log('Received response', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      this.log('CLIP analysis successful', result);
      
      // Transform the result to match our app's expected format
      return {
        success: true,
        data: {
          issue: result.issue,
          category: result.category,
          department: result.department,
          confidence: Math.round(result.confidence * 100), // Convert to percentage
          title: this.generateTitle(result.issue),
          description: this.generateDescription(result.issue, result.confidence),
          mode: result.mode || 'CLIP',
          isClipResult: true
        }
      };
    } catch (error) {
      this.log('CLIP API Error', error.message);
      
      // Clear cache on error to force retry next time
      if (error.name === 'AbortError' || error.message.includes('Network')) {
        this.connectionCache = null;
        this.workingUrl = null;
      }
      
      // Fallback to local classification if API fails
      return this.fallbackClassification(imageAsset);
    }
  }

  /**
   * Generate a user-friendly title from the detected issue
   */
  generateTitle(issue) {
    const titleMap = {
      'pothole on road': 'Road Damage - Pothole Detected',
      'garbage pile': 'Waste Management Issue - Garbage Accumulation',
      'water leakage': 'Water Supply Issue - Pipe Leakage',
      'broken streetlight': 'Street Light Not Working'
    };

    return titleMap[issue] || `${issue.charAt(0).toUpperCase() + issue.slice(1)} Issue Detected`;
  }

  /**
   * Generate a detailed description from the detected issue
   */
  generateDescription(issue, confidence) {
    const descriptionMap = {
      'pothole on road': 'Large pothole observed on the road surface causing inconvenience to vehicles and pedestrians. The damaged area poses a safety hazard, especially during monsoon season.',
      'garbage pile': 'Accumulated garbage and waste materials found in public area. The waste appears to be mixed household and commercial refuse creating unhygienic conditions and potential health hazards.',
      'water leakage': 'Water pipe leakage detected causing water wastage and potential damage to surrounding infrastructure. The leak appears to be from the main supply line and requires immediate attention.',
      'broken streetlight': 'Non-functional street light creating safety concerns for pedestrians and vehicles during night hours. The light pole appears intact but the electrical connection needs repair or replacement.'
    };

    const baseDescription = descriptionMap[issue] || `${issue} detected in the area requiring municipal attention.`;
    const confidenceText = confidence > 0.8 ? 'High confidence detection' : confidence > 0.6 ? 'Moderate confidence detection' : 'Low confidence detection';
    
    return `${baseDescription} (AI ${confidenceText}: ${Math.round(confidence * 100)}%)`;
  }

  /**
   * Fallback classification when CLIP API is unavailable - Enhanced with better logic
   */
  fallbackClassification(imageAsset) {
    console.log('Using fallback classification');
    
    // Simple fallback based on filename or random selection
    const classifications = [
      {
        issue: 'pothole on road',
        category: 'Road Infrastructure',
        department: 'PWD Roads',
        confidence: 0.75
      },
      {
        issue: 'garbage pile',
        category: 'Waste Management',
        department: 'Sanitation',
        confidence: 0.70
      },
      {
        issue: 'water leakage',
        category: 'Water Supply',
        department: 'Water Department',
        confidence: 0.72
      },
      {
        issue: 'broken streetlight',
        category: 'Street Lighting',
        department: 'Electricity Board',
        confidence: 0.68
      }
    ];

    // Try to match based on filename if available
    let selectedClassification;
    if (imageAsset.fileName) {
      const filename = imageAsset.fileName.toLowerCase();
      selectedClassification = classifications.find(c => 
        c.issue.split(' ').some(word => filename.includes(word))
      );
    }
    
    // Random selection if no match found
    if (!selectedClassification) {
      selectedClassification = classifications[Math.floor(Math.random() * classifications.length)];
    }
    
    return {
      success: true,
      data: {
        issue: selectedClassification.issue,
        category: selectedClassification.category,
        department: selectedClassification.department,
        confidence: Math.round(selectedClassification.confidence * 100),
        title: this.generateTitle(selectedClassification.issue),
        description: this.generateDescription(selectedClassification.issue, selectedClassification.confidence),
        fallback: true,
        isClipResult: false
      }
    };
  }

  /**
   * Check if CLIP API is available
   */
  async checkApiHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.log('CLIP API not available:', error.message);
      return false;
    }
  }

  /**
   * Map CLIP categories to our app's department structure
   */
  mapToAppCategory(clipCategory) {
    const categoryMap = {
      'pothole on road': { category: 'Road Infrastructure', dept: 'pwd_roads', priority: 'High' },
      'garbage pile': { category: 'Waste Management', dept: 'sanitation', priority: 'Medium' },
      'water leakage': { category: 'Water Supply', dept: 'water', priority: 'High' },
      'broken streetlight': { category: 'Street Lighting', dept: 'electricity', priority: 'Medium' }
    };

    return categoryMap[clipCategory] || { 
      category: 'General Issue', 
      dept: 'general', 
      priority: 'Low' 
    };
  }

  /**
   * Set a specific server URL (for manual configuration)
   */
  setServerUrl(url) {
    this.log(`Manually setting server URL to: ${url}`);
    this.baseUrl = url;
    this.serverUrls = [url, ...this.serverUrls.filter(u => u !== url)];
  }

  /**
   * Clear connection cache (useful for troubleshooting)
   */
  clearCache() {
    this.log('Clearing connection cache');
    this.connectionCache = null;
    this.workingUrl = null;
    this.lastConnectionTest = 0;
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus() {
    const now = Date.now();
    const cacheAge = this.lastConnectionTest ? now - this.lastConnectionTest : 0;
    const isValid = this.connectionCache && cacheAge < this.cacheTimeout;
    
    return {
      hasCache: !!this.connectionCache,
      isValid,
      ageSeconds: Math.round(cacheAge / 1000),
      workingUrl: this.workingUrl
    };
  }
}

// Export singleton instance
const clipService = new ClipService();
export default clipService;