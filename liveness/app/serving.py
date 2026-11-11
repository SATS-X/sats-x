"""SATS X liveness and face API, used locally by ./start.sh and in production Docker.

/v1/check scores ESP32-CAM images forwarded by the attendance Lambda; /v1/faces/*
(app/faces.py) serves the web webcam pages and the exhibition kiosk. Both score faces
with app/liveness_model.py, so hardware and web give the same verdict for the same face.
The TensorFlow demo in main.py stays available for manual testing.
"""

import base64
import binascii
import hashlib
import hmac
import io
import logging
import os
from typing import Optional

import numpy as np
from fastapi import FastAPI, Header, HTTPException
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import BaseModel, Field

from app import liveness_model
from app.faces import build_router

logger = logging.getLogger("liveness")

MAX_IMAGE_BASE64 = 2 * 1024 * 1024

app = FastAPI(title="SATS X liveness", docs_url=None, redoc_url=None, openapi_url=None)
app.include_router(build_router(liveness_model.score_bgr))


class FaceBox(BaseModel):
    """Rekognition BoundingBox: fractions of the image size."""

    Left: float = Field(ge=0, le=1)
    Top: float = Field(ge=0, le=1)
    Width: float = Field(gt=0, le=1)
    Height: float = Field(gt=0, le=1)


class CheckRequest(BaseModel):
    image: str = Field(max_length=MAX_IMAGE_BASE64)
    box: Optional[FaceBox] = None


def _authorize(authorization: Optional[str]) -> None:
    expected = os.environ.get("SERVICE_TOKEN", "")
    token = authorization[7:] if authorization and authorization.startswith("Bearer ") else ""
    token_digest = hashlib.sha256(token.encode()).digest()
    expected_digest = hashlib.sha256(expected.encode()).digest()
    if not expected or not token or not hmac.compare_digest(token_digest, expected_digest):
        raise HTTPException(status_code=401, detail="Invalid service token")


def _decode_rgb(value: str) -> np.ndarray:
    try:
        image = Image.open(io.BytesIO(base64.b64decode(value, validate=True)))
        # Phones and some cameras store rotation in EXIF instead of rotating the pixels.
        return np.asarray(ImageOps.exif_transpose(image).convert("RGB"))
    except (binascii.Error, ValueError, UnidentifiedImageError, OSError) as error:
        raise HTTPException(status_code=400, detail="Invalid image") from error


def _crop_face(rgb: np.ndarray, box: Optional[FaceBox]) -> np.ndarray:
    if box is None:
        return rgb
    height, width = rgb.shape[:2]
    return liveness_model.crop_with_margin(rgb, box.Left * width, box.Top * height, box.Width * width, box.Height * height)


@app.get("/health")
def health():
    return {"status": "healthy", "model": liveness_model.MODEL_PATH.name}


@app.post("/v1/check")
def check(request: CheckRequest, authorization: Optional[str] = Header(default=None)):
    _authorize(authorization)
    score = liveness_model.score_rgb(_crop_face(_decode_rgb(request.image), request.box))
    return liveness_model.verdict(score)
