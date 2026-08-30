"""
Model Evaluation Script for Liveness Detection
Đánh giá model liveness detection với các biểu đồ và metrics chi tiết
"""

import os
import numpy as np
import tensorflow as tf
from PIL import Image
import cv2
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_curve, auc
)
from pathlib import Path
import json
import time
from typing import List, Tuple, Dict, Any
import warnings
warnings.filterwarnings('ignore')

# Cấu hình
MODEL_PATH = "../models/liveness_detection_model.h5"
TEST_REAL_DIR = "./real"
TEST_FAKE_DIR = "./fake"
OUTPUT_DIR = "../evaluation_results"
BATCH_SIZE = 32
MAX_SAMPLES_PER_CLASS = 1000  # Giới hạn số lượng ảnh để tránh quá tải

class LivenessModelEvaluator:
    def __init__(self, model_path: str):
        """Khởi tạo evaluator"""
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
            print(f"🔄 Loading model from: {self.model_path}")
            self.model = tf.keras.models.load_model(self.model_path)
            print("✅ Model loaded successfully!")

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
            print(f"❌ Error loading model: {e}")
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
            print(f"❌ Error predicting {img_path}: {e}")
            return None, 0.0, 0.0

    def load_test_data(self) -> Tuple[List[str], List[int]]:
        """Load test data từ thư mục real và fake"""
        print("🔄 Loading test data...")

        image_paths = []
        labels = []

        # Load real images
        real_dir = Path(TEST_REAL_DIR)
        if real_dir.exists():
            real_images = list(real_dir.glob("*.jpg"))[:MAX_SAMPLES_PER_CLASS]
            image_paths.extend([str(p) for p in real_images])
            labels.extend([1] * len(real_images))  # 1 = real
            print(f"📁 Loaded {len(real_images)} real images")

        # Load fake images
        fake_dir = Path(TEST_FAKE_DIR)
        if fake_dir.exists():
            fake_images = list(fake_dir.glob("*.jpg"))[:MAX_SAMPLES_PER_CLASS]
            image_paths.extend([str(p) for p in fake_images])
            labels.extend([0] * len(fake_images))  # 0 = fake
            print(f"📁 Loaded {len(fake_images)} fake images")

        print(f"📊 Total test samples: {len(image_paths)}")
        return image_paths, labels

    def evaluate_model(self):
        """Đánh giá model trên test data"""
        print("🚀 Starting model evaluation...")

        # Load test data
        image_paths, true_labels = self.load_test_data()

        if not image_paths:
            print("❌ No test data found!")
            return

        # Predict on all images
        predictions = []
        confidence_scores = []
        processing_times = []

        print("🔄 Running predictions...")
        for i, img_path in enumerate(image_paths):
            if i % 100 == 0:
                print(f"📈 Progress: {i}/{len(image_paths)}")

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

        print(f"✅ Completed {len(predictions)} predictions")

    def calculate_metrics(self) -> Dict[str, float]:
        """Tính toán các metrics"""
        if not self.predictions:
            print("❌ No predictions available!")
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

    def plot_confusion_matrix(self):
        """Vẽ confusion matrix"""
        if not self.predictions:
            return

        cm = confusion_matrix(self.true_labels, self.predictions)

        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                   xticklabels=['Fake', 'Real'],
                   yticklabels=['Fake', 'Real'])
        plt.title('Confusion Matrix', fontsize=16, fontweight='bold')
        plt.xlabel('Predicted Label', fontsize=12)
        plt.ylabel('True Label', fontsize=12)
        plt.tight_layout()
        plt.savefig(f'{OUTPUT_DIR}/confusion_matrix.png', dpi=300, bbox_inches='tight')
        plt.show()

    def plot_roc_curve(self):
        """Vẽ ROC curve"""
        if not self.predictions:
            return

        fpr, tpr, _ = roc_curve(self.true_labels, self.confidence_scores)
        roc_auc = auc(fpr, tpr)

        plt.figure(figsize=(8, 6))
        plt.plot(fpr, tpr, color='darkorange', lw=2,
                label=f'ROC curve (AUC = {roc_auc:.3f})')
        plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('False Positive Rate', fontsize=12)
        plt.ylabel('True Positive Rate', fontsize=12)
        plt.title('ROC Curve', fontsize=16, fontweight='bold')
        plt.legend(loc="lower right")
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(f'{OUTPUT_DIR}/roc_curve.png', dpi=300, bbox_inches='tight')
        plt.show()

    def plot_confidence_distribution(self):
        """Vẽ phân phối confidence scores"""
        if not self.confidence_scores:
            return

        plt.figure(figsize=(12, 5))

        # Subplot 1: Histogram
        plt.subplot(1, 2, 1)
        plt.hist(self.confidence_scores, bins=30, alpha=0.7, color='skyblue', edgecolor='black')
        plt.xlabel('Confidence Score', fontsize=12)
        plt.ylabel('Frequency', fontsize=12)
        plt.title('Confidence Score Distribution', fontsize=14, fontweight='bold')
        plt.grid(True, alpha=0.3)

        # Subplot 2: Box plot by class
        plt.subplot(1, 2, 2)
        real_confidences = [conf for conf, label in zip(self.confidence_scores, self.true_labels) if label == 1]
        fake_confidences = [conf for conf, label in zip(self.confidence_scores, self.true_labels) if label == 0]

        data_to_plot = [fake_confidences, real_confidences]
        labels = ['Fake', 'Real']

        plt.boxplot(data_to_plot, labels=labels)
        plt.ylabel('Confidence Score', fontsize=12)
        plt.title('Confidence by Class', fontsize=14, fontweight='bold')
        plt.grid(True, alpha=0.3)

        plt.tight_layout()
        plt.savefig(f'{OUTPUT_DIR}/confidence_distribution.png', dpi=300, bbox_inches='tight')
        plt.show()

    def plot_processing_time_analysis(self):
        """Phân tích thời gian xử lý"""
        if not self.processing_times:
            return

        plt.figure(figsize=(12, 5))

        # Subplot 1: Processing time histogram
        plt.subplot(1, 2, 1)
        plt.hist(self.processing_times, bins=30, alpha=0.7, color='lightcoral', edgecolor='black')
        plt.xlabel('Processing Time (seconds)', fontsize=12)
        plt.ylabel('Frequency', fontsize=12)
        plt.title('Processing Time Distribution', fontsize=14, fontweight='bold')
        plt.grid(True, alpha=0.3)

        # Subplot 2: Processing time over samples
        plt.subplot(1, 2, 2)
        plt.plot(self.processing_times, alpha=0.7, color='green')
        plt.xlabel('Sample Index', fontsize=12)
        plt.ylabel('Processing Time (seconds)', fontsize=12)
        plt.title('Processing Time Over Samples', fontsize=14, fontweight='bold')
        plt.grid(True, alpha=0.3)

        plt.tight_layout()
        plt.savefig(f'{OUTPUT_DIR}/processing_time_analysis.png', dpi=300, bbox_inches='tight')
        plt.show()

    def generate_classification_report(self):
        """Tạo classification report"""
        if not self.predictions:
            return

        report = classification_report(self.true_labels, self.predictions,
                                     target_names=['Fake', 'Real'])

        print("\n" + "="*50)
        print("📊 CLASSIFICATION REPORT")
        print("="*50)
        print(report)

        # Save to file
        with open(f'{OUTPUT_DIR}/classification_report.txt', 'w') as f:
            f.write("LIVENESS DETECTION MODEL EVALUATION REPORT\n")
            f.write("="*50 + "\n\n")
            f.write(report)
            f.write("\n\n")
            f.write("Model Information:\n")
            f.write(f"- Input Shape: {self.model_input_shape}\n")
            f.write(f"- Total Samples: {len(self.predictions)}\n")
            f.write(f"- Average Processing Time: {np.mean(self.processing_times):.4f}s\n")

    def save_results(self):
        """Lưu kết quả vào file JSON"""
        if not self.predictions:
            return

        metrics = self.calculate_metrics()

        results = {
            'model_path': self.model_path,
            'model_input_shape': str(self.model_input_shape),
            'evaluation_metrics': metrics,
            'predictions': self.predictions,
            'true_labels': self.true_labels,
            'confidence_scores': self.confidence_scores,
            'processing_times': self.processing_times,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }

        with open(f'{OUTPUT_DIR}/evaluation_results.json', 'w') as f:
            json.dump(results, f, indent=2)

        print(f"💾 Results saved to {OUTPUT_DIR}/evaluation_results.json")

    def run_full_evaluation(self):
        """Chạy đánh giá đầy đủ"""
        print("🚀 Starting Full Model Evaluation")
        print("="*50)

        # Load model
        self.load_model()

        # Evaluate model
        self.evaluate_model()

        # Calculate metrics
        metrics = self.calculate_metrics()

        # Print metrics
        print("\n📊 EVALUATION METRICS")
        print("="*30)
        for metric, value in metrics.items():
            if metric == 'avg_processing_time':
                print(f"{metric}: {value:.4f}s")
            elif metric in ['accuracy', 'precision', 'recall', 'f1_score', 'avg_confidence']:
                print(f"{metric}: {value:.4f} ({value*100:.2f}%)")
            else:
                print(f"{metric}: {value}")

        # Generate plots
        print("\n📈 Generating plots...")
        self.plot_confusion_matrix()
        self.plot_roc_curve()
        self.plot_confidence_distribution()
        self.plot_processing_time_analysis()

        # Generate report
        self.generate_classification_report()

        # Save results
        self.save_results()

        print(f"\n✅ Evaluation completed! Results saved in '{OUTPUT_DIR}' directory")
        print("📁 Generated files:")
        print("  - confusion_matrix.png")
        print("  - roc_curve.png")
        print("  - confidence_distribution.png")
        print("  - processing_time_analysis.png")
        print("  - classification_report.txt")
        print("  - evaluation_results.json")


def main():
    """Main function"""
    print("🎭 Liveness Detection Model Evaluation")
    print("="*50)

    # Check if model exists
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Model file not found: {MODEL_PATH}")
        return

    # Check if test directories exist
    if not os.path.exists(TEST_REAL_DIR):
        print(f"❌ Real test directory not found: {TEST_REAL_DIR}")
        return

    if not os.path.exists(TEST_FAKE_DIR):
        print(f"❌ Fake test directory not found: {TEST_FAKE_DIR}")
        return

    # Create evaluator and run evaluation
    evaluator = LivenessModelEvaluator(MODEL_PATH)
    evaluator.run_full_evaluation()


if __name__ == "__main__":
    main()
