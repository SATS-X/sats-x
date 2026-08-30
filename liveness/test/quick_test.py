"""
Quick Test Script for Liveness Detection Model
Script test nhanh model với một vài ảnh mẫu
"""

import os
import numpy as np
import tensorflow as tf
from PIL import Image
import cv2
from pathlib import Path
import time

def quick_test_model():
    """Test nhanh model với một vài ảnh"""

    # Cấu hình
    MODEL_PATH = "../models/liveness_detection_model.h5"
    TEST_REAL_DIR = "./real"
    TEST_FAKE_DIR = "./fake"

    print("🚀 Quick Test for Liveness Detection Model")
    print("="*50)

    # Kiểm tra model
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Model not found: {MODEL_PATH}")
        return

    # Load model
    try:
        print("🔄 Loading model...")
        model = tf.keras.models.load_model(MODEL_PATH)
        print("✅ Model loaded successfully!")
        print(f"📐 Input shape: {model.input_shape}")
        print(f"📐 Output shape: {model.output_shape}")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return

    # Test với một vài ảnh real
    real_dir = Path(TEST_REAL_DIR)
    if real_dir.exists():
        real_images = list(real_dir.glob("*.jpg"))[:5]  # Lấy 5 ảnh đầu
        print(f"\n📁 Testing with {len(real_images)} real images...")

        for i, img_path in enumerate(real_images):
            try:
                # Load và preprocess ảnh
                img = cv2.imread(str(img_path))
                if img is None:
                    continue

                # Resize và normalize (giả sử model cần 224x224x3)
                img_resized = cv2.resize(img, (224, 224))
                img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
                img_normalized = img_rgb.astype(np.float32) / 255.0
                img_input = np.expand_dims(img_normalized, axis=0)

                # Predict
                start_time = time.time()
                prediction = model.predict(img_input, verbose=0)
                processing_time = time.time() - start_time

                # Parse kết quả
                if prediction.shape[-1] == 2:
                    fake_score = float(prediction[0][0])
                    real_score = float(prediction[0][1])
                    is_real = real_score > fake_score
                    confidence = real_score if is_real else fake_score
                else:
                    real_score = float(prediction[0][0])
                    is_real = real_score > 0.5
                    confidence = real_score if is_real else (1 - real_score)

                result = "✅ REAL" if is_real else "❌ FAKE"
                print(f"  {i+1}. {img_path.name}: {result} (conf: {confidence:.3f}, time: {processing_time:.3f}s)")

            except Exception as e:
                print(f"  {i+1}. {img_path.name}: ❌ Error - {e}")

    # Test với một vài ảnh fake
    fake_dir = Path(TEST_FAKE_DIR)
    if fake_dir.exists():
        fake_images = list(fake_dir.glob("*.jpg"))[:5]  # Lấy 5 ảnh đầu
        print(f"\n📁 Testing with {len(fake_images)} fake images...")

        for i, img_path in enumerate(fake_images):
            try:
                # Load và preprocess ảnh
                img = cv2.imread(str(img_path))
                if img is None:
                    continue

                # Resize và normalize
                img_resized = cv2.resize(img, (224, 224))
                img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
                img_normalized = img_rgb.astype(np.float32) / 255.0
                img_input = np.expand_dims(img_normalized, axis=0)

                # Predict
                start_time = time.time()
                prediction = model.predict(img_input, verbose=0)
                processing_time = time.time() - start_time

                # Parse kết quả
                if prediction.shape[-1] == 2:
                    fake_score = float(prediction[0][0])
                    real_score = float(prediction[0][1])
                    is_real = real_score > fake_score
                    confidence = real_score if is_real else fake_score
                else:
                    real_score = float(prediction[0][0])
                    is_real = real_score > 0.5
                    confidence = real_score if is_real else (1 - real_score)

                result = "✅ REAL" if is_real else "❌ FAKE"
                print(f"  {i+1}. {img_path.name}: {result} (conf: {confidence:.3f}, time: {processing_time:.3f}s)")

            except Exception as e:
                print(f"  {i+1}. {img_path.name}: ❌ Error - {e}")

    print("\n✅ Quick test completed!")
    print("💡 Run 'python model_evaluation.py' for full evaluation with plots and metrics")

if __name__ == "__main__":
    quick_test_model()
