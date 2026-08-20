FROM python:3.12-slim

WORKDIR /app

# opencv-python-headless needs no GUI libraries, so the usual libgl1/libsm6/libxext6
# pile is unnecessary. ffmpeg covers the video containers the API accepts.
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
COPY app ./app
RUN pip install --no-cache-dir ".[vision]"

# Bake the detector weights into the image so the first request is not a download.
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

ENV EVIDENCECHECK_CORS_ORIGINS=http://localhost:3000

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD python -c "import sys,urllib.request; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/health').status == 200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
