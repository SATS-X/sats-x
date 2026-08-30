"""
Kiểm tra độ chính xác (Accuracy) của Model Liveness Detection
File đơn giản để đánh giá hiệu suất model trên tập test
"""

import os
import sys
import numpy as np
import tensorflow as tf
import cv2
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)
import time
import json
from typing import List, Tuple, Dict, Any
import warnings
warnings.filterwarnings('ignore')

# Cấu hình
MODEL_PATH = "../models/liveness_detection_model.h5"
TEST_REAL_DIR = "./real"
TEST_FAKE_DIR = "./fake"
OUTPUT_DIR = "../evaluation_results"
MAX_SAMPLES_PER_CLASS = 100  # Giảm số lượng để test nhanh hơn

class AccuracyChecker:
    def __init__(self, model_path: str):
        """Khởi tạo checker"""
        self.model_path = model_path
        self.model = None
        self.model_input_shape = None
        self.predictions = []
        self.true_labels = []
        self.confidence_scores = []
        self.processing_times = []

        # Tạo thư mục output
        Path(OUTPUT_DIR).mkdir(exist_ok=True)

    def load_model(self):
        """Load model và xác định input shape"""
        try:
            print(f"🔄 Đang tải model từ: {self.model_path}")
            self.model = tf.keras.models.load_model(self.model_path)
            print("✅ Model đã tải thành công!")

            # Xác định input shape
            input_shape = self.model.input_shape
            if len(input_shape) == 4:
                self.model_input_shape = (input_shape[1], input_shape[2], input_shape[3])
                print(f"📐 Input shape: {self.model_input_shape}")
            elif len(input_shape) == 2:
                self.model_input_shape = (input_shape[1],)
                print(f"📐 Flattened input shape: {self.model_input_shape}")
            else:
                print(f"⚠️ Unexpected input shape: {input_shape}")
                self.model_input_shape = input_shape[1:]

        except Exception as e:
            print(f"❌ Lỗi khi tải model: {e}")
            raise

    def preprocess_image(self, img_array: np.ndarray) -> np.ndarray:
        """Preprocess ảnh cho model"""
        if self.model_input_shape is None:
            raise ValueError("Model input shape not detected")

        # Xử lý theo input shape
        if len(self.model_input_shape) == 1:
            # Flattened input
            img_height, img_width, img_channels = 80, 80, 2  # Default config

            # Resize
            img_resized = cv2.resize(img_array, (img_width, img_height))

            # Convert BGR to RGB
            img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)

            # Handle channels
            if img_channels == 1:
                img_rgb = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
                img_rgb = np.expand_dims(img_rgb, axis=-1)
            elif img_channels == 2:
                img_rgb = img_rgb[:, :, :2]

            # Normalize
            img_normalized = img_rgb.astype(np.float32) / 255.0

            # Flatten
            img_flattened = img_normalized.flatten()

            # Ensure correct size
            flattened_size = self.model_input_shape[0]
            if len(img_flattened) > flattened_size:
                img_flattened = img_flattened[:flattened_size]
            elif len(img_flattened) < flattened_size:
                img_flattened = np.pad(img_flattened, (0, flattened_size - len(img_flattened)))

            return np.expand_dims(img_flattened, axis=0)

        else:
            # 4D input
            img_height, img_width, img_channels = self.model_input_shape

            # Resize
            img_resized = cv2.resize(img_array, (img_width, img_height))

            # Convert BGR to RGB
            img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)

            # Handle channels
            if img_channels == 1 and len(img_rgb.shape) == 3:
                img_rgb = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
                img_rgb = np.expand_dims(img_rgb, axis=-1)

            # Normalize
            img_normalized = img_rgb.astype(np.float32) / 255.0

            return np.expand_dims(img_normalized, axis=0)

    def predict_single_image(self, img_path: str) -> Tuple[bool, float, float]:
        """Dự đoán một ảnh"""
        try:
            # Load image
            img = cv2.imread(img_path)
            if img is None:
                return None, 0.0, 0.0

            # Preprocess
            img_input = self.preprocess_image(img)

            # Predict
            start_time = time.time()
            prediction = self.model.predict(img_input, verbose=0)
            processing_time = time.time() - start_time

            # Extract results
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
                # Unknown format
                real_score = float(prediction[0][0])
                is_real = real_score > 0.5
                confidence = real_score

            return is_real, confidence, processing_time

        except Exception as e:
            print(f"❌ Lỗi khi dự đoán {img_path}: {e}")
            return None, 0.0, 0.0

    def load_test_data(self) -> Tuple[List[str], List[int]]:
        """Load test data từ thư mục real và fake"""
        print("🔄 Đang tải dữ liệu test...")

        image_paths = []
        labels = []

        # Load real images
        real_dir = Path(TEST_REAL_DIR)
        if real_dir.exists():
            real_images = list(real_dir.glob("*.jpg"))[:MAX_SAMPLES_PER_CLASS]
            image_paths.extend([str(p) for p in real_images])
            labels.extend([1] * len(real_images))  # 1 = real
            print(f"📁 Đã tải {len(real_images)} ảnh thật")

        # Load fake images
        fake_dir = Path(TEST_FAKE_DIR)
        if fake_dir.exists():
            fake_images = list(fake_dir.glob("*.jpg"))[:MAX_SAMPLES_PER_CLASS]
            image_paths.extend([str(p) for p in fake_images])
            labels.extend([0] * len(fake_images))  # 0 = fake
            print(f"📁 Đã tải {len(fake_images)} ảnh giả")

        print(f"📊 Tổng số mẫu test: {len(image_paths)}")
        return image_paths, labels

    def run_accuracy_test(self):
        """Chạy kiểm tra độ chính xác"""
        print("🚀 Bắt đầu kiểm tra độ chính xác...")

        # Load test data
        image_paths, true_labels = self.load_test_data()

        if not image_paths:
            print("❌ Không tìm thấy dữ liệu test!")
            return

        # Predict on all images
        predictions = []
        confidence_scores = []
        processing_times = []

        print("🔄 Đang chạy dự đoán...")
        for i, img_path in enumerate(image_paths):
            if i % 20 == 0:
                print(f"📈 Tiến độ: {i}/{len(image_paths)}")

            is_real, confidence, proc_time = self.predict_single_image(img_path)

            if is_real is not None:
                predictions.append(1 if is_real else 0)
                confidence_scores.append(confidence)
                processing_times.append(proc_time)
            else:
                # Skip failed predictions
                continue

        # Update results
        self.predictions = predictions
        self.true_labels = true_labels[:len(predictions)]
        self.confidence_scores = confidence_scores
        self.processing_times = processing_times

        print(f"✅ Hoàn thành {len(predictions)} dự đoán")

    def calculate_accuracy_metrics(self) -> Dict[str, float]:
        """Tính toán các metrics độ chính xác"""
        if not self.predictions:
            print("❌ Không có dự đoán nào!")
            return {}

        # Basic metrics
        accuracy = accuracy_score(self.true_labels, self.predictions)
        precision = precision_score(self.true_labels, self.predictions, average='binary')
        recall = recall_score(self.true_labels, self.predictions, average='binary')
        f1 = f1_score(self.true_labels, self.predictions, average='binary')

        # Additional metrics
        avg_confidence = np.mean(self.confidence_scores)
        avg_processing_time = np.mean(self.processing_times)

        metrics = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'avg_confidence': avg_confidence,
            'avg_processing_time': avg_processing_time,
            'total_samples': len(self.predictions)
        }

        return metrics

    def print_accuracy_report(self):
        """In báo cáo độ chính xác"""
        if not self.predictions:
            return

        metrics = self.calculate_accuracy_metrics()

        print("\n" + "="*60)
        print("📊 BÁO CÁO ĐỘ CHÍNH XÁC MODEL")
        print("="*60)

        print(f"🎯 Độ chính xác (Accuracy): {metrics['accuracy']:.4f} ({metrics['accuracy']*100:.2f}%)")
        print(f"📈 Precision: {metrics['precision']:.4f} ({metrics['precision']*100:.2f}%)")
        print(f"📈 Recall: {metrics['recall']:.4f} ({metrics['recall']*100:.2f}%)")
        print(f"📈 F1-Score: {metrics['f1_score']:.4f} ({metrics['f1_score']*100:.2f}%)")
        print(f"🎯 Confidence trung bình: {metrics['avg_confidence']:.4f} ({metrics['avg_confidence']*100:.2f}%)")
        print(f"⏱️ Thời gian xử lý trung bình: {metrics['avg_processing_time']:.4f}s")
        print(f"📊 Tổng số mẫu: {metrics['total_samples']}")

        # Confusion Matrix
        cm = confusion_matrix(self.true_labels, self.predictions)
        print(f"\n📋 Confusion Matrix:")
        print(f"                Dự đoán")
        print(f"Thực tế    Fake    Real")
        print(f"Fake       {cm[0,0]:4d}    {cm[0,1]:4d}")
        print(f"Real       {cm[1,0]:4d}    {cm[1,1]:4d}")

        # Detailed classification report
        print(f"\n📋 Chi tiết phân loại:")
        report = classification_report(self.true_labels, self.predictions,
                                     target_names=['Fake', 'Real'])
        print(report)

    def plot_accuracy_visualization(self):
        """Vẽ biểu đồ trực quan độ chính xác"""
        if not self.predictions:
            return

        # Set up the plotting style
        plt.style.use('default')
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Liveness Detection Model Accuracy Report', fontsize=16, fontweight='bold')

        # 1. Confusion Matrix
        cm = confusion_matrix(self.true_labels, self.predictions)
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                   xticklabels=['Fake', 'Real'],
                   yticklabels=['Fake', 'Real'],
                   ax=axes[0,0])
        axes[0,0].set_title('Confusion Matrix', fontweight='bold')
        axes[0,0].set_xlabel('Dự đoán')
        axes[0,0].set_ylabel('Thực tế')

        # 2. Accuracy by Class
        class_accuracy = []
        for i in range(2):
            class_mask = np.array(self.true_labels) == i
            if np.sum(class_mask) > 0:
                class_pred = np.array(self.predictions)[class_mask]
                class_true = np.array(self.true_labels)[class_mask]
                class_acc = accuracy_score(class_true, class_pred)
                class_accuracy.append(class_acc)
            else:
                class_accuracy.append(0)

        classes = ['Fake', 'Real']
        bars = axes[0,1].bar(classes, class_accuracy, color=['#ff6b6b', '#4ecdc4'])
        axes[0,1].set_title('Độ Chính Xác Theo Lớp', fontweight='bold')
        axes[0,1].set_ylabel('Độ chính xác')
        axes[0,1].set_ylim(0, 1)

        # Add value labels on bars
        for bar, acc in zip(bars, class_accuracy):
            height = bar.get_height()
            axes[0,1].text(bar.get_x() + bar.get_width()/2., height + 0.01,
                          f'{acc:.3f}', ha='center', va='bottom', fontweight='bold')

        # 3. Confidence Distribution
        real_confidences = [conf for conf, label in zip(self.confidence_scores, self.true_labels) if label == 1]
        fake_confidences = [conf for conf, label in zip(self.confidence_scores, self.true_labels) if label == 0]

        axes[1,0].hist(fake_confidences, bins=20, alpha=0.7, label='Fake', color='#ff6b6b')
        axes[1,0].hist(real_confidences, bins=20, alpha=0.7, label='Real', color='#4ecdc4')
        axes[1,0].set_title('Phân Phối Confidence Score', fontweight='bold')
        axes[1,0].set_xlabel('Confidence Score')
        axes[1,0].set_ylabel('Tần suất')
        axes[1,0].legend()
        axes[1,0].grid(True, alpha=0.3)

        # 4. Processing Time Analysis
        axes[1,1].hist(self.processing_times, bins=20, alpha=0.7, color='#95a5a6', edgecolor='black')
        axes[1,1].set_title('Phân Phối Thời Gian Xử Lý', fontweight='bold')
        axes[1,1].set_xlabel('Thời gian (giây)')
        axes[1,1].set_ylabel('Tần suất')
        axes[1,1].grid(True, alpha=0.3)

        # Add average processing time line
        avg_time = np.mean(self.processing_times)
        axes[1,1].axvline(avg_time, color='red', linestyle='--', linewidth=2,
                         label=f'Trung bình: {avg_time:.4f}s')
        axes[1,1].legend()

        plt.tight_layout()
        plt.savefig(f'{OUTPUT_DIR}/accuracy_report.png', dpi=300, bbox_inches='tight')
        plt.show()

    def save_accuracy_results(self):
        """Lưu kết quả độ chính xác"""
        if not self.predictions:
            return

        metrics = self.calculate_accuracy_metrics()

        results = {
            'model_path': self.model_path,
            'model_input_shape': str(self.model_input_shape),
            'accuracy_metrics': metrics,
            'predictions': self.predictions,
            'true_labels': self.true_labels,
            'confidence_scores': self.confidence_scores,
            'processing_times': self.processing_times,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }

        with open(f'{OUTPUT_DIR}/accuracy_results.json', 'w') as f:
            json.dump(results, f, indent=2)

        print(f"💾 Kết quả đã lưu vào {OUTPUT_DIR}/accuracy_results.json")

    def run_full_accuracy_check(self):
        """Chạy kiểm tra độ chính xác đầy đủ"""
        print("🎯 KIỂM TRA ĐỘ CHÍNH XÁC MODEL LIVENESS DETECTION")
        print("="*60)

        # Load model
        self.load_model()

        # Run accuracy test
        self.run_accuracy_test()

        # Print report
        self.print_accuracy_report()

        # Generate visualization
        print("\n📈 Đang tạo biểu đồ trực quan...")
        self.plot_accuracy_visualization()

        # Save results
        self.save_accuracy_results()

        print(f"\n✅ Hoàn thành kiểm tra độ chính xác!")
        print(f"📁 Kết quả đã lưu trong thư mục '{OUTPUT_DIR}'")
        print("📊 Files được tạo:")
        print("  - accuracy_report.png")
        print("  - accuracy_results.json")


def main():
    """Main function"""
    print("🎭 Kiểm Tra Độ Chính Xác Model Liveness Detection")
    print("="*60)

    # Check if model exists
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Không tìm thấy file model: {MODEL_PATH}")
        return

    # Check if test directories exist
    if not os.path.exists(TEST_REAL_DIR):
        print(f"❌ Không tìm thấy thư mục test real: {TEST_REAL_DIR}")
        return

    if not os.path.exists(TEST_FAKE_DIR):
        print(f"❌ Không tìm thấy thư mục test fake: {TEST_FAKE_DIR}")
        return

    # Create checker and run accuracy test
    checker = AccuracyChecker(MODEL_PATH)
    checker.run_full_accuracy_check()


if __name__ == "__main__":
    main()
