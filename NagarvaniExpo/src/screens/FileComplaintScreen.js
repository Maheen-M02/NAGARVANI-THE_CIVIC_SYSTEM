import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { aiTriage, aiImageClassification } from '../data/aiTriage';
import { SAMPLE_COMPLAINTS } from '../data/seed';
import clipService from '../services/clipService'; // Import CLIP service for debugging
import locationService from '../services/locationService'; // Import location service

const FileComplaintScreen = ({ navigation, route }) => {
  const { submitComplaint, notify, addNotification } = useApp();
  const [step, setStep] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [gpsCapturing, setGpsCapturing] = useState(false); // Add GPS loading state
  const [processingPhoto, setProcessingPhoto] = useState(false); // Add parallel processing state
  const [triage, setTriage] = useState(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    location: '',
    ward: '',
    title: '',
    description: '',
    photo: null,
    gpsLocation: null, // Add GPS location
    gpsAddress: null,  // Add GPS address
  });

  const photoMode = route?.params?.photoMode;

  React.useEffect(() => {
    if (photoMode) {
      setStep(2);
      handleTakePhoto();
    }
    
    // Test CLIP connection on component mount
    testClipConnection();
  }, [photoMode]);

  const testClipConnection = async () => {
    console.log('🔍 Testing CLIP connection...');
    try {
      const result = await clipService.testConnection();
      if (result.success) {
        console.log('✅ CLIP connection successful:', result.data);
      } else {
        console.log('❌ CLIP connection failed:', result.error);
      }
    } catch (error) {
      console.log('❌ CLIP connection test error:', error);
    }
  };

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleTakePhoto = async () => {
    try {
      console.log('🔍 Starting photo capture process...');
      
      // Request camera permissions
      console.log('📋 Requesting camera permissions...');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📋 Camera permission status:', status);
      
      if (status !== 'granted') {
        console.log('❌ Camera permission denied');
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        return;
      }

      console.log('✅ Camera permission granted, showing photo options...');
      Alert.alert(
        'Select Photo',
        'Choose how you want to add a photo',
        [
          { text: 'Camera', onPress: () => {
            console.log('📷 User selected Camera');
            openCamera();
          }},
          { text: 'Gallery', onPress: () => {
            console.log('🖼️ User selected Gallery');
            openGallery();
          }},
          { text: 'Cancel', style: 'cancel', onPress: () => {
            console.log('❌ User cancelled photo selection');
          }},
        ]
      );
    } catch (error) {
      console.error('❌ Error in handleTakePhoto:', error);
      Alert.alert('Error', `Failed to start photo capture: ${error.message}`);
    }
  };

  const openCamera = async () => {
    try {
      console.log('📷 Opening camera...');
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Correct API
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // Reduced quality for faster processing
      });

      console.log('📷 Camera result:', { 
        canceled: result.canceled, 
        hasAssets: !!result.assets, 
        assetsLength: result.assets?.length 
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const photo = result.assets[0];
        console.log('✅ Photo captured successfully:', {
          uri: photo.uri?.substring(0, 50) + '...',
          width: photo.width,
          height: photo.height,
          type: photo.type
        });
        
        updateForm('photo', photo);
        
        // Show processing state
        setProcessingPhoto(true);
        notify('📸 Photo captured! Processing GPS and AI analysis...', 'info');
        
        // Run GPS capture and AI analysis in parallel for speed
        const startTime = Date.now();
        console.log('🚀 Starting parallel GPS and AI processing...');
        
        const [gpsResult, aiResult] = await Promise.allSettled([
          captureGPSLocation(),
          analyzePhoto(photo)
        ]);
        
        const processingTime = Date.now() - startTime;
        console.log('✅ Parallel processing completed in', processingTime, 'ms');
        
        // Log results and show summary
        let successCount = 0;
        if (gpsResult.status === 'fulfilled') {
          console.log('GPS processing: Success');
          successCount++;
        } else {
          console.log('GPS processing failed:', gpsResult.reason);
        }
        
        if (aiResult.status === 'fulfilled') {
          console.log('AI processing: Success');
          successCount++;
        } else {
          console.log('AI processing failed:', aiResult.reason);
        }
        
        // Show performance summary
        addNotification({
          type: 'processing_complete',
          title: 'Processing Complete',
          message: `${successCount}/2 tasks completed in ${(processingTime/1000).toFixed(1)}s`,
          icon: '⚡',
          priority: 'Low'
        });
        
        setProcessingPhoto(false);
      } else {
        console.log('❌ Photo capture cancelled or failed');
        if (result.canceled) {
          console.log('User cancelled photo capture');
        } else {
          console.log('No photo assets returned');
        }
      }
    } catch (error) {
      console.error('❌ Error in openCamera:', error);
      Alert.alert('Camera Error', `Failed to open camera: ${error.message}`);
      setProcessingPhoto(false);
    }
  };

  const openGallery = async () => {
    try {
      console.log('🖼️ Opening gallery...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Correct API
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // Reduced quality for faster processing
      });

      console.log('🖼️ Gallery result:', { 
        canceled: result.canceled, 
        hasAssets: !!result.assets, 
        assetsLength: result.assets?.length 
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const photo = result.assets[0];
        console.log('✅ Photo selected successfully:', {
          uri: photo.uri?.substring(0, 50) + '...',
          width: photo.width,
          height: photo.height,
          type: photo.type
        });
        
        updateForm('photo', photo);
        
        // Show processing state
        setProcessingPhoto(true);
        notify('📸 Photo selected! Processing GPS and AI analysis...', 'info');
        
        // Run GPS capture and AI analysis in parallel for speed
        const startTime = Date.now();
        console.log('🚀 Starting parallel GPS and AI processing...');
        
        const [gpsResult, aiResult] = await Promise.allSettled([
          captureGPSLocation(),
          analyzePhoto(photo)
        ]);
        
        const processingTime = Date.now() - startTime;
        console.log('✅ Parallel processing completed in', processingTime, 'ms');
        
        // Log results and show summary
        let successCount = 0;
        if (gpsResult.status === 'fulfilled') {
          console.log('GPS processing: Success');
          successCount++;
        } else {
          console.log('GPS processing failed:', gpsResult.reason);
        }
        
        if (aiResult.status === 'fulfilled') {
          console.log('AI processing: Success');
          successCount++;
        } else {
          console.log('AI processing failed:', aiResult.reason);
        }
        
        // Show performance summary
        addNotification({
          type: 'processing_complete',
          title: 'Processing Complete',
          message: `${successCount}/2 tasks completed in ${(processingTime/1000).toFixed(1)}s`,
          icon: '⚡',
          priority: 'Low'
        });
        
        setProcessingPhoto(false);
      } else {
        console.log('❌ Photo selection cancelled or failed');
        if (result.canceled) {
          console.log('User cancelled photo selection');
        } else {
          console.log('No photo assets returned');
        }
      }
    } catch (error) {
      console.error('❌ Error in openGallery:', error);
      Alert.alert('Gallery Error', `Failed to open gallery: ${error.message}`);
      setProcessingPhoto(false);
    }
  };

  const captureGPSLocation = async () => {
    if (gpsCapturing) return; // Prevent multiple simultaneous calls
    
    setGpsCapturing(true);
    const startTime = Date.now();
    
    try {
      console.log('📍 Capturing GPS location...');
      
      // Use faster, cached location if available
      const locationResult = await locationService.getCurrentLocationFast();
      
      if (locationResult.success) {
        updateForm('gpsLocation', locationResult.location);
        
        // Auto-fill location field if empty (use shorter address)
        if (!form.location) {
          if (locationResult.address) {
            const shortAddress = locationResult.address.formatted.split(',').slice(0, 2).join(', ');
            updateForm('location', shortAddress);
          } else {
            // Use coordinates as fallback
            const coords = `${locationResult.location.latitude.toFixed(4)}, ${locationResult.location.longitude.toFixed(4)}`;
            updateForm('location', coords);
          }
        }
        
        // Get address in background (don't wait for it)
        if (!locationResult.address) {
          locationService.reverseGeocode(locationResult.location.latitude, locationResult.location.longitude)
            .then(addressResult => {
              if (addressResult.success) {
                updateForm('gpsAddress', addressResult.address);
              }
            });
        } else {
          updateForm('gpsAddress', locationResult.address);
        }
        
        console.log('✅ GPS location captured in', Date.now() - startTime, 'ms');
        
        addNotification({
          type: 'gps_captured',
          title: 'Location Tagged',
          message: `GPS location captured (±${Math.round(locationResult.location.accuracy)}m)`,
          icon: '📍',
          priority: 'Low'
        });
        
      } else {
        console.log('❌ GPS capture failed:', locationResult.error);
        
        // Don't show alert for quick failures - just log
        if (!locationResult.error.includes('denied')) {
          notify('📍 Location capture failed, you can enter manually', 'info');
        }
      }
    } catch (error) {
      console.log('❌ GPS capture error:', error);
    } finally {
      setGpsCapturing(false);
    }
  };

  const analyzePhoto = async (photo) => {
    console.log('🤖 Starting photo analysis...', {
      hasPhoto: !!photo,
      photoUri: photo?.uri?.substring(0, 50) + '...',
      photoType: photo?.type
    });
    
    setPhotoAnalyzing(true);
    const startTime = Date.now();
    
    try {
      // Use CLIP service for AI image classification
      console.log('🤖 Calling aiImageClassification...');
      const classification = await aiImageClassification(photo);
      console.log('🤖 Classification result:', classification);
      
      updateForm('title', classification.title);
      updateForm('description', classification.description);
      
      // Store the classification result for later use in triage
      updateForm('photo', { 
        ...photo, 
        ...classification 
      });
      
      console.log('✅ Photo analysis completed in', Date.now() - startTime, 'ms');
      
      // Enhanced notification message based on analysis type
      const notificationMessage = classification.fallback 
        ? `AI analyzed your photo (offline mode): "${classification.title}"`
        : `AI analyzed your photo with ${classification.confidence}% confidence: "${classification.title}"`;
      
      addNotification({
        type: 'photo_analyzed',
        title: 'Photo Analysis Complete',
        message: notificationMessage,
        icon: classification.isClipResult ? '🤖' : '🔄',
        priority: 'Medium'
      });
      
      setPhotoAnalyzing(false);
      notify(
        classification.fallback 
          ? 'Photo analyzed (offline mode)! Please fill in your contact details.'
          : 'Photo analyzed with AI! Please fill in your contact details.', 
        'success'
      );
      setStep(1);
    } catch (error) {
      console.error('❌ Photo analysis failed:', error);
      setPhotoAnalyzing(false);
      notify('Photo analysis failed. Please try again or fill details manually.', 'error');
      
      // Still allow the user to continue with manual entry
      setStep(1);
    }
  };

  const loadSample = (sample) => {
    setForm(prev => ({ ...prev, ...sample }));
    notify('Sample loaded!', 'info');
  };

  const analyze = async () => {
    if (!form.title || !form.description) {
      notify('Fill in complaint title and description', 'error');
      return;
    }

    if (form.photo && triage) {
      setStep(3);
      return;
    }

    setAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    // Pass the enhanced photo object with CLIP analysis if available
    const triageData = form.photo 
      ? aiTriage(form.description + ' ' + form.title, form.photo)
      : aiTriage(form.description + ' ' + form.title);
    
    setTriage(triageData);
    
    // Enhanced notification message based on analysis type
    let analysisMessage = `Your complaint has been classified as "${triageData.category}" with ${triageData.confidence}% confidence and routed to ${triageData.department.name}`;
    
    if (triageData.clipAnalysis && !triageData.fallbackUsed) {
      analysisMessage += ' (Enhanced by CLIP AI vision)';
    } else if (triageData.fallbackUsed) {
      analysisMessage += ' (Using offline analysis)';
    }
    
    addNotification({
      type: 'ai_triage',
      title: 'AI Analysis Complete',
      message: analysisMessage,
      icon: triageData.clipAnalysis ? '🤖' : '🔄',
      priority: triageData.priority,
      department: triageData.department.name
    });
    
    setAnalyzing(false);
    setStep(3);
  };

  const doSubmit = () => {
    if (!form.name || !form.phone || !form.location) {
      notify('Fill all required fields', 'error');
      return;
    }
    
    // Include GPS data in complaint
    const complaintData = {
      ...form,
      gpsCoordinates: form.gpsLocation ? {
        latitude: form.gpsLocation.latitude,
        longitude: form.gpsLocation.longitude,
        accuracy: form.gpsLocation.accuracy,
        timestamp: form.gpsLocation.timestamp,
      } : null,
      gpsAddress: form.gpsAddress,
    };
    
    const complaint = submitComplaint(complaintData);
    navigation.navigate('ComplaintSuccess', { complaint });
  };

  const nextStep = async () => {
    if (step === 1) {
      if (!form.name || !form.phone || !form.location) {
        notify('Fill required fields', 'error');
        return;
      }
      
      if (form.photo && form.title && form.description && !triage) {
        setAnalyzing(true);
        await new Promise(resolve => setTimeout(resolve, 1800));
        const triageData = aiTriage(form.description + ' ' + form.title, form.photo);
        setTriage(triageData);
        
        addNotification({
          type: 'ai_triage',
          title: 'AI Analysis Complete',
          message: `Your complaint has been classified as "${triageData.category}" with ${triageData.confidence}% confidence and routed to ${triageData.department.name}`,
          icon: '🎯',
          priority: triageData.priority,
          department: triageData.department.name
        });
        
        setAnalyzing(false);
        setStep(3);
      } else if (form.photo && form.title && form.description && triage) {
        setStep(3);
      } else {
        setStep(2);
      }
    } else if (step === 2) {
      analyze();
    } else if (step === 3) {
      setStep(4);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[
        { num: '1', label: 'Your Info' },
        { num: '2', label: 'Complaint' },
        { num: '3', label: 'AI Review' },
        { num: '4', label: 'Submit' },
      ].map((stepItem, index) => (
        <React.Fragment key={stepItem.num}>
          <View style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              {
                backgroundColor: step > index + 1 ? '#22C55E' : step === index + 1 ? '#0A7EA4' : '#E2E8F0',
              }
            ]}>
              <Text style={[
                styles.stepNumber,
                { color: step >= index + 1 ? '#fff' : '#94A3B8' }
              ]}>
                {step > index + 1 ? '✓' : stepItem.num}
              </Text>
            </View>
            <Text style={[
              styles.stepLabel,
              { color: step === index + 1 ? '#0A7EA4' : '#94A3B8' }
            ]}>
              {stepItem.label}
            </Text>
          </View>
          {index < 3 && (
            <View style={[
              styles.stepLine,
              { backgroundColor: step > index + 1 ? '#22C55E' : '#E2E8F0' }
            ]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>File Complaint</Text>
        </View>

        {renderStepIndicator()}

        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Information</Text>
            
            {form.photo && form.title && (
              <View style={styles.photoAnalysisResult}>
                <Text style={styles.analysisIcon}>🤖</Text>
                <View>
                  <Text style={styles.analysisTitle}>AI Analysis Complete</Text>
                  <Text style={styles.analysisText}>
                    Complaint details auto-filled: "{form.title}"
                  </Text>
                </View>
              </View>
            )}
            
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              value={form.name}
              onChangeText={(text) => updateForm('name', text)}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              value={form.phone}
              onChangeText={(text) => updateForm('phone', text)}
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Location *"
              value={form.location}
              onChangeText={(text) => updateForm('location', text)}
            />
            
            {/* GPS Location Display */}
            {form.gpsLocation && (
              <View style={styles.gpsLocationDisplay}>
                <Text style={styles.gpsLocationLabel}>📍 GPS Location Captured</Text>
                <Text style={styles.gpsLocationText}>
                  {locationService.formatLocationForDisplay({
                    location: form.gpsLocation,
                    address: form.gpsAddress
                  })}
                </Text>
                <Text style={styles.gpsLocationAccuracy}>
                  Accuracy: ±{Math.round(form.gpsLocation.accuracy)}m
                </Text>
              </View>
            )}
            
            <TextInput
              style={styles.input}
              placeholder="Ward/Pincode"
              value={form.ward}
              onChangeText={(text) => updateForm('ward', text)}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Describe Your Complaint</Text>
            <Text style={styles.cardSubtitle}>
              Take a photo or describe the issue. Our AI will classify and route it automatically.
            </Text>
            
            {/* Photo Section */}
            <View style={styles.photoSection}>
              <Text style={styles.sectionLabel}>📸 Visual Evidence (Optional)</Text>
              
              {/* API Test Button */}
              <TouchableOpacity 
                style={[styles.photoButton, { backgroundColor: '#8B5CF6', marginBottom: 10 }]} 
                onPress={() => {
                  console.log('🔍 Testing ImagePicker API...');
                  console.log('ImagePicker object:', Object.keys(ImagePicker));
                  console.log('MediaTypeOptions:', ImagePicker.MediaTypeOptions);
                  console.log('MediaType (deprecated):', ImagePicker.MediaType);
                  
                  Alert.alert(
                    'ImagePicker API Test',
                    `MediaTypeOptions: ${ImagePicker.MediaTypeOptions ? 'Available' : 'Missing'}\n` +
                    `MediaType (old): ${ImagePicker.MediaType ? 'Available' : 'Missing'}\n` +
                    `Images option: ${ImagePicker.MediaTypeOptions?.Images || 'Not found'}`,
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Text style={styles.photoButtonIcon}>🔍</Text>
                <Text style={styles.photoButtonText}>Test ImagePicker API</Text>
              </TouchableOpacity>

              {/* Simple Photo Test Button */}
              <TouchableOpacity 
                style={[styles.photoButton, { backgroundColor: '#F59E0B', marginBottom: 10 }]} 
                onPress={async () => {
                  try {
                    console.log('🧪 Testing simple photo capture...');
                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== 'granted') {
                      Alert.alert('Permission needed', 'Camera permission required');
                      return;
                    }
                    
                    const result = await ImagePicker.launchCameraAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      allowsEditing: false,
                      quality: 0.5,
                    });
                    
                    if (!result.canceled && result.assets?.[0]) {
                      updateForm('photo', result.assets[0]);
                      Alert.alert('Success!', 'Photo captured successfully! Check the preview below.');
                    } else {
                      Alert.alert('Info', 'Photo capture was cancelled');
                    }
                  } catch (error) {
                    Alert.alert('Error', `Simple test failed: ${error.message}`);
                    console.error('Simple photo test error:', error);
                  }
                }}
              >
                <Text style={styles.photoButtonIcon}>🧪</Text>
                <Text style={styles.photoButtonText}>Simple Photo Test</Text>
              </TouchableOpacity>

              {/* System Status Button */}
              <TouchableOpacity 
                style={[styles.photoButton, { backgroundColor: '#0EA5E9', marginBottom: 10 }]} 
                onPress={async () => {
                  const clipStatus = clipService.getCacheStatus();
                  const locationStatus = locationService.getCacheStatus();
                  const result = await clipService.testConnection();
                  Alert.alert(
                    'System Status',
                    `🤖 CLIP: ${result.success ? '✅ Connected' : '❌ Failed'}\n` +
                    `Mode: ${result.data?.mode || 'Unknown'}\n` +
                    `Cache: ${clipStatus.isValid ? `Valid (${clipStatus.ageSeconds}s)` : 'Invalid'}\n\n` +
                    `📍 GPS Cache: ${locationStatus.isValid ? `Valid (${locationStatus.ageSeconds}s)` : 'Invalid'}\n` +
                    `Accuracy: ${locationStatus.accuracy ? `±${Math.round(locationStatus.accuracy)}m` : 'N/A'}`,
                    [
                      { text: 'Clear Caches', onPress: () => {
                        clipService.clearCache();
                        locationService.clearCache();
                        notify('Caches cleared', 'info');
                      }},
                      { text: 'OK' }
                    ]
                  );
                }}
              >
                <Text style={styles.photoButtonIcon}>🧪</Text>
                <Text style={styles.photoButtonText}>System Status</Text>
              </TouchableOpacity>

              {/* GPS Location Capture Button */}
              <TouchableOpacity 
                style={[
                  styles.photoButton, 
                  { 
                    backgroundColor: gpsCapturing ? '#94A3B8' : '#22C55E', 
                    marginBottom: 10 
                  }
                ]} 
                onPress={captureGPSLocation}
                disabled={gpsCapturing}
              >
                <Text style={styles.photoButtonIcon}>
                  {gpsCapturing ? '⏳' : '📍'}
                </Text>
                <Text style={styles.photoButtonText}>
                  {gpsCapturing ? 'Capturing GPS...' : 'Capture GPS Location'}
                </Text>
                {gpsCapturing && (
                  <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />
                )}
              </TouchableOpacity>
              
              {!form.photo ? (
                <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                  <Text style={styles.photoButtonIcon}>📷</Text>
                  <Text style={styles.photoButtonText}>Take Photo</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: form.photo.uri }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => updateForm('photo', null)}
                  >
                    <Text style={styles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                  {(photoAnalyzing || gpsCapturing || processingPhoto) && (
                    <View style={styles.analyzingContainer}>
                      <ActivityIndicator size="small" color="#0A7EA4" />
                      <Text style={styles.analyzingText}>
                        {processingPhoto ? 'Processing GPS & AI analysis...' :
                         photoAnalyzing ? 'AI analyzing photo...' :
                         gpsCapturing ? 'Capturing GPS location...' : 'Processing...'}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Sample Complaints */}
            <View style={styles.samplesSection}>
              <Text style={styles.sectionLabel}>⚡ Quick fill examples:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {SAMPLE_COMPLAINTS.map((sample, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.sampleButton}
                    onPress={() => loadSample(sample)}
                  >
                    <Text style={styles.sampleText}>
                      {sample.title.slice(0, 28)}...
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Complaint Title *"
              value={form.title}
              onChangeText={(text) => updateForm('title', text)}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detailed Description *"
              value={form.description}
              onChangeText={(text) => updateForm('description', text)}
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {step === 3 && triage && (
          <View style={styles.card}>
            <View style={styles.triageHeader}>
              <View style={styles.triageIcon}>
                <Text style={styles.triageIconText}>🤖</Text>
              </View>
              <View>
                <Text style={styles.triageTitle}>AI Triage Complete</Text>
                <Text style={styles.triageConfidence}>
                  ✓ {triage.confidence}% confidence
                  {form.photo && <Text style={styles.photoBoost}> 📸 +Photo boost</Text>}
                </Text>
              </View>
            </View>
            
            <View style={styles.triageGrid}>
              <View style={styles.triageItem}>
                <Text style={styles.triageLabel}>🏷️ Category</Text>
                <Text style={styles.triageValue}>{triage.category}</Text>
              </View>
              <View style={styles.triageItem}>
                <Text style={styles.triageLabel}>🏛️ Department</Text>
                <Text style={styles.triageValue}>
                  {triage.department?.icon} {triage.department?.name}
                </Text>
              </View>
              <View style={styles.triageItem}>
                <Text style={styles.triageLabel}>⚡ Priority</Text>
                <Text style={styles.triageValue}>{triage.priority}</Text>
              </View>
              <View style={styles.triageItem}>
                <Text style={styles.triageLabel}>⏱️ SLA</Text>
                <Text style={styles.triageValue}>{triage.slaHours} hours</Text>
              </View>
            </View>

            {form.photo && (
              <View style={styles.photoEvidence}>
                <Text style={styles.evidenceLabel}>📸 VISUAL EVIDENCE</Text>
                <View style={styles.evidenceContent}>
                  <Image source={{ uri: form.photo.uri }} style={styles.evidenceImage} />
                  <View>
                    <Text style={styles.evidenceTitle}>Photo Evidence Attached</Text>
                    <Text style={styles.evidenceBoost}>+15% AI Confidence Boost</Text>
                  </View>
                </View>
              </View>
            )}

            {triage.officer && (
              <View style={styles.officerSection}>
                <Text style={styles.officerLabel}>👮 ASSIGNED OFFICER</Text>
                <View style={styles.officerContent}>
                  <View style={styles.officerAvatar}>
                    <Text style={styles.officerAvatarText}>{triage.officer.avatar}</Text>
                  </View>
                  <View>
                    <Text style={styles.officerName}>{triage.officer.name}</Text>
                    <Text style={styles.officerStats}>
                      ⭐ {triage.officer.rating} • {triage.officer.load}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {step === 4 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Review & Submit</Text>
            <View style={styles.reviewSection}>
              {form.photo && (
                <View style={styles.reviewPhotoContainer}>
                  <Image source={{ uri: form.photo.uri }} style={styles.reviewPhoto} />
                  <Text style={styles.reviewPhotoLabel}>📸 Photo Evidence Attached</Text>
                </View>
              )}
              
              <Text style={styles.reviewTitle}>{form.title}</Text>
              <Text style={styles.reviewDescription}>{form.description}</Text>
              
              <View style={styles.reviewMeta}>
                <Text style={styles.reviewMetaItem}>👤 {form.name}</Text>
                <Text style={styles.reviewMetaItem}>📍 {form.location}</Text>
                <Text style={styles.reviewMetaItem}>🏷️ {triage?.category}</Text>
                <Text style={styles.reviewMetaItem}>⚡ {triage?.priority}</Text>
                {form.photo && (
                  <Text style={[styles.reviewMetaItem, styles.photoMeta]}>📸 +Photo</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setStep(step - 1)}
            >
              <Text style={styles.secondaryButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.primaryButton, { flex: step > 1 ? 1 : undefined }]}
            onPress={step === 4 ? doSubmit : nextStep}
            disabled={analyzing}
          >
            {analyzing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {step === 4 ? '✅ Submit Complaint' : 
                 step === 2 ? '🤖 Analyze with AI →' :
                 form.photo && form.title ? 'Review AI Analysis →' : 'Next →'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1E2845',
  },
  backButton: {
    color: '#0A7EA4',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E2845',
    marginBottom: 18,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  photoAnalysisResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E15',
    borderColor: '#22C55E30',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 12,
  },
  analysisIcon: {
    fontSize: 20,
  },
  analysisTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 2,
  },
  analysisText: {
    fontSize: 12,
    color: '#64748B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  photoSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 8,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  photoButtonIcon: {
    fontSize: 20,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoPreview: {
    position: 'relative',
    alignItems: 'center',
  },
  photoImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: 70,
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  analyzingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A7EA4',
  },
  samplesSection: {
    marginBottom: 16,
  },
  sampleButton: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sampleText: {
    fontSize: 11,
    color: '#64748B',
  },
  triageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  triageIcon: {
    width: 44,
    height: 44,
    backgroundColor: '#22C55E18',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triageIconText: {
    fontSize: 22,
  },
  triageTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1E2845',
  },
  triageConfidence: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  photoBoost: {
    color: '#0A7EA4',
  },
  triageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  triageItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  triageLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 3,
  },
  triageValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E2845',
  },
  photoEvidence: {
    padding: 12,
    backgroundColor: '#22C55E08',
    borderWidth: 1,
    borderColor: '#22C55E20',
    borderRadius: 10,
    marginBottom: 16,
  },
  evidenceLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 8,
  },
  evidenceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  evidenceImage: {
    width: 60,
    height: 45,
    borderRadius: 6,
  },
  evidenceTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E2845',
  },
  evidenceBoost: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  officerSection: {
    padding: 14,
    backgroundColor: '#0A7EA408',
    borderWidth: 1,
    borderColor: '#0A7EA420',
    borderRadius: 10,
  },
  officerLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 8,
  },
  officerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  officerAvatar: {
    width: 36,
    height: 36,
    backgroundColor: '#0A7EA4',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  officerAvatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  officerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E2845',
  },
  officerStats: {
    fontSize: 11,
    color: '#64748B',
  },
  reviewSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 18,
    marginBottom: 20,
  },
  reviewPhotoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewPhoto: {
    width: 300,
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  reviewPhotoLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#22C55E',
    marginTop: 6,
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E2845',
    marginBottom: 6,
  },
  reviewDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  reviewMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reviewMetaItem: {
    fontSize: 12,
    color: '#64748B',
  },
  photoMeta: {
    color: '#22C55E',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#0A7EA4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
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
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gpsLocationDisplay: {
    backgroundColor: '#22C55E08',
    borderWidth: 1,
    borderColor: '#22C55E30',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  gpsLocationLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 4,
  },
  gpsLocationText: {
    fontSize: 13,
    color: '#1E2845',
    marginBottom: 2,
  },
  gpsLocationAccuracy: {
    fontSize: 11,
    color: '#64748B',
  },
});

export default FileComplaintScreen;