"""
Quick Accuracy Test - Kiểm tra nhanh độ chính xác model
File đơn giản để chạy kiểm tra độ chính xác nhanh chóng
"""

import os
import sys
from pathlib import Path

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

from accuracy_checker import AccuracyChecker

def quick_test():
    """Chạy kiểm tra nhanh độ chính xác"""
    print("🚀 QUICK ACCURACY TEST - KIỂM TRA NHANH ĐỘ CHÍNH XÁC")
    print("="*60)

    # Cấu hình
    MODEL_PATH = "../models/liveness_detection_model.h5"
    TEST_REAL_DIR = "./real"
    TEST_FAKE_DIR = "./fake"

    # Kiểm tra file và thư mục
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Không tìm thấy model: {MODEL_PATH}")
        print("💡 Hãy đảm bảo model đã được train và lưu đúng vị trí")
        return False

    if not os.path.exists(TEST_REAL_DIR):
        print(f"❌ Không tìm thấy thư mục test real: {TEST_REAL_DIR}")
        print("💡 Hãy tạo thư mục 'real' và thêm ảnh thật vào")
        return False

    if not os.path.exists(TEST_FAKE_DIR):
        print(f"❌ Không tìm thấy thư mục test fake: {TEST_FAKE_DIR}")
        print("💡 Hãy tạo thư mục 'fake' và thêm ảnh giả vào")
        return False

    # Kiểm tra số lượng ảnh
    real_count = len(list(Path(TEST_REAL_DIR).glob("*.jpg")))
    fake_count = len(list(Path(TEST_FAKE_DIR).glob("*.jpg")))

    print(f"📊 Số lượng ảnh test:")
    print(f"   - Ảnh thật: {real_count}")
    print(f"   - Ảnh giả: {fake_count}")
    print(f"   - Tổng cộng: {real_count + fake_count}")

    if real_count == 0 and fake_count == 0:
        print("❌ Không có ảnh test nào!")
        return False

    if real_count == 0:
        print("⚠️ Cảnh báo: Không có ảnh thật để test")

    if fake_count == 0:
        print("⚠️ Cảnh báo: Không có ảnh giả để test")

    print("\n🔄 Bắt đầu kiểm tra...")

    try:
        # Tạo checker và chạy test
        checker = AccuracyChecker(MODEL_PATH)
        checker.run_full_accuracy_check()

        print("\n✅ KIỂM TRA HOÀN THÀNH!")
        print("📁 Kết quả đã được lưu trong thư mục '../evaluation_results/'")

        return True

    except Exception as e:
        print(f"❌ Lỗi trong quá trình kiểm tra: {e}")
        return False

def show_help():
    """Hiển thị hướng dẫn sử dụng"""
    print("📖 HƯỚNG DẪN SỬ DỤNG QUICK ACCURACY TEST")
    print("="*50)
    print()
    print("1. Chuẩn bị dữ liệu test:")
    print("   - Tạo thư mục 'real' và thêm ảnh thật (.jpg)")
    print("   - Tạo thư mục 'fake' và thêm ảnh giả (.jpg)")
    print()
    print("2. Đảm bảo model đã được train:")
    print("   - File model: ../models/liveness_detection_model.h5")
    print()
    print("3. Chạy kiểm tra:")
    print("   python quick_accuracy_test.py")
    print()
    print("4. Xem kết quả:")
    print("   - Báo cáo text hiển thị trên terminal")
    print("   - Biểu đồ: ../evaluation_results/accuracy_report.png")
    print("   - Dữ liệu JSON: ../evaluation_results/accuracy_results.json")
    print()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ['-h', '--help', 'help']:
        show_help()
    else:
        success = quick_test()
        if not success:
            print("\n💡 Gợi ý:")
            print("   - Chạy 'python quick_accuracy_test.py --help' để xem hướng dẫn")
            print("   - Đảm bảo đã có model và dữ liệu test")
            sys.exit(1)
