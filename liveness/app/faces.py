"""Local face engine: YuNet finds faces and SFace turns one face into a 128-value embedding.

The backend stores embeddings and compares them, so this service stays stateless. It
lets SATS X recognise faces on one laptop with no AWS account, for demos and exhibitions.
Run scripts/fetch_face_models.sh once to download the two pinned ONNX models.
"""

import base64
import binascii
import hashlib
import hmac
import logging
import os
import threading
from pathlib import Path
from typing import Callable, Optional

import cv2
import numpy as np
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

try:
    from app.liveness_model import crop_with_margin, verdict
except ImportError:  # started from inside app/
    from liveness_model import crop_with_margin, verdict

logger = logging.getLogger("faces")

MODEL_DIR = Path(__file__).parent.parent / "models" / "faces"
DETECTOR_PATH = MODEL_DIR / "face_detection_yunet_2023mar.onnx"
RECOGNIZER_PATH = MODEL_DIR / "face_recognition_sface_2021dec.onnx"
MAX_IMAGE_BASE64 = 4 * 1024 * 1024
# Frames wider than this are scaled down first; detection does not need more pixels.
MAX_SIDE = 1280
DETECTION_THRESHOLD = 0.8
# Below this many pixels across, SFace embeddings get unreliable.
MIN_FACE_PX = 80
# Variance of the Laplacian on the aligned face; lower means blurry.
MIN_SHARPNESS = 40.0

_lock = threading.Lock()
_detector = None
_recognizer = None


def models_available() -> bool:
    return DETECTOR_PATH.exists() and RECOGNIZER_PATH.exists()


def _load():
    global _detector, _recognizer
    if _detector is None:
        if not models_available():
            raise HTTPException(status_code=503, detail="Face models are missing. Run scripts/fetch_face_models.sh")
        _detector = cv2.FaceDetectorYN.create(str(DETECTOR_PATH), "", (320, 320), DETECTION_THRESHOLD, 0.3, 50)
        _recognizer = cv2.FaceRecognizerSF.create(str(RECOGNIZER_PATH), "")
        logger.info("Face engine loaded")
    return _detector, _recognizer


def _authorize(authorization: Optional[str]) -> None:
    expected = os.environ.get("SERVICE_TOKEN", "")
    token = authorization[7:] if authorization and authorization.startswith("Bearer ") else ""
    if not expected or not token or not hmac.compare_digest(
        hashlib.sha256(token.encode()).digest(), hashlib.sha256(expected.encode()).digest()
    ):
        raise HTTPException(status_code=401, detail="Invalid service token")


def _decode(value: str) -> np.ndarray:
    if "," in value[:64]:
        value = value.split(",", 1)[1]
    try:
        raw = np.frombuffer(base64.b64decode(value, validate=True), dtype=np.uint8)
    except (binascii.Error, ValueError) as error:
        raise HTTPException(status_code=400, detail="Invalid image") from error
    image = cv2.imdecode(raw, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image")
    height, width = image.shape[:2]
    scale = MAX_SIDE / max(height, width)
    if scale < 1:
        image = cv2.resize(image, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_AREA)
    return image


def analyze(image: np.ndarray, liveness: Optional[Callable[[np.ndarray], float]] = None) -> dict:
    height, width = image.shape[:2]
    with _lock:
        detector, recognizer = _load()
        detector.setInputSize((width, height))
        _, faces = detector.detect(image)
        if faces is None or len(faces) == 0:
            return {"face_count": 0}

        face = max(faces, key=lambda row: row[2] * row[3])
        aligned = recognizer.alignCrop(image, face)
        embedding = recognizer.feature(aligned).flatten()

    norm = float(np.linalg.norm(embedding))
    embedding = embedding / norm if norm else embedding
    sharpness = float(cv2.Laplacian(cv2.cvtColor(aligned, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var())
    x, y, w, h = (float(v) for v in face[:4])

    issues = []
    if min(w, h) < MIN_FACE_PX:
        issues.append("too_small")
    if sharpness < MIN_SHARPNESS:
        issues.append("blurry")

    result = {
        "face_count": int(len(faces)),
        "box": {"left": x / width, "top": y / height, "width": w / width, "height": h / height},
        "confidence": round(float(face[14]), 4),
        "sharpness": round(sharpness, 1),
        "issues": issues,
        "embedding": [round(float(v), 6) for v in embedding],
    }

    crop = crop_with_margin(image, x, y, w, h)
    if liveness is not None and crop.size:
        try:
            result["liveness"] = verdict(float(liveness(crop)))
        except Exception as error:  # liveness is advisory; recognition still works without it
            logger.warning("Liveness check failed: %s", error)
            result["liveness"] = {"verdict": "unavailable", "score": None}
    else:
        result["liveness"] = {"verdict": "unavailable", "score": None}
    return result


class AnalyzeRequest(BaseModel):
    image: str = Field(max_length=MAX_IMAGE_BASE64)


def build_router(liveness: Optional[Callable[[np.ndarray], float]] = None) -> APIRouter:
    """liveness receives a BGR face crop and returns the probability that it is a real face."""
    router = APIRouter()

    @router.get("/v1/faces/health")
    def faces_health():
        return {"models": models_available()}

    @router.post("/v1/faces/analyze")
    def faces_analyze(request: AnalyzeRequest, authorization: Optional[str] = Header(default=None)):
        _authorize(authorization)
        return analyze(_decode(request.image), liveness)

    return router
