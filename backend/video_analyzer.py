"""
Video Analyzer Module

Analyzes video files using YOLOv8 to detect people, cars, and weapons.
Returns statistics about detected objects and annotated frames.
"""

from typing import Dict, Any
import cv2
from ultralytics import YOLO
import os


def analyze_video(video_path: str, frame_rate: int = 1) -> Dict[str, Any]:
    """
    Analyze a video file to detect people, cars, and weapons.

    Args:
        video_path: Path to the video file
        frame_rate: Number of frames per second to sample (default: 1 fps)

    Returns:
        Dictionary containing:
        - people: Maximum number of people detected across all frames
        - cars: Maximum number of cars/vehicles detected across all frames
        - weapon_present: True if any weapon-like object found in any frame
        - frames: List of annotated frames (numpy arrays) with detections drawn
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    # Initialize YOLOv8 model with pretrained weights
    # This will download weights automatically on first run
    model = YOLO("yolov8n.pt")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video file: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        raise ValueError("Invalid video: unable to determine FPS")

    frame_interval = max(1, int(fps / frame_rate))

    max_people = 0
    max_cars = 0
    weapon_present = False

    annotated_frames = []
    frame_count = 0
    frames_to_save = []

    # YOLO COCO class IDs
    person_class_ids = [0]
    vehicle_class_ids = [2, 3, 5, 7]  # car, motorcycle, bus, truck
    weapon_class_ids = [76]  # knife

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % frame_interval == 0:
            results = model(frame, verbose=False)
            detections = results[0]

            people_count = 0
            cars_count = 0
            has_weapon = False

            if detections.boxes is not None:
                for box in detections.boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])

                    if conf < 0.5:
                        continue

                    if cls_id in person_class_ids:
                        people_count += 1
                    elif cls_id in vehicle_class_ids:
                        cars_count += 1
                    elif cls_id in weapon_class_ids:
                        has_weapon = True

            max_people = max(max_people, people_count)
            max_cars = max(max_cars, cars_count)
            if has_weapon:
                weapon_present = True

            annotated_frame = detections.plot()
            frames_to_save.append(annotated_frame)

        frame_count += 1

    cap.release()

    if frames_to_save:
        if len(frames_to_save) <= 3:
            annotated_frames = frames_to_save
        else:
            annotated_frames = [
                frames_to_save[0],
                frames_to_save[len(frames_to_save) // 2],
                frames_to_save[-1],
            ]

    return {
        "people": max_people,
        "cars": max_cars,
        "weapon_present": weapon_present,
        "frames": annotated_frames,
    }

