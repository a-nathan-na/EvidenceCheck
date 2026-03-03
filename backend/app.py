"""
EvidenceCheck MVP - FastAPI REST API

REST API for video-text consistency checking.
Processes videos and incident reports to determine consistency.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import tempfile
import os
import cv2
import base64
import re

from video_analyzer import analyze_video
from scoring import score_consistency


# Initialize FastAPI app
app = FastAPI(
    title="EvidenceCheck MVP API",
    description="Video ↔ Text Consistency Checker REST API",
    version="1.0.0",
)


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalysisResponse(BaseModel):
    success: bool
    consistency_score: int
    details: list
    video_analysis: Dict[str, Any]
    text_claims: Dict[str, Any]
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    message: str


def extract_claims_from_text(text: str) -> Dict[str, Any]:
    """
    Extract claims (people, cars, weapons) from text description.
    """
    claims = {
        "people": None,
        "cars": None,
        "weapon_present": None,
    }

    text_lower = text.lower()

    # Extract people count
    people_patterns = [
        r"\b(?:one|single|a|an)\s+(?:person|people|individual|man|woman|pedestrian)\b",
        r"\b(two|three|four|five|six|seven|eight|nine|ten)\s+(?:people|persons|individuals|men|women|pedestrians)\b",
        r"\b(\d+)\s+(?:people|persons|individuals|men|women|pedestrians)\b",
    ]

    for pattern in people_patterns:
        match = re.search(pattern, text_lower)
        if match:
            if match.group(0).startswith(("one", "single", "a ", "an ")):
                claims["people"] = 1
                break
            else:
                number_words = {
                    "two": 2,
                    "three": 3,
                    "four": 4,
                    "five": 5,
                    "six": 6,
                    "seven": 7,
                    "eight": 8,
                    "nine": 9,
                    "ten": 10,
                }
                if len(match.groups()) > 0:
                    num_str = match.group(1)
                    if num_str.isdigit():
                        claims["people"] = int(num_str)
                    elif num_str in number_words:
                        claims["people"] = number_words[num_str]
                    break

    # Extract cars/vehicles count
    vehicle_patterns = [
        r"\b(?:one|single|a|an)\s+(?:car|vehicle|auto|sedan|suv|truck|van)\b",
        r"\b(two|three|four|five|six|seven|eight|nine|ten)\s+(?:cars|vehicles|autos|sedans|suvs|trucks|vans)\b",
        r"\b(\d+)\s+(?:cars|vehicles|autos|sedans|suvs|trucks|vans)\b",
    ]

    for pattern in vehicle_patterns:
        match = re.search(pattern, text_lower)
        if match:
            if match.group(0).startswith(("one", "single", "a ", "an ")):
                claims["cars"] = 1
                break
            else:
                number_words = {
                    "two": 2,
                    "three": 3,
                    "four": 4,
                    "five": 5,
                    "six": 6,
                    "seven": 7,
                    "eight": 8,
                    "nine": 9,
                    "ten": 10,
                }
                if len(match.groups()) > 0:
                    num_str = match.group(1)
                    if num_str.isdigit():
                        claims["cars"] = int(num_str)
                    elif num_str in number_words:
                        claims["cars"] = number_words[num_str]
                    break

    # Extract weapon presence
    weapon_present_patterns = [
        r"\b(?:gun|knife|weapon|firearm|pistol|rifle)\s+(?:present|visible|seen|detected|shown)\b",
        r"\b(?:a|an|the)\s+(?:gun|knife|weapon|firearm|pistol|rifle)\b",
    ]

    weapon_absent_patterns = [
        r"\bno\s+(?:gun|knife|weapon|firearm|pistol|rifle)\b",
        r"\b(?:no|without)\s+weapons?\b",
    ]

    for pattern in weapon_present_patterns:
        if re.search(pattern, text_lower):
            claims["weapon_present"] = True
            break

    if claims["weapon_present"] is None:
        for pattern in weapon_absent_patterns:
            if re.search(pattern, text_lower):
                claims["weapon_present"] = False
                break

    return claims


def frame_to_base64(frame: Any) -> Optional[str]:
    """Convert OpenCV frame to base64 encoded string."""
    try:
        if frame is None:
            return None
        _, buffer = cv2.imencode(".jpg", frame)
        frame_base64 = base64.b64encode(buffer).decode("utf-8")
        return frame_base64
    except Exception:
        return None


@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - health check."""
    return {
        "status": "healthy",
        "message": "EvidenceCheck MVP API is running",
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "message": "API is operational",
    }


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_consistency(
    video: UploadFile = File(..., description="Video file to analyze"),
    text_description: str = Form(
        "", description="Text description of the incident (optional if text_file is provided)"
    ),
    text_file: UploadFile | None = File(
        None, description="Optional text file containing the description"
    ),
):
    """
    Analyze video and text description for consistency.
    """
    tmp_path = None

    try:
        if not video.filename:
            raise HTTPException(status_code=400, detail="No video file provided")

        allowed_extensions = {".mp4", ".mov", ".avi", ".mkv"}
        file_ext = os.path.splitext(video.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format. Allowed: {', '.join(allowed_extensions)}",
            )

        if (not text_file or not text_file.filename) and not text_description.strip():
            raise HTTPException(
                status_code=400,
                detail="Either a text description or a text file is required",
            )

        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
            content = await video.read()
            tmp.write(content)
            tmp_path = tmp.name
        # Determine source text: file (if provided) or form field
        source_text = text_description
        if text_file and text_file.filename:
            file_bytes = await text_file.read()
            try:
                source_text = file_bytes.decode("utf-8", errors="ignore")
            except Exception:
                source_text = ""

        claims = extract_claims_from_text(source_text)

        video_stats = analyze_video(tmp_path)

        result = score_consistency(claims, video_stats)

        frames_base64 = []
        frames = video_stats.get("frames", [])
        for frame in frames[:3]:
            frame_b64 = frame_to_base64(frame)
            if frame_b64:
                frames_base64.append(frame_b64)

        video_analysis_summary = {
            "people": video_stats.get("people", 0),
            "cars": video_stats.get("cars", 0),
            "weapon_present": video_stats.get("weapon_present", False),
            "frames_count": len(frames_base64),
            "frames": frames_base64,
        }

        text_claims_summary = {
            "people": claims.get("people"),
            "cars": claims.get("cars"),
            "weapon_present": claims.get("weapon_present"),
            "raw_text_snippet": source_text[:100] + "..."
            if len(source_text) > 100
            else source_text,
        }

        return AnalysisResponse(
            success=True,
            consistency_score=result["score"],
            details=result["details"],
            video_analysis=video_analysis_summary,
            text_claims=text_claims_summary,
            error=None,
        )

    except HTTPException:
        raise
    except Exception as e:
        return AnalysisResponse(
            success=False,
            consistency_score=0,
            details=[],
            video_analysis={},
            text_claims={},
            error=str(e),
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


@app.post("/analyze-text-only")
async def analyze_text_only(
    text_description: str = Form(..., description="Text description or report to analyze"),
):
    """
    Analyze text/report only (no video). Returns extracted claims.
    """
    if not text_description or not text_description.strip():
        raise HTTPException(status_code=400, detail="Text description is required")

    claims = extract_claims_from_text(text_description)

    return {
        "success": True,
        "claims": claims,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

