# NagarVani CLIP Integration

This document explains how to set up and use the CLIP (Contrastive Language-Image Pre-training) model for automatic civic issue detection in both the web app and Expo mobile app.

## 🎯 What This Does

The CLIP integration automatically analyzes photos taken by users and identifies civic issues like:
- **Potholes on roads** → Routes to PWD Roads Department
- **Garbage piles** → Routes to Sanitation Department  
- **Water leakage** → Routes to Water Department
- **Broken streetlights** → Routes to Electricity Board

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
# Run the setup script
python setup_clip.py
```

Or manually:
```bash
pip install -r requirements.txt
```

### 2. Start the CLIP Server

```bash
python clip_server.py
```

The server will start at `http://localhost:8000`

### 3. Configure Your Apps

#### Web App Configuration
Add to your `.env` file:
```env
REACT_APP_CLIP_API_URL=http://localhost:8000
```

#### Expo App Configuration
Update `NagarvaniExpo/src/services/clipService.js`:
```javascript
// Replace with your computer's IP address
this.baseUrl = 'http://192.168.1.100:8000';
```

To find your IP address:
- **Windows**: `ipconfig`
- **Mac/Linux**: `ifconfig` or `ip addr show`

## 📱 How It Works

### User Flow
1. **User takes a photo** of a civic issue
2. **Image is sent** to the CLIP API server
3. **CLIP model analyzes** the image and classifies the issue
4. **App auto-fills** complaint title and description
5. **AI triage routes** to the appropriate department

### Technical Flow
```
📸 Photo Capture
    ↓
🔄 clipService.detectIssue()
    ↓
🤖 CLIP Model Classification
    ↓
📝 Auto-fill Complaint Details
    ↓
🎯 AI Triage & Routing
```

## 🔧 API Endpoints

### `POST /detect-issue`
Analyzes an image and returns issue classification.

**Request:**
```javascript
const formData = new FormData();
formData.append('file', imageFile);

fetch('http://localhost:8000/detect-issue', {
  method: 'POST',
  body: formData
});
```

**Response:**
```json
{
  "issue": "pothole on road",
  "category": "Road Infrastructure",
  "department": "PWD Roads",
  "confidence": 0.87,
  "all_predictions": [...]
}
```

### `GET /health`
Check if the API is running and model is loaded.

### `GET /model-info`
Get information about the loaded CLIP model.

## 🛠️ Development

### Testing the Integration

1. **Start the server:**
   ```bash
   python clip_server.py
   ```

2. **Test with curl:**
   ```bash
   curl -X POST "http://localhost:8000/detect-issue" \
        -H "accept: application/json" \
        -H "Content-Type: multipart/form-data" \
        -F "file=@test_image.jpg"
   ```

3. **Check health:**
   ```bash
   curl http://localhost:8000/health
   ```

### Fallback Behavior

If the CLIP API is unavailable, both apps will:
- Use local fallback classification
- Show "offline mode" indicators
- Still provide basic functionality

### Customizing Classifications

To add new issue types, update:

1. **Server** (`clip_server.py`):
   ```python
   candidate_labels = [
       "pothole on road",
       "garbage pile", 
       "water leakage",
       "broken streetlight",
       "your new issue type"  # Add here
   ]
   ```

2. **Services** (`clipService.js`):
   ```javascript
   const titleMap = {
       'your new issue type': 'Your Issue Title',
       // ...
   };
   ```

## 🔍 Troubleshooting

### Common Issues

**1. "CLIP model not available"**
- Check internet connection (model downloads on first run)
- Ensure sufficient disk space (~1GB for model)
- Try: `pip install --upgrade transformers torch`

**2. "Connection refused" in mobile app**
- Use your computer's IP address, not `localhost`
- Ensure firewall allows port 8000
- Check if server is running: `curl http://localhost:8000/health`

**3. "CORS error" in web app**
- Server includes CORS headers by default
- For production, update `allow_origins` in `clip_server.py`

**4. Low confidence scores**
- CLIP works best with clear, well-lit images
- Ensure the issue is the main subject of the photo
- Consider adding more specific candidate labels

### Performance Tips

- **First run**: Model download may take 5-10 minutes
- **Subsequent runs**: Model loads from cache (~30 seconds)
- **Image processing**: Usually takes 2-5 seconds per image
- **Memory usage**: ~2GB RAM for the model

## 🚀 Production Deployment

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY clip_server.py .
EXPOSE 8000

CMD ["python", "clip_server.py"]
```

Build and run:
```bash
docker build -t nagarvani-clip .
docker run -p 8000:8000 nagarvani-clip
```

### Environment Variables

For production, set:
```env
CLIP_MODEL_CACHE_DIR=/path/to/model/cache
CLIP_API_HOST=0.0.0.0
CLIP_API_PORT=8000
```

### Scaling Considerations

- Use multiple server instances behind a load balancer
- Consider GPU acceleration for faster inference
- Implement request queuing for high traffic
- Cache common classifications

## 📊 Monitoring

The server provides basic logging. For production, consider:
- Request/response logging
- Performance metrics
- Error tracking
- Model accuracy monitoring

## 🤝 Contributing

To improve the CLIP integration:

1. **Add new issue types** in the candidate labels
2. **Improve descriptions** in the mapping functions  
3. **Enhance fallback logic** for better offline experience
4. **Add confidence thresholds** for better accuracy

## 📚 Resources

- [CLIP Paper](https://arxiv.org/abs/2103.00020)
- [Hugging Face Transformers](https://huggingface.co/docs/transformers)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

---

**Need help?** Check the server logs or create an issue with:
- Error messages
- Server logs
- Image examples (if possible)
- System information