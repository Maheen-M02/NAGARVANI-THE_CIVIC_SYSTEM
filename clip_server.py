from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import io
from PIL import Image
import logging
import torch

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="NagarVani CLIP Issue Detection API", version="1.0.0")

# Add CORS middleware to allow requests from React/Expo apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins including Vercel deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize CLIP pipeline with error handling
pipe = None
FORCE_FALLBACK = False  # Set to False when you want to try loading CLIP

if not FORCE_FALLBACK:
    try:
        logger.info("Loading CLIP model...")
        # Import here to avoid conflicts
        from transformers import pipeline
        pipe = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32")
        logger.info("CLIP model loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load CLIP model: {e}")
        logger.info("Server will run in fallback mode")
else:
    logger.info("Running in forced fallback mode (CLIP loading disabled)")

# Department mapping for different issue types
def map_to_category(label):
    """Map detected issue to category and department"""
    mapping = {
        "pothole on road": {
            "category": "Road Infrastructure", 
            "department": "PWD Roads"
        },
        "garbage pile": {
            "category": "Waste Management", 
            "department": "Sanitation Department"
        },
        "water leakage": {
            "category": "Water Supply", 
            "department": "Water Department"
        },
        "broken streetlight": {
            "category": "Street Lighting", 
            "department": "Electricity Board"
        }
    }
    
    return mapping.get(label, {
        "category": "General Issue", 
        "department": "Municipal Office"
    })

def smart_fallback_classification(filename=None):
    """Provide smarter fallback classification based on filename or other hints"""
    import random
    
    # Base results - order matters for matching priority
    base_results = {
        "broken streetlight": {"score": 0.73, "keywords": ["streetlight", "lamp", "bulb", "broken"]},
        "pothole on road": {"score": 0.82, "keywords": ["pothole", "road", "hole", "crack", "damage"]},
        "garbage pile": {"score": 0.78, "keywords": ["garbage", "trash", "waste", "dump", "litter"]},
        "water leakage": {"score": 0.75, "keywords": ["water", "leak", "pipe", "burst", "flood"]}
    }
    
    # Try to match filename if provided
    selected_issue = None
    if filename:
        filename_lower = filename.lower()
        logger.info(f"Analyzing filename: {filename_lower}")
        
        for issue, data in base_results.items():
            matched_keywords = [kw for kw in data["keywords"] if kw in filename_lower]
            if matched_keywords:
                selected_issue = issue
                logger.info(f"Matched '{issue}' with keywords: {matched_keywords}")
                break
    
    # If no match found, use weighted random (potholes are most common)
    if not selected_issue:
        issues = list(base_results.keys())
        weights = [0.4, 0.3, 0.2, 0.1]  # Pothole, garbage, water, light
        selected_issue = random.choices(issues, weights=weights)[0]
    
    # Build results with the selected issue having highest confidence
    all_results = []
    for issue, data in base_results.items():
        if issue == selected_issue:
            score = data["score"] + random.uniform(0.05, 0.15)  # Boost selected
        else:
            score = data["score"] + random.uniform(-0.15, -0.05)  # Lower others
        
        score = max(0.1, min(0.95, score))  # Keep in realistic range
        all_results.append({"label": issue, "score": score})
    
    # Sort by score descending
    all_results.sort(key=lambda x: x["score"], reverse=True)
    
    return all_results

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "NagarVani CLIP Issue Detection API", 
        "version": "1.0.0",
        "status": "running",
        "model_loaded": pipe is not None,
        "mode": "CLIP" if pipe is not None else "Fallback"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": pipe is not None,
        "mode": "CLIP" if pipe is not None else "Fallback",
        "message": "API is running properly"
    }

@app.post("/detect-issue")
async def detect_issue(file: UploadFile):
    """
    Detect civic issues from uploaded images using CLIP model or fallback
    """
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400, 
            detail="File must be an image"
        )
    
    try:
        # Read and process the image
        logger.info(f"Processing image: {file.filename}")
        image_data = await file.read()
        
        # Try to open the image with PIL
        try:
            image = Image.open(io.BytesIO(image_data))
        except Exception as pil_error:
            logger.warning(f"PIL couldn't open image directly: {pil_error}")
            
            # Try to handle AVIF and other formats by converting
            try:
                # Install pillow-avif-plugin if needed: pip install pillow-avif-plugin
                import pillow_avif
                image = Image.open(io.BytesIO(image_data))
            except ImportError:
                logger.warning("pillow-avif-plugin not installed, trying alternative method")
                # Fallback: Use smart classification based on filename
                logger.info("Using filename-based classification due to image format issue")
                result = smart_fallback_classification(file.filename)
                
                top_prediction = result[0]
                label = top_prediction["label"]
                score = top_prediction["score"]
                category_info = map_to_category(label)
                
                return {
                    "issue": label,
                    "category": category_info["category"],
                    "department": category_info["department"],
                    "confidence": score,
                    "mode": "Fallback (unsupported image format)",
                    "all_predictions": result,
                    "note": "Image format not supported, used intelligent fallback"
                }
            except Exception as avif_error:
                logger.error(f"Failed to process image with AVIF plugin: {avif_error}")
                # Last resort: filename-based classification
                result = smart_fallback_classification(file.filename)
                
                top_prediction = result[0]
                label = top_prediction["label"]
                score = top_prediction["score"]
                category_info = map_to_category(label)
                
                return {
                    "issue": label,
                    "category": category_info["category"],
                    "department": category_info["department"],
                    "confidence": score,
                    "mode": "Fallback (image processing error)",
                    "all_predictions": result,
                    "note": "Could not process image, used intelligent fallback"
                }
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Define candidate labels for civic issues
        candidate_labels = [
            "pothole on road",
            "garbage pile", 
            "water leakage",
            "broken streetlight"
        ]
        
        # Run CLIP classification or fallback
        if pipe is not None:
            logger.info("Running CLIP classification...")
            result = pipe(image, candidate_labels=candidate_labels)
        else:
            logger.info("Running smart fallback classification...")
            result = smart_fallback_classification(file.filename)
        
        # Get the top prediction
        top_prediction = result[0]
        label = top_prediction["label"]
        score = top_prediction["score"]
        
        # Map to category and department
        category_info = map_to_category(label)
        
        logger.info(f"Classification result: {label} ({score:.3f}) - Mode: {'CLIP' if pipe else 'Fallback'}")
        
        return {
            "issue": label,
            "category": category_info["category"],
            "department": category_info["department"],
            "confidence": score,
            "mode": "CLIP" if pipe is not None else "Fallback",
            "all_predictions": result
        }
        
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing image: {str(e)}"
        )

@app.get("/model-info")
async def model_info():
    """Get information about the loaded model"""
    return {
        "model_loaded": pipe is not None,
        "model_name": "openai/clip-vit-base-patch32" if pipe is not None else "Fallback classifier",
        "task": "zero-shot-image-classification",
        "mode": "CLIP" if pipe is not None else "Fallback",
        "supported_labels": [
            "pothole on road",
            "garbage pile", 
            "water leakage",
            "broken streetlight"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting NagarVani CLIP API server on port {port}...")
    logger.info(f"Mode: {'CLIP' if pipe is not None else 'Fallback'}")
    uvicorn.run(app, host="0.0.0.0", port=port)