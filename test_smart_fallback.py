#!/usr/bin/env python3
"""
Test the smart fallback classification with different filenames
"""

import requests
import json
from PIL import Image, ImageDraw
import io

def create_test_image_with_name(filename):
    """Create a simple test image"""
    img = Image.new('RGB', (400, 300), color='lightgray')
    draw = ImageDraw.Draw(img)
    
    # Add some text to indicate the type
    draw.text((50, 150), filename.upper(), fill='black', anchor="mm")
    
    return img

def test_filename_recognition():
    """Test if the smart fallback recognizes filenames correctly"""
    
    test_cases = [
        "pothole_main_street.jpg",
        "garbage_pile_park.jpg", 
        "water_leak_pipe.jpg",
        "broken_streetlight.jpg",
        "road_damage.jpg",
        "trash_dump.jpg",
        "pipe_burst.jpg",
        "lamp_not_working.jpg",
        "random_image.jpg"  # Should default to weighted random
    ]
    
    print("🧪 Testing Smart Fallback Classification")
    print("=" * 50)
    
    for filename in test_cases:
        print(f"\n📸 Testing: {filename}")
        
        # Create test image
        img = create_test_image_with_name(filename)
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        try:
            # Send to API
            files = {'file': (filename, img_bytes, 'image/jpeg')}
            response = requests.post('http://localhost:8000/detect-issue', files=files)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Result: {data['issue']}")
                print(f"   📊 Confidence: {data['confidence']:.3f}")
                print(f"   🏛️ Department: {data['department']}")
                print(f"   🤖 Mode: {data.get('mode', 'Unknown')}")
                
                # Check if it made a reasonable guess based on filename
                filename_lower = filename.lower()
                detected_issue = data['issue'].lower()
                
                if any(word in filename_lower for word in detected_issue.split()):
                    print("   🎯 Smart match: Filename influenced classification!")
                else:
                    print("   🎲 Random selection or weighted default")
                    
            else:
                print(f"   ❌ Error: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Failed: {e}")

if __name__ == "__main__":
    test_filename_recognition()