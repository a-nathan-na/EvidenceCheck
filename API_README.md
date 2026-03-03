# EvidenceCheck MVP - FastAPI REST API

## Overview

The application has been converted from Streamlit to a FastAPI REST API. The API integrates:
- **VideoKeyframeProcessor**: Advanced video analysis with collision detection and severity classification
- **ReportProcessor**: Text parsing with OCR support for incident reports
- **Video Analyzer**: Legacy video analyzer for object detection (people, cars, weapons)

## Installation

### Install FastAPI Dependencies

```bash
pip install fastapi uvicorn[standard] python-multipart
```

Or install all requirements:

```bash
pip install -r requirements.txt
```

## Running the API

### Development Server

```bash
# Using uvicorn directly
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# Or using Python
python app.py
```

The API will be available at: `http://localhost:8000`

### API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## API Endpoints

### 1. Health Check

**GET** `/health`

Returns API health status.

**Response:**
```json
{
  "status": "healthy",
  "message": "API is operational"
}
```

### 2. Analyze Video and Text

**POST** `/analyze`

Analyzes a video file and text description for consistency.

**Request:**
- `video`: Video file (MP4, MOV, AVI, MKV) - multipart/form-data
- `text_description`: Text description of the incident - form field
- `use_keyframe_processor`: Boolean (default: true) - whether to use new VideoKeyframeProcessor

**Example using curl:**
```bash
curl -X POST "http://localhost:8000/analyze" \
  -F "video=@clips/clip1/clip1.mp4" \
  -F "text_description=A traffic collision occurred at an intersection involving two vehicles: a red sedan and a grey Nissan SUV. The grey SUV was traveling straight through the intersection. The red sedan attempted to make a left turn and failed to yield, resulting in a collision." \
  -F "use_keyframe_processor=true"
```

**Response:**
```json
{
  "success": true,
  "consistency_score": 85,
  "details": [
    {
      "claim_type": "people",
      "claim_value": 3,
      "video_value": 2,
      "result": "partial",
      "note": "Close match: claimed 3, detected 2 (difference: 1)"
    },
    {
      "claim_type": "cars",
      "claim_value": 2,
      "video_value": 2,
      "result": "supported",
      "note": "Exact match: 2 cars detected"
    }
  ],
  "video_analysis": {
    "people": 2,
    "cars": 2,
    "weapon_present": false,
    "frames_count": 3,
    "frames": ["base64_encoded_frame1", "base64_encoded_frame2", ...],
    "collision_detected": true,
    "collision_timestamp": 5.23,
    "collision_confidence": 0.85,
    "severity": "Moderate",
    "severity_confidence": 0.75
  },
  "text_claims": {
    "people": 3,
    "cars": 2,
    "weapon_present": null,
    "raw_text_snippet": "A traffic collision occurred...",
    "time_seconds": 1800,
    "severity_report": "Moderate"
  },
  "error": null
}
```

### 3. Analyze Text Only

**POST** `/analyze-text-only`

Analyzes text/report without video. Extracts time, severity, and claims.

**Request:**
- `text_description`: Text description or report - form field

**Example:**
```bash
curl -X POST "http://localhost:8000/analyze-text-only" \
  -F "text_description=Date: October 17, 2017. Time: 02:53 PM. A severe collision occurred involving multiple vehicles."
```

**Response:**
```json
{
  "success": true,
  "claims": {
    "people": null,
    "cars": null,
    "weapon_present": null
  },
  "report_data": {
    "TReport": 503,
    "SeverityReport": "Severe",
    "RawTextSnippet": "Date: October 17, 2017..."
  }
}
```

## Python Client Example

```python
import requests

# Analyze video and text
url = "http://localhost:8000/analyze"
files = {
    "video": ("clip1.mp4", open("clips/clip1/clip1.mp4", "rb"), "video/mp4")
}
data = {
    "text_description": "Two cars collided at the intersection. Three people were present.",
    "use_keyframe_processor": "true"
}

response = requests.post(url, files=files, data=data)
result = response.json()

print(f"Consistency Score: {result['consistency_score']}/100")
print(f"Collision Detected: {result['video_analysis']['collision_detected']}")
print(f"Severity: {result['video_analysis']['severity']}")
```

## Integration Details

### VideoKeyframeProcessor Features

When `use_keyframe_processor=true`:
- **Collision Detection**: Detects vehicle collisions in video frames
- **Severity Classification**: Classifies accident severity (Minor/Moderate/Severe)
- **Keyframe Extraction**: Extracts keyframes at specified intervals
- **Timestamp Extraction**: Identifies collision timestamp

### ReportProcessor Features

- **Time Extraction**: Parses time from text (12h/24h format)
- **Severity Extraction**: Extracts severity from text descriptions
- **OCR Support**: Can process images of reports (handwriting or printed)

### Legacy Video Analyzer

The legacy `video_analyzer` is still used for:
- **Object Detection**: People, cars, weapons counting
- **Frame Annotation**: Annotated frames with bounding boxes

Both systems work together to provide comprehensive analysis.

## Docker Support

To run with Docker, update the `Dockerfile` to use FastAPI instead of Streamlit:

```dockerfile
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Testing

Use the interactive API documentation at `/docs` to test endpoints, or use tools like:
- **Postman**: Import the OpenAPI schema from `/openapi.json`
- **curl**: Command-line tool (examples above)
- **Python requests**: Python client example above

