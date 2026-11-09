FROM python:3.11-slim

WORKDIR /srv

COPY requirements-serving.txt .
RUN pip install --no-cache-dir -r requirements-serving.txt

COPY app/serving.py app/serving.py
COPY models/liveness-detection-model.tflite models/liveness-detection-model.tflite

RUN useradd --system --no-create-home liveness
USER liveness

EXPOSE 8000
CMD ["uvicorn", "app.serving:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
