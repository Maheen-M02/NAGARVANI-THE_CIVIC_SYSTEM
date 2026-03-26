from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import io
import os
import random
import logging
from PIL import Image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="NagarVani Issue Detection API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try to load CLIP only if explicitly enabled via env var
# On Render free tier (512MB), CLIP won't fit - use smart fallback
ENABLE_CLIP = os.environ.get("ENABLE_CLIP", "false").lower() == "true"
pipe = None

if ENABLE_CLIP:
    try:
        logger.info("Loading CLIP model (this requires ~2GB RAM)...")
        from transformers import pipeline
        pipe = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32")
        logger.info("CLIP model loaded successfully!")
    except Exception as e:
        logger.error(f"CLIP load failed: {e}")
        logger.info("Falling back to smart classifier")
else:
    logger.info("Running smart fallback classifier (CLIP disabled to save memory)")

CATEGORY_MAP = {
    "pothole on road":    {"category": "Road Infrastructure", "department": "Public Works Department"},
    "garbage pile":       {"category": "Waste Management",   "department": "Waste Management"},
    "water leakage":      {"category": "Water Supply",       "department": "Water Board"},
    "broken streetlight": {"category": "Street Lighting",    "department": "Electricity Department"},
}

ISSUE_KEYWORDS = {
    "pothole on road":    ["pothole", "road", "hole", "crack", "damage", "asphalt", "pavement"],
    "garbage pile":       ["garbage", "trash", "waste", "dump", "litter", "rubbish", "dirty"],
    "water leakage":      ["water", "leak", "pipe", "burst", "flood", "drain", "sewage"],
    "broken streetlight": ["streetlight", "light", "lamp", "bulb", "broken", "dark", "electric"],
}

def smart_classify(filename=None, image=None):
    """
    Smart classification using:
    1. Filename keyword matching
    2. Basic image color analysis (if PIL image provided)
    3. Weighted random fallback
    """
    issues = list(CATEGORY_MAP.keys())
    scores = {issue: 0.0 for issue in issues}

    # Step 1: Filename keyword matching
    if filename:
        fname = filename.lower()
        for issue, keywords in ISSUE_KEYWORDS.items():
            matches = sum(1 for kw in keywords if kw in fname)
            if matches > 0:
                scores[issue] += matches * 0.3
                logger.info(f"Filename match: '{issue}' ({matches} keywords)")

    # Step 2: Basic image color analysis
    if image:
        try:
            small = image.resize((50, 50))
            pixels = list(small.getdata())
            avg_r = sum(p[0] for p in pixels) / len(pixels)
            avg_g = sum(p[1] for p in pixels) / len(pixels)
            avg_b = sum(p[2] for p in pixels) / len(pixels)

            # Dark image → likely streetlight issue
            brightness = (avg_r + avg_g + avg_b) / 3
            if brightness < 80:
                scores["broken streetlight"] += 0.25

            # Very green → garbage/vegetation
            if avg_g > avg_r + 20 and avg_g > avg_b + 20:
                scores["garbage pile"] += 0.2

            # Blue tones → water
            if avg_b > avg_r + 15 and avg_b > avg_g + 10:
                scores["water leakage"] += 0.2

            # Grey/brown tones → road/pothole
            grey_diff = max(abs(avg_r - avg_g), abs(avg_g - avg_b), abs(avg_r - avg_b))
            if grey_diff < 30 and 60 < brightness < 160:
                scores["pothole on road"] += 0.2

        except Exception as e:
            logger.warning(f"Image analysis failed: {e}")

    # Step 3: Add base weights + randomness
    base_weights = {
        "pothole on road":    0.35,
        "garbage pile":       0.30,
        "water leakage":      0.20,
        "broken streetlight": 0.15,
    }
    for issue in issues:
        scores[issue] += base_weights[issue] + random.uniform(0.0, 0.1)

    # Normalize to 0-1 range
    total = sum(scores.values())
    results = [
        {"label": issue, "score": round(scores[issue] / total, 3)}
        for issue in issues
    ]
    results.sort(key=lambda x: x["score"], reverse=True)
    return results


@app.get("/")
def root():
    return {
        "message": "NagarVani Issue Detection API",
        "version": "2.0.0",
        "status": "running",
        "model_loaded": pipe is not None,
        "mode": "CLIP" if pipe else "SmartFallback"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": pipe is not None,
        "mode": "CLIP" if pipe else "SmartFallback",
        "memory_optimized": not ENABLE_CLIP
    }

@app.post("/detect-issue")
async def detect_issue(file: UploadFile):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        image_data = await file.read()
        logger.info(f"Processing: {file.filename} ({len(image_data)} bytes)")

        # Try to open image
        image = None
        try:
            image = Image.open(io.BytesIO(image_data)).convert("RGB")
        except Exception as e:
            logger.warning(f"Could not open image: {e}")

        # Run classification
        if pipe is not None:
            labels = list(CATEGORY_MAP.keys())
            result = pipe(image, candidate_labels=labels)
        else:
            result = smart_classify(filename=file.filename, image=image)

        top = result[0]
        info = CATEGORY_MAP.get(top["label"], {"category": "General Issue", "department": "Municipal Corporation"})

        logger.info(f"Result: {top['label']} ({top['score']:.3f}) via {'CLIP' if pipe else 'SmartFallback'}")

        return {
            "issue": top["label"],
            "category": info["category"],
            "department": info["department"],
            "confidence": top["score"],
            "mode": "CLIP" if pipe else "SmartFallback",
            "all_predictions": result
        }

    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/model-info")
def model_info():
    return {
        "model_loaded": pipe is not None,
        "mode": "CLIP" if pipe else "SmartFallback",
        "supported_labels": list(CATEGORY_MAP.keys()),
        "note": "SmartFallback uses filename + image color analysis for classification"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting on port {port}, mode: {'CLIP' if pipe else 'SmartFallback'}")
    uvicorn.run(app, host="0.0.0.0", port=port)
