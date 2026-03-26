#!/usr/bin/env python3
"""
Test script for NagarVani CLIP Integration
This script tests the CLIP API server and validates the integration.
"""

import requests
import json
import time
import os
from PIL import Image, ImageDraw
import io

def create_test_image(issue_type="pothole"):
    """Create a simple test image for testing"""
    # Create a simple test image
    img = Image.new('RGB', (400, 300), color='lightgray')
    draw = ImageDraw.Draw(img)
    
    if issue_type == "pothole":
        # Draw a simple pothole representation
        draw.ellipse([150, 120, 250, 180], fill='black', outline='darkgray', width=3)
        draw.text((160, 200), "POTHOLE", fill='black')
    elif issue_type == "garbage":
        # Draw garbage representation
        draw.rectangle([100, 100, 300, 200], fill='brown', outline='black', width=2)
        draw.text((160, 220), "GARBAGE", fill='black')
    elif issue_type == "water":
        # Draw water leak representation
        draw.ellipse([180, 100, 220, 200], fill='blue', outline='darkblue', width=2)
        draw.text([160, 220], "WATER LEAK", fill='black')
    elif issue_type == "light":
        # Draw broken streetlight
        draw.rectangle([190, 50, 210, 150], fill='gray', outline='black', width=2)
        draw.ellipse([180, 40, 220, 60], fill='yellow', outline='black', width=2)
        draw.text([150, 220], "STREETLIGHT", fill='black')
    
    return img

def test_api_health(base_url="http://localhost:8000"):
    """Test if the API is running and healthy"""
    print("🔍 Testing API health...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API is healthy: {data}")
            return True
        else:
            print(f"❌ API health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to API: {e}")
        return False

def test_model_info(base_url="http://localhost:8000"):
    """Test model information endpoint"""
    print("🤖 Testing model info...")
    try:
        response = requests.get(f"{base_url}/model-info", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Model info: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Model info failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot get model info: {e}")
        return False

def test_image_classification(base_url="http://localhost:8000", issue_type="pothole"):
    """Test image classification with a generated test image"""
    print(f"📸 Testing image classification for: {issue_type}")
    
    # Create test image
    test_img = create_test_image(issue_type)
    
    # Convert to bytes
    img_bytes = io.BytesIO()
    test_img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    try:
        files = {'file': ('test_image.jpg', img_bytes, 'image/jpeg')}
        response = requests.post(f"{base_url}/detect-issue", files=files, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Classification result:")
            print(f"   Issue: {data['issue']}")
            print(f"   Category: {data['category']}")
            print(f"   Department: {data['department']}")
            print(f"   Confidence: {data['confidence']:.3f}")
            return True
        else:
            print(f"❌ Classification failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Classification request failed: {e}")
        return False

def test_with_real_image(base_url="http://localhost:8000", image_path=None):
    """Test with a real image file if provided"""
    if not image_path or not os.path.exists(image_path):
        print("⏭️  Skipping real image test (no image provided)")
        return True
    
    print(f"📷 Testing with real image: {image_path}")
    
    try:
        with open(image_path, 'rb') as f:
            files = {'file': (os.path.basename(image_path), f, 'image/jpeg')}
            response = requests.post(f"{base_url}/detect-issue", files=files, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Real image classification:")
            print(f"   Issue: {data['issue']}")
            print(f"   Category: {data['category']}")
            print(f"   Department: {data['department']}")
            print(f"   Confidence: {data['confidence']:.3f}")
            print(f"   All predictions: {data.get('all_predictions', [])}")
            return True
        else:
            print(f"❌ Real image classification failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Real image test failed: {e}")
        return False

def run_performance_test(base_url="http://localhost:8000", num_requests=5):
    """Run a simple performance test"""
    print(f"⚡ Running performance test ({num_requests} requests)...")
    
    test_img = create_test_image("pothole")
    img_bytes = io.BytesIO()
    test_img.save(img_bytes, format='JPEG')
    
    times = []
    successes = 0
    
    for i in range(num_requests):
        img_bytes.seek(0)
        files = {'file': ('test_image.jpg', img_bytes, 'image/jpeg')}
        
        start_time = time.time()
        try:
            response = requests.post(f"{base_url}/detect-issue", files=files, timeout=30)
            end_time = time.time()
            
            if response.status_code == 200:
                successes += 1
                times.append(end_time - start_time)
                print(f"   Request {i+1}: {end_time - start_time:.2f}s ✅")
            else:
                print(f"   Request {i+1}: Failed ({response.status_code}) ❌")
        except Exception as e:
            print(f"   Request {i+1}: Error ({e}) ❌")
    
    if times:
        avg_time = sum(times) / len(times)
        print(f"✅ Performance results:")
        print(f"   Success rate: {successes}/{num_requests} ({successes/num_requests*100:.1f}%)")
        print(f"   Average time: {avg_time:.2f}s")
        print(f"   Min time: {min(times):.2f}s")
        print(f"   Max time: {max(times):.2f}s")
    else:
        print("❌ No successful requests in performance test")

def main():
    """Main test function"""
    print("🚀 NagarVani CLIP Integration Test")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    # Test 1: API Health
    if not test_api_health(base_url):
        print("\n❌ API is not running. Please start the server with:")
        print("   python clip_server.py")
        return
    
    print()
    
    # Test 2: Model Info
    test_model_info(base_url)
    print()
    
    # Test 3: Image Classification for each issue type
    issue_types = ["pothole", "garbage", "water", "light"]
    for issue_type in issue_types:
        test_image_classification(base_url, issue_type)
        print()
    
    # Test 4: Real image (if provided)
    import sys
    if len(sys.argv) > 1:
        test_with_real_image(base_url, sys.argv[1])
        print()
    
    # Test 5: Performance test
    run_performance_test(base_url, 3)
    
    print("\n🎉 Test completed!")
    print("\n💡 Tips:")
    print("   - To test with a real image: python test_clip_integration.py path/to/image.jpg")
    print("   - Check server logs for detailed information")
    print("   - API docs available at: http://localhost:8000/docs")

if __name__ == "__main__":
    main()