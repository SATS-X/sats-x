"""
Liveness Detection WebSocket Server using Custom H5 Model
Real-time liveness detection (real vs fake face) using WebSocket
Direct model inference without DeepFace dependency
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import base64
import json
import logging
import traceback
from typing import Dict, Any
import time
from io import BytesIO
from PIL import Image
import numpy as np
import cv2
import tensorflow as tf
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Liveness Detection API with Custom H5 Model",
    description="Real-time face liveness detection (real vs fake) using custom TensorFlow model",
    version="3.0.0"
)

# Global model variable
liveness_model = None
model_input_shape = None  # Will be detected from model

# Model configuration
MODEL_PATH = Path(__file__).parent.parent / "models" / "liveness_detection_model.h5"


def load_liveness_model():
    """Load the H5 liveness detection model"""
    global model_input_shape

    try:
        if not MODEL_PATH.exists():
            logger.error(f"Model file not found: {MODEL_PATH}")
            return None

        logger.info(f"Loading model from: {MODEL_PATH}")
        model = tf.keras.models.load_model(str(MODEL_PATH))
        logger.info(f"✅ Model loaded successfully!")
        logger.info(f"Model input shape: {model.input_shape}")
        logger.info(f"Model output shape: {model.output_shape}")

        # Detect input shape from model
        input_shape = model.input_shape
        if len(input_shape) == 4:
            # Shape: (batch, height, width, channels)
            model_input_shape = (input_shape[1], input_shape[2], input_shape[3])
            logger.info(f"Detected 4D input shape: {model_input_shape}")
        elif len(input_shape) == 2:
            # Shape: (batch, features) - flattened input
            model_input_shape = (input_shape[1],)
            logger.info(f"Detected flattened input shape: {model_input_shape}")
        else:
            logger.warning(f"Unexpected input shape format: {input_shape}")
            model_input_shape = input_shape[1:]

        return model
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        logger.error(traceback.format_exc())
        return None


@app.on_event("startup")
async def startup_event():
    """Initialize liveness detection model on startup"""
    global liveness_model

    try:
        logger.info("🔄 Initializing liveness detection system...")

        # Load liveness model
        liveness_model = load_liveness_model()

        if liveness_model is None:
            logger.error("❌ Failed to initialize liveness model")
        else:
            # Warm up the model with correct input shape
            logger.info("🔥 Warming up the model...")
            if model_input_shape and len(model_input_shape) == 3:
                # 4D input: (batch, height, width, channels)
                dummy_input = np.zeros((1,) + model_input_shape, dtype=np.float32)
            elif model_input_shape and len(model_input_shape) == 1:
                # Flattened input: (batch, features)
                dummy_input = np.zeros((1,) + model_input_shape, dtype=np.float32)
            else:
                # Fallback
                dummy_input = np.zeros((1, 224, 224, 3), dtype=np.float32)

            _ = liveness_model.predict(dummy_input, verbose=0)
            logger.info("✅ Model warmed up successfully!")

    except Exception as e:
        logger.error(f"❌ Failed to initialize system: {str(e)}")
        logger.error(traceback.format_exc())


def preprocess_image(img_array: np.ndarray) -> np.ndarray:
    """
    Preprocess image for model input based on detected model input shape

    Args:
        img_array: image array in BGR format

    Returns:
        Preprocessed image ready for model
    """
    if model_input_shape is None:
        raise ValueError("Model input shape not detected")

    # Check if model expects flattened input or 4D input
    if len(model_input_shape) == 1:
        # Flattened input expected
        # Need to determine original image dimensions from flattened size
        # 12800 = 80 * 80 * 2 or 64 * 64 * ~3.125 (not exact)
        # Let's try common sizes
        flattened_size = model_input_shape[0]

        # Try to find dimensions that match
        possible_configs = [
            (80, 80, 2),   # 12800
            (64, 100, 2),  # 12800
            (50, 128, 2),  # 12800
            (160, 80, 1),  # 12800
        ]

        # Use the first matching config or make an educated guess
        img_height, img_width, img_channels = 80, 80, 2
        for h, w, c in possible_configs:
            if h * w * c == flattened_size:
                img_height, img_width, img_channels = h, w, c
                break

        # If still doesn't match, calculate from flattened size
        if img_height * img_width * img_channels != flattened_size:
            # Assume square image with 3 channels
            side = int(np.sqrt(flattened_size / 3))
            if side * side * 3 == flattened_size:
                img_height, img_width, img_channels = side, side, 3
            else:
                # Just resize to common size and flatten
                img_height, img_width, img_channels = 64, 64, 3

        logger.debug(f"Using preprocessing: resize to ({img_height}, {img_width}) with {img_channels} channels")

        # Resize
        img_resized = cv2.resize(img_array, (img_width, img_height))

        # Convert BGR to RGB
        img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)

        # Handle channel requirements
        if img_channels == 1:
            # Convert to grayscale
            img_rgb = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
            img_rgb = np.expand_dims(img_rgb, axis=-1)
        elif img_channels == 2:
            # Take only first 2 channels
            img_rgb = img_rgb[:, :, :2]

        # Normalize to [0, 1]
        img_normalized = img_rgb.astype(np.float32) / 255.0

        # Flatten
        img_flattened = img_normalized.flatten()

        # Ensure correct size (pad or truncate if needed)
        if len(img_flattened) > flattened_size:
            img_flattened = img_flattened[:flattened_size]
        elif len(img_flattened) < flattened_size:
            img_flattened = np.pad(img_flattened, (0, flattened_size - len(img_flattened)))

        # Add batch dimension
        img_batch = np.expand_dims(img_flattened, axis=0)

    else:
        # 4D input expected: (height, width, channels)
        img_height, img_width, img_channels = model_input_shape

        # Resize to model input size
        img_resized = cv2.resize(img_array, (img_width, img_height))

        # Convert BGR to RGB
        img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)

        # Handle channel requirements
        if img_channels == 1 and len(img_rgb.shape) == 3:
            img_rgb = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
            img_rgb = np.expand_dims(img_rgb, axis=-1)
        elif img_channels != img_rgb.shape[-1]:
            logger.warning(f"Channel mismatch: model expects {img_channels}, image has {img_rgb.shape[-1]}")

        # Normalize to [0, 1]
        img_normalized = img_rgb.astype(np.float32) / 255.0

        # Add batch dimension
        img_batch = np.expand_dims(img_normalized, axis=0)

    logger.debug(f"Preprocessed shape: {img_batch.shape}")
    return img_batch


def predict_liveness(img_array: np.ndarray) -> Dict[str, Any]:
    """
    Predict if image is real or fake using the model

    Args:
        img_array: image array in BGR format

    Returns:
        Dictionary with prediction results
    """
    if liveness_model is None:
        return {
            "is_real": None,
            "confidence": 0.0,
            "score": None,
            "error": "Model not loaded"
        }

    try:
        # Preprocess image
        img_input = preprocess_image(img_array)

        # Make prediction
        prediction = liveness_model.predict(img_input, verbose=0)

        # Extract score
        # Assuming binary classification: output is [fake_prob, real_prob] or single value
        if prediction.shape[-1] == 2:
            # Two outputs: [fake, real]
            fake_score = float(prediction[0][0])
            real_score = float(prediction[0][1])
            is_real = real_score > fake_score
            confidence = real_score if is_real else fake_score
        elif prediction.shape[-1] == 1:
            # Single output: probability of being real
            real_score = float(prediction[0][0])
            is_real = real_score > 0.5
            confidence = real_score if is_real else (1 - real_score)
        else:
            # Unknown output format
            logger.warning(f"Unexpected prediction shape: {prediction.shape}")
            real_score = float(prediction[0][0])
            is_real = real_score > 0.5
            confidence = real_score

        return {
            "is_real": bool(is_real),
            "confidence": float(confidence),
            "score": float(real_score),
            "raw_prediction": prediction.tolist()
        }

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return {
            "is_real": None,
            "confidence": 0.0,
            "score": None,
            "error": str(e)
        }


def detect_face_liveness(image: Image.Image) -> Dict[str, Any]:
    """
    Detect if face is real or fake using custom model
    Model processes the entire image directly (assumes face is already in frame)

    Args:
        image: PIL Image object

    Returns:
        Dictionary with liveness detection results
    """
    # Convert PIL to numpy array
    img_array = np.array(image)

    # Convert RGB to BGR for OpenCV compatibility
    if len(img_array.shape) == 3 and img_array.shape[2] == 3:
        img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

    try:
        # Predict liveness directly on the full image
        # Model expects the face to be already in the frame
        prediction_result = predict_liveness(img_array)

        if "error" in prediction_result:
            return {
                "is_real": None,
                "confidence": 0.0,
                "score": None,
                "error": prediction_result["error"]
            }

        is_real = prediction_result["is_real"]
        confidence = prediction_result["confidence"]
        score = prediction_result["score"]

        return {
            "is_real": bool(is_real),
            "prediction": "real" if is_real else "fake",
            "confidence": float(confidence),
            "score": float(score),
            "message": "Face is real" if is_real else "Face is fake (spoofing detected)"
        }

    except Exception as e:
        logger.error(f"Error in liveness detection: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            "is_real": None,
            "confidence": 0.0,
            "score": None,
            "error": str(e)
        }


@app.websocket("/ws/liveness")
async def websocket_liveness_detection(websocket: WebSocket):
    """
    WebSocket endpoint for real-time liveness detection using custom H5 model

    Expected message format:
    {
        "image": "base64_encoded_image",
        "request_id": "optional_unique_id"
    }

    Response format:
    {
        "is_real": true,
        "prediction": "real",
        "confidence": 0.95,
        "score": 0.95,
        "message": "Face is real",
        "processing_time_ms": 145.67,
        "request_id": "optional_unique_id"
    }
    """
    await websocket.accept()
    client_id = f"{websocket.client.host}:{websocket.client.port}"
    logger.info(f"🔌 WebSocket connected: {client_id}")

    # Send welcome message
    await websocket.send_json({
        "status": "connected",
        "message": "WebSocket connection established. Send base64 encoded images for liveness detection.",
        "service": "Custom H5 Model",
        "feature": "Real vs Fake face detection",
        "model_loaded": liveness_model is not None
    })

    try:
        message_count = 0

        while True:
            # Receive message
            data = await websocket.receive_text()
            message_count += 1

            start_time = time.time()

            try:
                # Parse JSON
                message = json.loads(data)
                request_id = message.get("request_id", f"req_{message_count}")

                # Validate message
                if "image" not in message:
                    await websocket.send_json({
                        "error": "Missing 'image' field in message",
                        "request_id": request_id
                    })
                    continue

                # Decode base64 image
                try:
                    image_base64 = message["image"]
                    # Remove data URI prefix if present
                    if "," in image_base64:
                        image_base64 = image_base64.split(",", 1)[1]

                    # Decode
                    image_bytes = base64.b64decode(image_base64)
                    image = Image.open(BytesIO(image_bytes)).convert("RGB")

                    logger.debug(f"📸 Received image: {image.size}, {image.mode}")

                except Exception as img_error:
                    logger.error(f"❌ Image decode error: {str(img_error)}")
                    await websocket.send_json({
                        "error": f"Invalid image data: {str(img_error)}",
                        "request_id": request_id
                    })
                    continue

                # Perform liveness detection
                result = detect_face_liveness(image)

                # Add metadata
                result["request_id"] = request_id
                result["processing_time_ms"] = round((time.time() - start_time) * 1000, 2)

                logger.info(
                    f"✅ Detection #{message_count}: "
                    f"{result.get('prediction', 'N/A').upper()} "
                    f"(confidence: {result.get('confidence', 0)*100:.1f}%) - "
                    f"{result['processing_time_ms']}ms"
                )

                # Send response
                await websocket.send_json(result)

            except json.JSONDecodeError as e:
                logger.error(f"❌ JSON decode error: {str(e)}")
                await websocket.send_json({
                    "error": "Invalid JSON format",
                    "details": str(e)
                })

            except Exception as e:
                logger.error(f"❌ Processing error: {str(e)}")
                logger.error(traceback.format_exc())
                await websocket.send_json({
                    "error": "Internal server error",
                    "details": str(e),
                    "request_id": message.get("request_id") if "message" in locals() else None
                })

    except WebSocketDisconnect:
        logger.info(f"🔌 WebSocket disconnected: {client_id} (processed {message_count} messages)")

    except Exception as e:
        logger.error(f"❌ WebSocket error: {str(e)}")
        logger.error(traceback.format_exc())


@app.get("/", response_class=HTMLResponse)
async def home():
    """Home page with WebSocket test interface"""
    html_content = """
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Liveness Detection - Custom H5 Model</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }

            .container {
                max-width: 1200px;
                margin: 0 auto;
            }

            .header {
                text-align: center;
                color: white;
                margin-bottom: 30px;
            }

            .header h1 {
                font-size: 2.5em;
                margin-bottom: 10px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }

            .header p {
                font-size: 1.2em;
                opacity: 0.9;
            }

            .main-content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }

            @media (max-width: 768px) {
                .main-content {
                    grid-template-columns: 1fr;
                }
            }

            .card {
                background: white;
                border-radius: 15px;
                padding: 25px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }

            .card h2 {
                color: #667eea;
                margin-bottom: 20px;
                font-size: 1.5em;
            }

            .status {
                display: inline-block;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: bold;
                margin-bottom: 15px;
            }

            .status.connected {
                background: #10b981;
                color: white;
            }

            .status.disconnected {
                background: #ef4444;
                color: white;
            }

            .btn {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 1em;
                font-weight: bold;
                cursor: pointer;
                margin: 5px;
                transition: all 0.3s;
            }

            .btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }

            .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .btn-primary {
                background: #667eea;
                color: white;
            }

            .btn-danger {
                background: #ef4444;
                color: white;
            }

            .btn-success {
                background: #10b981;
                color: white;
            }

            .file-input-wrapper {
                position: relative;
                overflow: hidden;
                display: inline-block;
            }

            .file-input-wrapper input[type=file] {
                position: absolute;
                left: -9999px;
            }

            #preview {
                max-width: 100%;
                max-height: 300px;
                border-radius: 8px;
                margin-top: 15px;
                display: none;
                border: 3px solid #e5e7eb;
            }

            .result-box {
                background: #f9fafb;
                border-radius: 8px;
                padding: 15px;
                margin-top: 15px;
                max-height: 400px;
                overflow-y: auto;
            }

            .result-item {
                background: white;
                border-left: 4px solid #667eea;
                border-radius: 4px;
                padding: 12px;
                margin-bottom: 10px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .result-item.real {
                border-left-color: #10b981;
            }

            .result-item.fake {
                border-left-color: #ef4444;
            }

            .result-item small {
                color: #6b7280;
                font-size: 0.85em;
            }

            .result-item strong {
                font-size: 1.2em;
            }

            .stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin-top: 15px;
            }

            .stat-box {
                background: #f9fafb;
                padding: 10px;
                border-radius: 8px;
                text-align: center;
            }

            .stat-box .value {
                font-size: 1.5em;
                font-weight: bold;
                color: #667eea;
            }

            .stat-box .label {
                font-size: 0.85em;
                color: #6b7280;
                margin-top: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>SATS X Liveness</h1>
                <p>Real-time presentation-attack detection powered by the SATS X vision model.</p>
            </div>

            <div class="main-content">
                <!-- Control Panel -->
                <div class="card">
                    <h2>Connection</h2>

                    <div>
                        <span id="status" class="status disconnected">Disconnected</span>
                    </div>

                    <div style="margin: 15px 0;">
                        <button id="connectBtn" class="btn btn-primary" onclick="connect()">
                            Connect WebSocket
                        </button>
                        <button id="disconnectBtn" class="btn btn-danger" onclick="disconnect()" disabled>
                            Disconnect
                        </button>
                    </div>

                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">

                    <h3 style="margin-bottom: 15px;">Image inspection</h3>

                    <div class="file-input-wrapper">
                        <label for="imageInput" class="btn btn-success">
                            Select image
                        </label>
                        <input type="file" id="imageInput" accept="image/*" onchange="previewImage()" disabled>
                    </div>

                    <button id="sendBtn" class="btn btn-primary" onclick="sendImage()" disabled>
                        Run inspection
                    </button>

                    <img id="preview" alt="Preview">

                    <div class="stats">
                        <div class="stat-box">
                            <div class="value" id="totalRequests">0</div>
                            <div class="label">Total requests</div>
                        </div>
                        <div class="stat-box">
                            <div class="value" id="avgTime">0ms</div>
                            <div class="label">Average latency</div>
                        </div>
                        <div class="stat-box">
                            <div class="value" id="successRate">0%</div>
                            <div class="label">Success rate</div>
                        </div>
                    </div>
                </div>

                <!-- Results Panel -->
                <div class="card">
                    <h2>Inspection results</h2>
                    <div id="results" class="result-box">
                        <p style="color: #6b7280; text-align: center; padding: 20px;">
                            No results yet. Connect the service and submit an image to begin.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <script>
            let ws = null;
            let currentImageData = null;
            let stats = {
                total: 0,
                success: 0,
                totalTime: 0
            };

            function connect() {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${window.location.host}/ws/liveness`;

                ws = new WebSocket(wsUrl);

                ws.onopen = function(event) {
                    console.log('✅ WebSocket connected');
                    document.getElementById('status').textContent = 'Connected';
                    document.getElementById('status').className = 'status connected';
                    document.getElementById('connectBtn').disabled = true;
                    document.getElementById('disconnectBtn').disabled = false;
                    document.getElementById('imageInput').disabled = false;
                };

                ws.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    console.log('📨 Received:', data);

                    if (data.status === 'connected') {
                        addResult(`✅ ${data.message}`, 'info');
                    } else if (data.error) {
                        addResult(`<strong>Error:</strong> ${data.error}`, 'error');
                    } else {
                        stats.total++;
                        stats.success++;
                        stats.totalTime += data.processing_time_ms;
                        updateStats();

                        const resultClass = data.is_real ? 'real' : 'fake';
                        const icon = data.is_real ? '✅' : '❌';

                        const predictionText = data.prediction ? data.prediction.toUpperCase() : 'N/A';
                        const confidence = data.confidence ? (data.confidence * 100).toFixed(1) : '0';
                        const resultHtml = `
                            ${icon} <strong>${predictionText}</strong><br>
                            <small>🎯 Confidence: <strong>${confidence}%</strong></small><br>
                            <small>📊 Score: <strong>${data.score?.toFixed(3) || 'N/A'}</strong></small><br>
                            <small>💬 ${data.message || ''}</small><br>
                            <small>⏱️ ${data.processing_time_ms}ms</small>
                        `;

                        addResult(resultHtml, resultClass);
                    }
                };

                ws.onerror = function(event) {
                    console.error('❌ WebSocket error:', event);
                    addResult('❌ WebSocket error occurred', 'error');
                };

                ws.onclose = function(event) {
                    console.log('🔌 WebSocket disconnected');
                    document.getElementById('status').textContent = 'Disconnected';
                    document.getElementById('status').className = 'status disconnected';
                    document.getElementById('connectBtn').disabled = false;
                    document.getElementById('disconnectBtn').disabled = true;
                    document.getElementById('imageInput').disabled = true;
                    document.getElementById('sendBtn').disabled = true;
                };
            }

            function disconnect() {
                if (ws) {
                    ws.close();
                    ws = null;
                }
            }

            function previewImage() {
                const input = document.getElementById('imageInput');
                const preview = document.getElementById('preview');
                const sendBtn = document.getElementById('sendBtn');

                if (input.files && input.files[0]) {
                    const reader = new FileReader();

                    reader.onload = function(e) {
                        currentImageData = e.target.result;
                        preview.src = currentImageData;
                        preview.style.display = 'block';
                        sendBtn.disabled = false;
                    };

                    reader.readAsDataURL(input.files[0]);
                }
            }

            function sendImage() {
                if (!ws || ws.readyState !== WebSocket.OPEN) {
                    alert('The WebSocket service is not connected.');
                    return;
                }

                if (!currentImageData) {
                    alert('Select an image first.');
                    return;
                }

                const message = {
                    image: currentImageData,
                    request_id: `img_${Date.now()}`
                };

                ws.send(JSON.stringify(message));
                addResult('Image submitted. Processing...', 'info');
            }

            function addResult(html, className = 'result-item') {
                const resultsDiv = document.getElementById('results');

                // Clear placeholder if exists
                if (resultsDiv.querySelector('p')) {
                    resultsDiv.innerHTML = '';
                }

                const resultItem = document.createElement('div');
                resultItem.className = `result-item ${className}`;
                resultItem.innerHTML = `
                    <small>${new Date().toLocaleTimeString('en-US')}</small><br>
                    ${html}
                `;
                resultsDiv.insertBefore(resultItem, resultsDiv.firstChild);
            }

            function updateStats() {
                document.getElementById('totalRequests').textContent = stats.total;
                document.getElementById('avgTime').textContent =
                    Math.round(stats.totalTime / stats.success) + 'ms';
                document.getElementById('successRate').textContent =
                    Math.round((stats.success / stats.total) * 100) + '%';
            }
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "liveness-detection",
        "version": "3.0.0",
        "feature": "real vs fake face detection",
        "backend": "Custom H5 Model",
        "model_loaded": liveness_model is not None,
        "model_path": str(MODEL_PATH) if MODEL_PATH.exists() else "not found"
    }


@app.get("/model-info")
async def model_info():
    """Get model information"""
    if liveness_model is None:
        return {
            "loaded": False,
            "error": "Model not loaded"
        }

    return {
        "loaded": True,
        "input_shape": str(liveness_model.input_shape),
        "output_shape": str(liveness_model.output_shape),
        "detected_input_shape": str(model_input_shape) if model_input_shape else "N/A",
        "model_path": str(MODEL_PATH),
        "layers": len(liveness_model.layers),
        "parameters": liveness_model.count_params()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
