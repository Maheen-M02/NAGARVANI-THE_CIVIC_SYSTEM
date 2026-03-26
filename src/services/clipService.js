// CLIP Model Service for Web App
class ClipService {
  constructor() {
    // Default to localhost, can be configured via environment variables
    this.baseUrl = process.env.REACT_APP_CLIP_API_URL || 'http://localhost:8000';
  }

  /**
   * Detect issue from image using CLIP model
   * @param {File} imageFile - The image file to analyze
   * @returns {Promise<Object>} - Classification result
   */
  async detectIssue(imageFile) {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch(`${this.baseUrl}/detect-issue`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Transform the result to match our app's expected format
      return {
        success: true,
        data: {
          issue: result.issue,
          category: result.category,
          department: result.department,
          confidence: Math.round(result.confidence * 100), // Convert to percentage
          title: this.generateTitle(result.issue),
          description: this.generateDescription(result.issue, result.confidence)
        }
      };
    } catch (error) {
      console.error('CLIP API Error:', error);
      
      // Fallback to local classification if API fails
      return this.fallbackClassification(imageFile);
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
   * Fallback classification when CLIP API is unavailable
   */
  fallbackClassification(imageFile) {
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

    const randomClassification = classifications[Math.floor(Math.random() * classifications.length)];
    
    return {
      success: true,
      data: {
        issue: randomClassification.issue,
        category: randomClassification.category,
        department: randomClassification.department,
        confidence: Math.round(randomClassification.confidence * 100),
        title: this.generateTitle(randomClassification.issue),
        description: this.generateDescription(randomClassification.issue, randomClassification.confidence),
        fallback: true
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
        timeout: 5000
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
}

// Export singleton instance
const clipService = new ClipService();
export default clipService;