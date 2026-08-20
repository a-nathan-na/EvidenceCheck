"""Request and response models for the HTTP API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ClaimResult = Literal["supported", "partial", "contradicted", "not_applicable"]


class HealthResponse(BaseModel):
    status: str
    message: str


class ExtractedClaims(BaseModel):
    """What the report asserts. `None` means the report did not say."""

    people: int | None = None
    cars: int | None = None
    weapon_present: bool | None = None


class TextClaims(ExtractedClaims):
    raw_text_snippet: str = ""


class ClaimDetail(BaseModel):
    claim_type: Literal["people", "cars", "weapons"]
    claim_value: int | bool | None = None
    video_value: int | bool
    result: ClaimResult
    note: str
    claim_score: int = Field(ge=0, le=100)


class VideoAnalysis(BaseModel):
    people: int
    cars: int
    weapon_present: bool
    frames_sampled: int
    frames: list[str] = Field(
        default_factory=list, description="Base64-encoded annotated JPEG frames"
    )


class AnalysisResponse(BaseModel):
    consistency_score: int = Field(ge=0, le=100)
    details: list[ClaimDetail]
    video_analysis: VideoAnalysis
    text_claims: TextClaims
