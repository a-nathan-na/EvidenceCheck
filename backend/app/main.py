"""
EvidenceCheck HTTP API.

Two endpoints: `/analyze` runs the full video + report comparison, and `/claims`
exposes just the report parser, which is useful for checking how a piece of text is
being read without waiting on inference.
"""

from __future__ import annotations

import contextlib
import os
import tempfile

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.claims import extract_claims
from app.config import settings
from app.schemas import (
    AnalysisResponse,
    ClaimDetail,
    ExtractedClaims,
    HealthResponse,
    TextClaims,
    VideoAnalysis,
)
from app.scoring import score_consistency
from app.video import analyze_video, encode_frame_jpeg

ALLOWED_VIDEO_EXTENSIONS = frozenset({".mp4", ".mov", ".avi", ".mkv"})
SNIPPET_LENGTH = 200

app = FastAPI(
    title="EvidenceCheck API",
    description="Compares a written incident report against what a video actually shows.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def _snippet(text: str) -> str:
    """Collapse whitespace and truncate, for echoing the report back to the caller."""
    collapsed = " ".join(text.split())
    if len(collapsed) <= SNIPPET_LENGTH:
        return collapsed
    return collapsed[:SNIPPET_LENGTH] + "..."


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="healthy", message="EvidenceCheck API is running")


@app.post("/claims", response_model=ExtractedClaims)
async def parse_claims(
    text_description: str = Form(..., description="Report text to parse"),
) -> ExtractedClaims:
    """Parse a report without running video analysis."""
    if not text_description.strip():
        raise HTTPException(status_code=400, detail="text_description cannot be empty")
    return ExtractedClaims(**extract_claims(text_description))


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    video: UploadFile = File(..., description="Video clip to analyse"),
    text_description: str = Form(
        "", description="Report text; ignored when text_file is supplied"
    ),
    text_file: UploadFile | None = File(
        None, description="Report file; takes precedence over text_description"
    ),
) -> AnalysisResponse:
    """Compare a video clip against a written report and score their agreement."""
    extension = os.path.splitext(video.filename or "")[1].lower()
    if extension not in ALLOWED_VIDEO_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_VIDEO_EXTENSIONS))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video format. Allowed extensions: {allowed}",
        )

    report_text = text_description
    if text_file is not None and text_file.filename:
        report_text = (await text_file.read()).decode("utf-8", errors="ignore")

    if not report_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Provide a report via text_description or text_file",
        )

    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as tmp:
            tmp.write(await video.read())
            tmp_path = tmp.name
        detections = analyze_video(tmp_path)
    except (FileNotFoundError, ValueError) as exc:
        # Unreadable or corrupt upload — the request was well-formed, the file was not.
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    finally:
        if tmp_path is not None:
            with contextlib.suppress(OSError):
                os.unlink(tmp_path)

    claims = extract_claims(report_text)
    result = score_consistency(claims, detections)

    frames = [
        encoded
        for encoded in (encode_frame_jpeg(f) for f in detections.get("frames", []))
        if encoded
    ]

    return AnalysisResponse(
        consistency_score=result["score"],
        details=[ClaimDetail(**detail) for detail in result["details"]],
        video_analysis=VideoAnalysis(
            people=detections["people"],
            cars=detections["cars"],
            weapon_present=detections["weapon_present"],
            frames_sampled=detections["frames_sampled"],
            frames=frames,
        ),
        text_claims=TextClaims(**claims, raw_text_snippet=_snippet(report_text)),
    )
