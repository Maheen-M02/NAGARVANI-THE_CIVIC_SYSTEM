from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import io
from PIL import Image
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="NagarVani CLIP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipe = None
try:
    from transformers import pipeline
    pipe = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32")
    logger.info("CLIP model loaded!")
except Exception as e:
    logger.error(f"CLIP load failed: {e}")

CATEGORY_MAP = {
    "pothole on road":    {"category": "Road Infrastructure", "department": "Public Works Department"},
    "garbage pile":       {"category": "Waste Management",   "department": "Waste Management"},
    "water leakage":      {"category": "Water Supply",       "department": "Water Board"},
    "broken streetlight": {"category": "Street Lighting",    "department": "Electricity Department"},
}

def fallback(filename=None):
    import random
    issues = list(CATEGORY_MAP.keys())
    weights = [0.4, 0.3, 0.2, 0.1]
    chosen = random.choices(issues, weights=weights)[0]
    if filename:
        for issue in issues:
            if any(kw in filename.lower() for kw in issue.split()):
                chosen = issue
                break
    results = []
    for issue in issues:
        score = 0.82 if issue == chosen else round(random.uniform(0.1, 0.4), 2)
        results.append({"label": issue, "score": score})
    return sorted(results, key=lambda x: x["score"], reverse=True)

@app.get("/")
def root():
    return {"status": "running", "model_loaded": pipe is not None}

@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": pipe is not None, "mode": "CLIP" if pipe else "Fallback"}

@app.post("/detect-issue")
async def detect_issue(file: UploadFile):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    try:
        data = await file.read()
        image = Image.open(io.BytesIO(data)).convert("RGB")
        labels = ["pothole on road", "garbage pile", "water leakage", "broken streetlight"]
        result = pipe(image, candidate_labels=labels) if pipe else fallback(file.filename)
        top = result[0]
        info = CATEGORY_MAP.get(top["label"], {"category": "General", "department": "Municipal Corporation"})
        return {
            "issue": top["label"],
            "category": info["category"],
            "department": info["department"],
            "confidence": top["score"],
            "mode": "CLIP" if pipe else "Fallback",
            "all_predictions": result
        }
    except Exception as e:
        raise HTTPException(500, str(e))
