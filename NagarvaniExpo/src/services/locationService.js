import * as Location from 'expo-location';

class LocationService {
  constructor() {
    this.debugMode = true;
    this.locationCache = null;
    this.cacheTimeout = 60000; // 1 minute cache for location
    this.lastLocationTime = 0;
  }

  log(message, data = null) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString().substring(11, 19);
      console.log(`[${timestamp}] [LocationService] ${message}`, data || '');
    }
  }

  /**
   * Request location permissions
   */
  async requestPermissions() {
    this.log('Requesting location permissions...');
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        this.log('Location permission denied');
        return {
          success: false,
          error: 'Location permission denied',
          message: 'Please enable location access in Settings to auto-tag complaint location'
        };
      }
      
      this.log('Location permission granted');
      return { success: true };
    } catch (error) {
      this.log('Error requesting location permissions:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to request location permissions'
      };
    }
  }

  /**
   * Get current location with optimized settings for speed and caching
   */
  async getCurrentLocationFast() {
    this.log('Getting current location (fast mode)...');
    
    const now = Date.now();
    
    // Return cached location if still valid (within 1 minute)
    if (this.locationCache && (now - this.lastLocationTime) < this.cacheTimeout) {
      this.log('Using cached location', {
        age: Math.round((now - this.lastLocationTime) / 1000) + 's',
        accuracy: this.locationCache.location.accuracy
      });
      return this.locationCache;
    }
    
    try {
      // Check permissions first
      const permissionResult = await this.requestPermissions();
      if (!permissionResult.success) {
        return permissionResult;
      }

      // Use balanced accuracy for speed
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Faster than High accuracy
        timeout: 6000, // Reduced timeout for speed
        maximumAge: 45000, // Accept cached location up to 45 seconds old
      });

      this.log('Fast location obtained', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy
      });

      const result = {
        success: true,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        }
      };
      
      // Cache the result
      this.locationCache = result;
      this.lastLocationTime = now;
      
      return result;
    } catch (error) {
      this.log('Fast location error:', error.message);
      
      let userMessage = 'Failed to get current location';
      if (error.code === 'E_LOCATION_TIMEOUT') {
        userMessage = 'Location request timed out';
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        userMessage = 'Location services unavailable';
      }
      
      return {
        success: false,
        error: error.message,
        message: userMessage
      };
    }
  }
  async getCurrentLocation() {
    this.log('Getting current location...');
    
    try {
      // Check permissions first
      const permissionResult = await this.requestPermissions();
      if (!permissionResult.success) {
        return permissionResult;
      }

      // Get location with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000, // 15 second timeout
        maximumAge: 10000, // Accept cached location up to 10 seconds old
      });

      this.log('Location obtained successfully', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy
      });

      return {
        success: true,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        }
      };
    } catch (error) {
      this.log('Error getting location:', error.message);
      
      let userMessage = 'Failed to get current location';
      if (error.code === 'E_LOCATION_TIMEOUT') {
        userMessage = 'Location request timed out. Please try again.';
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        userMessage = 'Location services unavailable. Please check GPS settings.';
      }
      
      return {
        success: false,
        error: error.message,
        message: userMessage
      };
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(latitude, longitude) {
    this.log('Reverse geocoding coordinates...', { latitude, longitude });
    
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        
        // Format address string
        const addressParts = [
          address.name,
          address.street,
          address.district,
          address.city,
          address.region,
          address.postalCode
        ].filter(Boolean);

        const formattedAddress = addressParts.join(', ');
        
        this.log('Reverse geocoding successful', { address: formattedAddress });
        
        return {
          success: true,
          address: {
            formatted: formattedAddress,
            name: address.name,
            street: address.street,
            district: address.district,
            city: address.city,
            region: address.region,
            postalCode: address.postalCode,
            country: address.country
          }
        };
      } else {
        this.log('No address found for coordinates');
        return {
          success: false,
          error: 'No address found',
          message: 'Could not determine address for this location'
        };
      }
    } catch (error) {
      this.log('Reverse geocoding error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get address for location'
      };
    }
  }

  /**
   * Get location with address (combined function)
   */
  async getLocationWithAddress() {
    this.log('Getting location with address...');
    
    // Get current location
    const locationResult = await this.getCurrentLocation();
    if (!locationResult.success) {
      return locationResult;
    }

    const { latitude, longitude } = locationResult.location;

    // Get address for location
    const addressResult = await this.reverseGeocode(latitude, longitude);
    
    return {
      success: true,
      location: locationResult.location,
      address: addressResult.success ? addressResult.address : null,
      addressError: addressResult.success ? null : addressResult.message
    };
  }

  /**
   * Format location for display
   */
  formatLocationForDisplay(locationData) {
    if (!locationData || !locationData.location) {
      return 'Location not available';
    }

    const { latitude, longitude, accuracy } = locationData.location;
    const address = locationData.address;

    if (address && address.formatted) {
      return `${address.formatted} (±${Math.round(accuracy)}m)`;
    } else {
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`;
    }
  }

  /**
   * Check if location services are enabled
   */
  async isLocationEnabled() {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      this.log('Location services enabled:', enabled);
      return enabled;
    } catch (error) {
      this.log('Error checking location services:', error.message);
      return false;
    }
  }

  /**
   * Clear location cache (useful for troubleshooting)
   */
  clearCache() {
    this.log('Clearing location cache');
    this.locationCache = null;
    this.lastLocationTime = 0;
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus() {
    const now = Date.now();
    const cacheAge = this.lastLocationTime ? now - this.lastLocationTime : 0;
    const isValid = this.locationCache && cacheAge < this.cacheTimeout;
    
    return {
      hasCache: !!this.locationCache,
      isValid,
      ageSeconds: Math.round(cacheAge / 1000),
      accuracy: this.locationCache?.location?.accuracy
    };
  }
}

// Export singleton instance
const locationService = new LocationService();
export default locationService;