"""
Main script để chạy đánh giá model liveness detection
Tự động chạy quick test và full evaluation
"""

import os
import sys
import subprocess
from pathlib import Path

def check_requirements():
    """Kiểm tra các yêu cầu cần thiết"""
    print("🔍 Checking requirements...")

    # Kiểm tra model
    model_path = "../models/liveness_detection_model.h5"
    if not os.path.exists(model_path):
        print(f"❌ Model not found: {model_path}")
        return False

    # Kiểm tra test data
    real_dir = Path("./real")
    fake_dir = Path("./fake")

    if not real_dir.exists():
        print(f"❌ Real test directory not found: {real_dir}")
        return False

    if not fake_dir.exists():
        print(f"❌ Fake test directory not found: {fake_dir}")
        return False

    # Đếm số ảnh
    real_count = len(list(real_dir.glob("*.jpg")))
    fake_count = len(list(fake_dir.glob("*.jpg")))

    print(f"📊 Found {real_count} real images and {fake_count} fake images")

    if real_count == 0 or fake_count == 0:
        print("❌ No test images found!")
        return False

    return True

def install_requirements():
    """Cài đặt requirements nếu cần"""
    print("📦 Installing requirements...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements_evaluation.txt"],
                      check=True, capture_output=True)
        print("✅ Requirements installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing requirements: {e}")
        return False

def run_quick_test():
    """Chạy quick test"""
    print("\n🚀 Running Quick Test...")
    print("="*50)
    try:
        subprocess.run([sys.executable, "quick_test.py"], check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Quick test failed: {e}")
        return False

def run_full_evaluation():
    """Chạy full evaluation"""
    print("\n📊 Running Full Evaluation...")
    print("="*50)
    try:
        subprocess.run([sys.executable, "model_evaluation.py"], check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Full evaluation failed: {e}")
        return False

def main():
    """Main function"""
    print("🎭 Liveness Detection Model Evaluation Suite")
    print("="*60)

    # Kiểm tra requirements
    if not check_requirements():
        print("\n❌ Requirements check failed!")
        return

    # Hỏi user muốn cài đặt requirements không
    install_req = input("\n📦 Do you want to install requirements? (y/n): ").lower().strip()
    if install_req == 'y':
        if not install_requirements():
            print("❌ Failed to install requirements!")
            return

    # Chạy quick test
    run_quick = input("\n🚀 Do you want to run quick test? (y/n): ").lower().strip()
    if run_quick == 'y':
        if not run_quick_test():
            print("❌ Quick test failed!")
            return

    # Chạy full evaluation
    run_full = input("\n📊 Do you want to run full evaluation with plots? (y/n): ").lower().strip()
    if run_full == 'y':
        if not run_full_evaluation():
            print("❌ Full evaluation failed!")
            return

    print("\n✅ All tests completed!")
    print("📁 Check the 'evaluation_results' directory for detailed results")

if __name__ == "__main__":
    main()
