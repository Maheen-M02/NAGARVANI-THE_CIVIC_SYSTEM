#!/usr/bin/env python3
"""
Test the real CLIP model with different image types
"""

import requests
import json
from PIL import Image, ImageDraw, ImageFont
import io

def create_realistic_test_image(issue_type):
    """Create more realistic test images for each issue type"""
    img = Image.new('RGB', (400, 300), color='lightgray')
    draw = ImageDraw.Draw(img)
    
    if issue_type == "pothole":
        # Draw a pothole-like shape
        draw.ellipse([150, 120, 250, 180], fill='black', outline='darkgray', width=3)
        draw.ellipse([160, 130, 240, 170], fill='#333333')
        draw.text((200, 200), "ROAD SURFACE", fill='black', anchor="mm")
        
    elif issue_type == "garbage":
        # Draw garbage pile
        colors = ['brown', 'green', 'blue', 'red']
        for i in range(5):
            x = 100 + i * 40
            y = 150 + (i % 2) * 20
            draw.rectangle([x, y, x+30, y+40], fill=colors[i % len(colors)])
        draw.text((200, 250), "WASTE PILE", fill='black', anchor="mm")
        
    elif issue_type == "water":
        # Draw water leak
        draw.ellipse([180, 100, 220, 200], fill='blue', outline='darkblue', width=2)
        draw.ellipse([190, 110, 210, 190], fill='lightblue')
        # Add water drops
        for i in range(3):
            y = 210 + i * 15
            draw.ellipse([195, y, 205, y+10], fill='blue')
        draw.text((200, 270), "WATER LEAK", fill='black', anchor="mm")
        
    elif issue_type == "streetlight":
        # Draw streetlight pole and broken bulb
        draw.rectangle([190, 50, 210, 200], fill='gray', outline='black', width=2)
        draw.ellipse([180, 40, 220, 60], fill='yellow', outline='red', width=3)
        draw.line([180, 40, 220, 60], fill='red', width=3)  # X mark for broken
        draw.line([180, 60, 220, 40], fill='red', width=3)
        draw.text((200, 250), "BROKEN LIGHT", fill='black', anchor="mm")
    
    return img

def test_real_clip():
    """Test real CLIP model with different issue types"""
    
    print("🤖 Testing Real CLIP Model")
    print("=" * 40)
    
    # Check server status first
    try:
        response = requests.get('http://localhost:8000/health')
        health = response.json()
        print(f"Server Status: {health['mode']} mode")
        print(f"Model Loaded: {health['model_loaded']}")
        print()
        
        if not health['model_loaded']:
            print("❌ CLIP model not loaded. Server is in fallback mode.")
            return
            
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        return
    
    test_cases = [
        ("pothole", "Pothole Test Image"),
        ("garbage", "Garbage Pile Test Image"), 
        ("water", "Water Leak Test Image"),
        ("streetlight", "Broken Streetlight Test Image")
    ]
    
    for issue_type, description in test_cases:
        print(f"📸 Testing: {description}")
        
        # Create realistic test image
        img = create_realistic_test_image(issue_type)
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        try:
            # Send to CLIP API
            files = {'file': (f'{issue_type}_test.jpg', img_bytes, 'image/jpeg')}
            response = requests.post('http://localhost:8000/detect-issue', files=files)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   🎯 Result: {data['issue']}")
                print(f"   📊 Confidence: {data['confidence']:.3f}")
                print(f"   🏛️ Department: {data['department']}")
                print(f"   🤖 Mode: {data.get('mode', 'Unknown')}")
                
                # Show all predictions for analysis
                if 'all_predictions' in data:
                    print("   📋 All predictions:")
                    for pred in data['all_predictions'][:3]:  # Top 3
                        print(f"      - {pred['label']}: {pred['score']:.3f}")
                
                # Check if it got the right category
                expected_keywords = {
                    'pothole': ['pothole', 'road'],
                    'garbage': ['garbage', 'pile'],
                    'water': ['water', 'leakage'],
                    'streetlight': ['streetlight', 'broken']
                }
                
                detected = data['issue'].lower()
                expected = expected_keywords.get(issue_type, [])
                
                if any(keyword in detected for keyword in expected):
                    print("   ✅ Correct classification!")
                else:
                    print("   ⚠️  Different classification than expected")
                    
            else:
                print(f"   ❌ Error: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Failed: {e}")
        
        print()

if __name__ == "__main__":
    test_real_clip()