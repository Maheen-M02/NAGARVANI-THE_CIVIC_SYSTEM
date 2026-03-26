// Location Service for Web App
class LocationService {
  constructor() {
    this.debugMode = true;
  }

  log(message, data = null) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString().substr(11, 8);
      console.log(`[${timestamp}] [LocationService] ${message}`, data || '');
    }
  }

  /**
   * Check if geolocation is supported
   */
  isSupported() {
    return 'geolocation' in navigator;
  }

  /**
   * Get current location using browser geolocation API
   */
  async getCurrentLocation() {
    this.log('Getting current location...');
    
    if (!this.isSupported()) {
      return {
        success: false,
        error: 'Geolocation not supported',
        message: 'Your browser does not support location services'
      };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.log('Location obtained successfully', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });

          resolve({
            success: true,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            }
          });
        },
        (error) => {
          this.log('Error getting location:', error.message);
          
          let userMessage = 'Failed to get current location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              userMessage = 'Location access denied. Please allow location access and try again.';
              break;
            case error.POSITION_UNAVAILABLE:
              userMessage = 'Location information unavailable. Please check your GPS settings.';
              break;
            case error.TIMEOUT:
              userMessage = 'Location request timed out. Please try again.';
              break;
          }
          
          resolve({
            success: false,
            error: error.message,
            message: userMessage
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000
        }
      );
    });
  }

  /**
   * Reverse geocode coordinates to get address using a free API
   */
  async reverseGeocode(latitude, longitude) {
    this.log('Reverse geocoding coordinates...', { latitude, longitude });
    
    try {
      // Using OpenStreetMap Nominatim API (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'NagarVani-Web-App/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data && data.address) {
          const address = data.address;
          
          // Format address string
          const addressParts = [
            address.house_number,
            address.road,
            address.neighbourhood || address.suburb,
            address.city || address.town || address.village,
            address.state,
            address.postcode
          ].filter(Boolean);

          const formattedAddress = addressParts.join(', ');
          
          this.log('Reverse geocoding successful', { address: formattedAddress });
          
          return {
            success: true,
            address: {
              formatted: formattedAddress,
              road: address.road,
              neighbourhood: address.neighbourhood || address.suburb,
              city: address.city || address.town || address.village,
              state: address.state,
              postcode: address.postcode,
              country: address.country
            }
          };
        }
      }
      
      this.log('No address found for coordinates');
      return {
        success: false,
        error: 'No address found',
        message: 'Could not determine address for this location'
      };
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
}

// Export singleton instance
const locationService = new LocationService();
export default locationService;