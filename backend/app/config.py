"""Runtime configuration, read once from the environment at import time."""

from __future__ import annotations

import os
from dataclasses import dataclass

DEFAULT_CORS_ORIGINS = "http://localhost:5173,http://localhost:3000"


def _split_csv(value: str) -> tuple[str, ...]:
    return tuple(item.strip() for item in value.split(",") if item.strip())


@dataclass(frozen=True)
class Settings:
    """Tunables for the detection pipeline and the HTTP layer."""

    model_name: str
    confidence_threshold: float
    sample_fps: int
    max_returned_frames: int
    cors_origins: tuple[str, ...]


def load_settings() -> Settings:
    return Settings(
        model_name=os.getenv("EVIDENCECHECK_MODEL", "yolov8n.pt"),
        confidence_threshold=float(os.getenv("EVIDENCECHECK_CONFIDENCE", "0.5")),
        sample_fps=int(os.getenv("EVIDENCECHECK_SAMPLE_FPS", "1")),
        max_returned_frames=int(os.getenv("EVIDENCECHECK_MAX_FRAMES", "3")),
        cors_origins=_split_csv(
            os.getenv("EVIDENCECHECK_CORS_ORIGINS", DEFAULT_CORS_ORIGINS)
        ),
    )


settings = load_settings()
