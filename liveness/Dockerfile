FROM python:3.11-slim

WORKDIR /srv

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY requirements-serving.txt .
RUN pip install --no-cache-dir -r requirements-serving.txt

COPY scripts/fetch_face_models.sh scripts/fetch_face_models.sh
RUN bash scripts/fetch_face_models.sh /srv/models/faces

COPY app/__init__.py app/serving.py app/faces.py app/liveness_model.py app/
COPY models/liveness-detection-model.tflite models/liveness-detection-model.tflite

RUN useradd --system --no-create-home liveness
USER liveness

EXPOSE 8000
CMD ["uvicorn", "app.serving:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
