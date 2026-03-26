import * as ImagePicker from 'expo-image-picker';

// Image Service for React Native/Expo
class ImageService {
  
  // Request camera permissions
  async requestCameraPermissions() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  // Request media library permissions
  async requestMediaLibraryPermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  // Take photo with camera
  async takePhoto() {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        return { success: false, error: 'Camera permission denied' };
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          success: true,
          image: {
            uri: asset.uri,
            base64: asset.base64,
            width: asset.width,
            height: asset.height,
            type: 'image/jpeg',
            name: `photo_${Date.now()}.jpg`,
            data: `data:image/jpeg;base64,${asset.base64}`,
            uploadedAt: new Date().toISOString()
          }
        };
      }

      return { success: false, error: 'Photo capture cancelled' };
    } catch (error) {
      console.error('Take photo error:', error);
      return { success: false, error: error.message };
    }
  }

  // Pick image from gallery
  async pickImage() {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        return { success: false, error: 'Media library permission denied' };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          success: true,
          image: {
            uri: asset.uri,
            base64: asset.base64,
            width: asset.width,
            height: asset.height,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `image_${Date.now()}.jpg`,
            data: `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`,
            uploadedAt: new Date().toISOString()
          }
        };
      }

      return { success: false, error: 'Image selection cancelled' };
    } catch (error) {
      console.error('Pick image error:', error);
      return { success: false, error: error.message };
    }
  }

  // Pick multiple images
  async pickMultipleImages(maxImages = 3) {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        return { success: false, error: 'Media library permission denied' };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: maxImages,
        quality: 0.7,
        base64: true
      });

      if (!result.canceled && result.assets.length > 0) {
        const images = result.assets.map((asset, index) => ({
          uri: asset.uri,
          base64: asset.base64,
          width: asset.width,
          height: asset.height,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}_${index}.jpg`,
          data: `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`,
          uploadedAt: new Date().toISOString()
        }));

        return { success: true, images };
      }

      return { success: false, error: 'Image selection cancelled' };
    } catch (error) {
      console.error('Pick multiple images error:', error);
      return { success: false, error: error.message };
    }
  }

  // Process complaint images (for compatibility with web version)
  async processComplaintImages(images, onProgress = null) {
    try {
      // For mobile, images are already processed by ImagePicker
      if (onProgress) onProgress(100);
      return { success: true, images };
    } catch (error) {
      console.error('Process images error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get image data URL
  getImageDataUrl(imageData) {
    if (imageData && imageData.data) {
      return imageData.data;
    }
    if (imageData && imageData.uri) {
      return imageData.uri;
    }
    return null;
  }

  // Validate image
  validateImage(image) {
    const maxSize = 2 * 1024 * 1024; // 2MB
    
    if (image.base64 && image.base64.length > maxSize) {
      return { 
        valid: false, 
        error: 'Image size too large. Please select a smaller image.' 
      };
    }

    return { valid: true };
  }

  // Validate multiple images
  validateImages(images) {
    const errors = [];
    const maxFiles = 3;

    if (images.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} images allowed`);
    }

    images.forEach((image, index) => {
      const validation = this.validateImage(image);
      if (!validation.valid) {
        errors.push(`Image ${index + 1}: ${validation.error}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Show image picker options
  async showImagePickerOptions() {
    // This would typically show an action sheet in a real app
    // For now, we'll just return the available options
    return {
      camera: 'Take Photo',
      gallery: 'Choose from Gallery',
      multiple: 'Choose Multiple'
    };
  }
}

// Export singleton instance
const imageService = new ImageService();
export default imageService;