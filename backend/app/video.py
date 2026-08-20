"""
YOLOv8 video analysis.

The heavy dependencies (OpenCV, Ultralytics, PyTorch) are imported lazily inside the
functions that need them. Importing this module — and therefore the FastAPI app —
stays cheap, which lets the test suite exercise routing and scoring without pulling
in a multi-gigabyte install.
"""

from __future__ import annotations

import base64
import os
from typing import Any

from app.config import settings

# COCO class IDs. Note there is no firearm class: 76 is `knife`, which is the only
# weapon-like object a stock YOLOv8 model can report.
PERSON_CLASS_IDS = frozenset({0})
VEHICLE_CLASS_IDS = frozenset({2, 3, 5, 7})  # car, motorcycle, bus, truck
WEAPON_CLASS_IDS = frozenset({76})

_model: Any = None


def _get_model() -> Any:
    """Load the detector once and reuse it for the lifetime of the process."""
    global _model
    if _model is None:
        from ultralytics import YOLO

        _model = YOLO(settings.model_name)
    return _model


def _pick_representative_frames(frames: list[Any], limit: int) -> list[Any]:
    """Return at most `limit` frames spread evenly across the sampled set."""
    if len(frames) <= limit:
        return frames
    if limit <= 1:
        return frames[:1]
    step = (len(frames) - 1) / (limit - 1)
    return [frames[round(index * step)] for index in range(limit)]


def encode_frame_jpeg(frame: Any) -> str | None:
    """Encode a BGR frame as a base64 JPEG, or None if encoding fails."""
    if frame is None:
        return None
    try:
        import cv2

        ok, buffer = cv2.imencode(".jpg", frame)
        if not ok:
            return None
        return base64.b64encode(buffer).decode("utf-8")
    except Exception:
        return None


def analyze_video(video_path: str) -> dict[str, Any]:
    """
    Detect people, vehicles, and weapon-like objects in a video.

    Frames are sampled at `settings.sample_fps` and each noun class is reported as the
    maximum count seen in any single frame. Max-per-frame rather than a sum avoids
    counting the same person once per frame, but it does undercount anyone who is never
    on screen at the same time as the others.

    Returns a dict with `people`, `cars`, `weapon_present`, `frames_sampled`, and a
    short list of annotated `frames` for display.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    import cv2

    capture = cv2.VideoCapture(video_path)
    if not capture.isOpened():
        raise ValueError(f"Could not open video file: {video_path}")

    try:
        fps = capture.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            raise ValueError("Invalid video: unable to determine frame rate")

        frame_interval = max(1, int(fps / settings.sample_fps))
        model = _get_model()

        max_people = 0
        max_cars = 0
        weapon_present = False
        annotated: list[Any] = []
        frame_index = 0

        while True:
            ok, frame = capture.read()
            if not ok:
                break

            if frame_index % frame_interval == 0:
                detections = model(frame, verbose=False)[0]
                people = cars = 0
                frame_has_weapon = False

                for box in detections.boxes or []:
                    if float(box.conf[0]) < settings.confidence_threshold:
                        continue
                    class_id = int(box.cls[0])
                    if class_id in PERSON_CLASS_IDS:
                        people += 1
                    elif class_id in VEHICLE_CLASS_IDS:
                        cars += 1
                    elif class_id in WEAPON_CLASS_IDS:
                        frame_has_weapon = True

                max_people = max(max_people, people)
                max_cars = max(max_cars, cars)
                weapon_present = weapon_present or frame_has_weapon
                annotated.append(detections.plot())

            frame_index += 1
    finally:
        capture.release()

    return {
        "people": max_people,
        "cars": max_cars,
        "weapon_present": weapon_present,
        "frames_sampled": len(annotated),
        "frames": _pick_representative_frames(annotated, settings.max_returned_frames),
    }
