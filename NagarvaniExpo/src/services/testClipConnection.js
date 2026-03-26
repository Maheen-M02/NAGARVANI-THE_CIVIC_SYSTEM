// Test CLIP connection for debugging
export async function testClipConnection() {
  const baseUrl = 'http://10.17.113.216:8000';
  
  console.log('🔍 Testing CLIP connection...');
  console.log('Target URL:', baseUrl);
  
  try {
    // Test 1: Basic health check
    console.log('📡 Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      timeout: 10000,
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check successful:', healthData);
      
      // Test 2: Model info
      console.log('🤖 Testing model info...');
      const modelResponse = await fetch(`${baseUrl}/model-info`);
      const modelData = await modelResponse.json();
      console.log('✅ Model info:', modelData);
      
      return {
        success: true,
        health: healthData,
        model: modelData,
        message: 'Connection successful'
      };
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
      return {
        success: false,
        error: `HTTP ${healthResponse.status}`,
        message: 'Server responded but with error'
      };
    }
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('Error details:', error);
    
    // Check if it's a network error
    if (error.message.includes('Network request failed')) {
      return {
        success: false,
        error: 'Network request failed',
        message: 'Cannot reach server. Check IP address and network connection.',
        suggestions: [
          'Ensure your phone/emulator is on the same WiFi network',
          'Check if Windows Firewall is blocking port 8000',
          'Try using your computer\'s hotspot',
          'Verify the IP address is correct'
        ]
      };
    }
    
    return {
      success: false,
      error: error.message,
      message: 'Connection test failed'
    };
  }
}

// Test with a simple image
export async function testClipClassification() {
  const baseUrl = 'http://10.17.113.216:8000';
  
  try {
    console.log('📸 Testing image classification...');
    
    // Create a simple test image (base64 encoded 1x1 pixel)
    const testImageBlob = new Blob([
      new Uint8Array([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43
      ])
    ], { type: 'image/jpeg' });
    
    const formData = new FormData();
    formData.append('file', testImageBlob, 'test.jpg');
    
    const response = await fetch(`${baseUrl}/detect-issue`, {
      method: 'POST',
      body: formData,
      timeout: 30000,
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Classification test successful:', result);
      return {
        success: true,
        result: result,
        message: 'Image classification working'
      };
    } else {
      console.log('❌ Classification failed:', response.status);
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        message: 'Classification endpoint failed'
      };
    }
  } catch (error) {
    console.log('❌ Classification test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Classification test failed'
    };
  }
}