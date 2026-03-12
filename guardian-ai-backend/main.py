from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import os, re
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="GuardianAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def clean_path_middleware(request, call_next):
    # Collapse multiple slashes (e.g., //health -> /health)
    path = request.scope['path']
    if "//" in path:
        request.scope['path'] = re.sub(r'/+', '/', path)
    return await call_next(request)

MODEL = os.getenv("MODEL_NAME", "unitary/toxic-bert")

print(f"Loading model: {MODEL}")
classifier = pipeline("text-classification", model=MODEL, tokenizer=MODEL)
print("✅ Model loaded")

LABELS = {
    "clean":       {"emoji": "✅", "color": "#22c55e", "action": "Allow"},
    "toxic":       {"emoji": "⚠️",  "color": "#f59e0b", "action": "Warn"},
    "offensive":   {"emoji": "⚠️",  "color": "#f59e0b", "action": "Warn"},
    "hate":        {"emoji": "🚫", "color": "#ef4444", "action": "Remove"},
    "hate_speech": {"emoji": "🚫", "color": "#ef4444", "action": "Remove"},
    "vulgar":      {"emoji": "🤬", "color": "#f97316", "action": "Warn"},
    "LABEL_0":     {"emoji": "✅", "color": "#22c55e", "action": "Allow"},
    "LABEL_1":     {"emoji": "⚠️",  "color": "#f59e0b", "action": "Warn"},
    "LABEL_2":     {"emoji": "🚫", "color": "#ef4444", "action": "Remove"},
    "LABEL_3":     {"emoji": "🤬", "color": "#f97316", "action": "Warn"},
}

def redact(text, label):
    if label in ["clean", "LABEL_0"]:
        return text
    if label in ["hate", "hate_speech", "LABEL_2"]:
        return "[ 🚫 CONTENT REMOVED — HATE SPEECH DETECTED ]"
    return re.sub(
        r'\b(stupid|idiot|dumb|moron|hate|disgusting|kill|die|damn|hell|f\w+k|s\w+t|b\w+ch)\b',
        lambda m: "█" * len(m.group()),
        text, flags=re.IGNORECASE
    )

class TweetRequest(BaseModel):
    text: str
    username: str = "anonymous"

class BatchRequest(BaseModel):
    tweets: list[TweetRequest]

@app.get("/")
def root():
    return {"status": "GuardianAI API is running ✅"}

@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL}

@app.post("/analyze")
def analyze(req: TweetRequest):
    result     = classifier(req.text[:512])[0]
    label      = result["label"]
    confidence = round(result["score"] * 100, 2)
    info       = LABELS.get(label, LABELS["clean"])
    return {
        "username":   req.username,
        "original":   req.text,
        "redacted":   redact(req.text, label),
        "label":      label,
        "confidence": confidence,
        "emoji":      info["emoji"],
        "color":      info["color"],
        "action":     info["action"],
        "flagged":    label not in ["clean", "LABEL_0"]
    }

@app.post("/analyze/batch")
def analyze_batch(req: BatchRequest):
    return [analyze(t) for t in req.tweets[:50]]