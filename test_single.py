import requests
from PIL import Image
import io

# Create test image
img = Image.new('RGB', (400, 300), color='lightgray')
img_bytes = io.BytesIO()
img.save(img_bytes, format='JPEG')
img_bytes.seek(0)

# Test with broken streetlight filename
files = {'file': ('broken_streetlight.jpg', img_bytes, 'image/jpeg')}
response = requests.post('http://localhost:8000/detect-issue', files=files)

if response.status_code == 200:
    data = response.json()
    print(f"Result: {data['issue']}")
    print(f"Confidence: {data['confidence']:.3f}")
    print(f"Department: {data['department']}")
else:
    print(f"Error: {response.status_code}")
    print(response.text)