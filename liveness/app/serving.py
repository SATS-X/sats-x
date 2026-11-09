"""Production liveness API: one authenticated endpoint on the lightweight TFLite model.

The TensorFlow app in main.py stays available for local testing, but needs far more
memory than the EC2 host has. The TFLite model returns identical predictions.
"""

import base64
import binascii
import hashlib
import hmac
import io
import logging
import os
import threading
from pathlib import Path
from typing import Optional

import numpy as np
from fastapi import FastAPI, Header, HTTPException
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field

try:
    from tflite_runtime.interpreter import Interpreter
except ImportError:
    from tensorflow.lite import Interpreter

logger = logging.getLogger("liveness")

MODEL_PATH = Path(__file__).parent.parent / "models" / "liveness-detection-model.tflite"
MAX_IMAGE_BASE64 = 2 * 1024 * 1024
# A little background around the face keeps screen and paper edges visible to the model.
FACE_MARGIN = 0.15

interpreter = Interpreter(model_path=str(MODEL_PATH))
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()[0]
output_details = interpreter.get_output_details()[0]
input_height, input_width = int(input_details["shape"][1]), int(input_details["shape"][2])
# The interpreter is stateful and cannot serve two requests at once.
interpreter_lock = threading.Lock()

app = FastAPI(title="SATS X liveness", docs_url=None, redoc_url=None, openapi_url=None)


class FaceBox(BaseModel):
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


def _decode_image(value: str) -> Image.Image:
    try:
        return Image.open(io.BytesIO(base64.b64decode(value, validate=True))).convert("RGB")
    except (binascii.Error, ValueError, UnidentifiedImageError, OSError) as error:
        raise HTTPException(status_code=400, detail="Invalid image") from error


def _crop_face(image: Image.Image, box: Optional[FaceBox]) -> Image.Image:
    if box is None:
        return image

    width, height = image.size
    margin_x = box.Width * FACE_MARGIN
    margin_y = box.Height * FACE_MARGIN
    area = (
        max(0, int((box.Left - margin_x) * width)),
        max(0, int((box.Top - margin_y) * height)),
        min(width, int((box.Left + box.Width + margin_x) * width)),
        min(height, int((box.Top + box.Height + margin_y) * height)),
    )
    if area[2] <= area[0] or area[3] <= area[1]:
        return image
    return image.crop(area)


def predict_real_score(image: Image.Image) -> float:
    resized = image.resize((input_width, input_height), Image.BILINEAR)
    batch = np.expand_dims(np.asarray(resized, dtype=np.float32) / 255.0, axis=0)

    with interpreter_lock:
        interpreter.set_tensor(input_details["index"], batch)
        interpreter.invoke()
        return float(interpreter.get_tensor(output_details["index"])[0][0])


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/v1/check")
def check(request: CheckRequest, authorization: Optional[str] = Header(default=None)):
    _authorize(authorization)
    score = predict_real_score(_crop_face(_decode_image(request.image), request.box))
    return {"verdict": "real" if score > 0.5 else "fake", "score": round(score, 4)}
