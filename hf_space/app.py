from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import io
import os
import random
import logging
from PIL import Image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="NagarVani CLIP API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load real CLIP model
pipe = None
try:
    logger.info("Loading CLIP model (openai/clip-vit-base-patch32)...")
    from transformers import pipeline
    pipe = pipeline(
        "zero-shot-image-classification",
        model="openai/clip-vit-base-patch32",
        device=-1  # CPU (HF free tier has no GPU but has 16GB RAM)
    )
    logger.info("CLIP model loaded successfully!")
except Exception as e:
    logger.error(f"CLIP load failed: {e}")
    logger.info("Falling back to smart classifier")

CATEGORY_MAP = {
    "pothole on road":    {"category": "Road Infrastructure", "department": "Public Works Department"},
    "garbage pile":       {"category": "Waste Management",   "department": "Waste Management"},
    "water leakage":      {"category": "Water Supply",       "department": "Water Board"},
    "broken streetlight": {"category": "Street Lighting",    "department": "Electricity Department"},
}

ISSUE_KEYWORDS = {
    "pothole on road":    ["pothole", "road", "hole", "crack", "damage", "asphalt"],
    "garbage pile":       ["garbage", "trash", "waste", "dump", "litter", "rubbish"],
    "water leakage":      ["water", "leak", "pipe", "burst", "flood", "drain"],
    "broken streetlight": ["streetlight", "light", "lamp", "bulb", "broken", "dark"],
}

def smart_classify(filename=None, image=None):
    issues = list(CATEGORY_MAP.keys())
    scores = {issue: 0.0 for issue in issues}

    if filename:
        fname = filename.lower()
        for issue, keywords in ISSUE_KEYWORDS.items():
            matches = sum(1 for kw in keywords if kw in fname)
            if matches > 0:
                scores[issue] += matches * 0.3

    if image:
        try:
            small = image.resize((50, 50))
            pixels = list(small.getdata())
            avg_r = sum(p[0] for p in pixels) / len(pixels)
            avg_g = sum(p[1] for p in pixels) / len(pixels)
            avg_b = sum(p[2] for p in pixels) / len(pixels)
            brightness = (avg_r + avg_g + avg_b) / 3
            if brightness < 80:
                scores["broken streetlight"] += 0.25
            if avg_g > avg_r + 20 and avg_g > avg_b + 20:
                scores["garbage pile"] += 0.2
            if avg_b > avg_r + 15 and avg_b > avg_g + 10:
                scores["water leakage"] += 0.2
            grey_diff = max(abs(avg_r - avg_g), abs(avg_g - avg_b), abs(avg_r - avg_b))
            if grey_diff < 30 and 60 < brightness < 160:
                scores["pothole on road"] += 0.2
        except Exception as e:
            logger.warning(f"Image analysis failed: {e}")

    base_weights = {"pothole on road": 0.35, "garbage pile": 0.30, "water leakage": 0.20, "broken streetlight": 0.15}
    for issue in issues:
        scores[issue] += base_weights[issue] + random.uniform(0.0, 0.1)

    total = sum(scores.values())
    results = [{"label": issue, "score": round(scores[issue] / total, 3)} for issue in issues]
    return sorted(results, key=lambda x: x["score"], reverse=True)


@app.get("/")
def root():
    return {"status": "running", "model_loaded": pipe is not None, "mode": "CLIP" if pipe else "SmartFallback"}

@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": pipe is not None, "mode": "CLIP" if pipe else "SmartFallback"}

@app.post("/detect-issue")
async def detect_issue(file: UploadFile):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    try:
        image_data = await file.read()
        image = None
        try:
            image = Image.open(io.BytesIO(image_data)).convert("RGB")
        except Exception as e:
            logger.warning(f"Could not open image: {e}")

        if pipe is not None and image is not None:
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
    return {"model_loaded": pipe is not None, "mode": "CLIP" if pipe else "SmartFallback", "supported_labels": list(CATEGORY_MAP.keys())}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
