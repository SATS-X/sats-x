"""The one liveness model every SATS X path uses: web webcam, kiosk, and ESP32-CAM.

The TFLite file holds the same weights as liveness_detection_model.h5 (verified to give
identical scores) but runs about 24x faster without full TensorFlow. Preprocessing
matches test/accuracy_checker.py exactly, because that is how the published accuracy
was measured: OpenCV bilinear resize, RGB channel order, values scaled to [0, 1].
"""

import threading
from pathlib import Path

import cv2
import numpy as np

try:
    from tflite_runtime.interpreter import Interpreter
except ImportError:  # local development with full TensorFlow
    import tensorflow as tf

    Interpreter = tf.lite.Interpreter

MODEL_PATH = Path(__file__).parent.parent / "models" / "liveness-detection-model.tflite"
# Scores above this are "real". The model outputs P(real) from a sigmoid.
REAL_THRESHOLD = 0.5
# Background kept around the face so screen and paper edges stay visible to the model.
FACE_MARGIN = 0.15

_interpreter = Interpreter(model_path=str(MODEL_PATH))
_interpreter.allocate_tensors()
_input = _interpreter.get_input_details()[0]
_output = _interpreter.get_output_details()[0]
INPUT_HEIGHT, INPUT_WIDTH = int(_input["shape"][1]), int(_input["shape"][2])
# The interpreter is stateful and cannot serve two requests at once.
_lock = threading.Lock()


def preprocess(rgb: np.ndarray) -> np.ndarray:
    """RGB uint8 image of any size -> (1, H, W, 3) float32 batch, as in evaluation."""
    resized = cv2.resize(rgb, (INPUT_WIDTH, INPUT_HEIGHT), interpolation=cv2.INTER_LINEAR)
    return np.expand_dims(resized.astype(np.float32) / 255.0, axis=0)


def score_rgb(rgb: np.ndarray) -> float:
    """Probability that the face in this RGB crop is real."""
    batch = preprocess(rgb)
    with _lock:
        _interpreter.set_tensor(_input["index"], batch)
        _interpreter.invoke()
        return float(_interpreter.get_tensor(_output["index"])[0][0])


def score_bgr(bgr: np.ndarray) -> float:
    return score_rgb(np.ascontiguousarray(bgr[:, :, ::-1]))


def crop_with_margin(image: np.ndarray, left: float, top: float, width: float, height: float) -> np.ndarray:
    """Crop a face box given in pixels, widened by FACE_MARGIN on every side."""
    img_h, img_w = image.shape[:2]
    mx, my = width * FACE_MARGIN, height * FACE_MARGIN
    x0, y0 = max(0, int(left - mx)), max(0, int(top - my))
    x1, y1 = min(img_w, int(left + width + mx)), min(img_h, int(top + height + my))
    if x1 <= x0 or y1 <= y0:
        return image
    return image[y0:y1, x0:x1]


def verdict(score: float) -> dict:
    return {"verdict": "real" if score > REAL_THRESHOLD else "fake", "score": round(score, 4)}
