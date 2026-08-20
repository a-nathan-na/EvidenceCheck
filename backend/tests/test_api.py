"""
Endpoint tests.

`analyze_video` is replaced with a stub so these run without downloading model
weights or decoding real video — the detector itself is not what is under test here.
"""

import io

import pytest
from fastapi.testclient import TestClient

from app import main
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def stub_detector(monkeypatch):
    """Make analyze_video return fixed counts and no frames."""

    def _stub(people=2, cars=1, weapon_present=False):
        def fake_analyze_video(path):
            return {
                "people": people,
                "cars": cars,
                "weapon_present": weapon_present,
                "frames_sampled": 4,
                "frames": [],
            }

        monkeypatch.setattr(main, "analyze_video", fake_analyze_video)

    return _stub


def video_upload(name="clip.mp4"):
    return {"video": (name, io.BytesIO(b"not really a video"), "video/mp4")}


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_claims_endpoint_parses_text(client):
    response = client.post(
        "/claims", data={"text_description": "Two people and one car. No weapons."}
    )
    assert response.status_code == 200
    assert response.json() == {
        "people": 2,
        "cars": 1,
        "weapon_present": False,
    }


def test_claims_endpoint_rejects_blank_text(client):
    response = client.post("/claims", data={"text_description": "   "})
    assert response.status_code == 400


def test_analyze_rejects_unsupported_video_extension(client):
    response = client.post(
        "/analyze",
        files={"video": ("clip.gif", io.BytesIO(b"x"), "image/gif")},
        data={"text_description": "Two people."},
    )
    assert response.status_code == 400
    assert "Allowed extensions" in response.json()["detail"]


def test_analyze_requires_some_report_text(client):
    response = client.post("/analyze", files=video_upload(), data={})
    assert response.status_code == 400


def test_analyze_scores_a_matching_report(client, stub_detector):
    stub_detector(people=2, cars=1, weapon_present=False)
    response = client.post(
        "/analyze",
        files=video_upload(),
        data={"text_description": "Two people and one car. No weapons were present."},
    )
    assert response.status_code == 200

    body = response.json()
    assert body["consistency_score"] == 100
    assert body["video_analysis"]["people"] == 2
    assert body["video_analysis"]["frames_sampled"] == 4
    assert body["text_claims"]["people"] == 2
    assert all(d["result"] == "supported" for d in body["details"])


def test_analyze_reports_a_disagreement(client, stub_detector):
    stub_detector(people=2, cars=1, weapon_present=True)
    response = client.post(
        "/analyze",
        files=video_upload(),
        data={"text_description": "Five people and one car. No weapons were present."},
    )
    assert response.status_code == 200

    body = response.json()
    # 30 for the people gap, 40 for the weapon mismatch.
    assert body["consistency_score"] == 30
    results = {d["claim_type"]: d["result"] for d in body["details"]}
    assert results == {
        "people": "contradicted",
        "cars": "supported",
        "weapons": "contradicted",
    }


def test_text_file_takes_precedence_over_text_description(client, stub_detector):
    stub_detector(people=3, cars=0, weapon_present=False)
    response = client.post(
        "/analyze",
        files={
            **video_upload(),
            "text_file": ("report.txt", io.BytesIO(b"Three people."), "text/plain"),
        },
        data={"text_description": "One person."},
    )
    assert response.status_code == 200
    assert response.json()["text_claims"]["people"] == 3


def test_unreadable_video_returns_422(client, monkeypatch):
    def boom(path):
        raise ValueError("Could not open video file")

    monkeypatch.setattr(main, "analyze_video", boom)
    response = client.post(
        "/analyze", files=video_upload(), data={"text_description": "Two people."}
    )
    assert response.status_code == 422


def test_failed_analysis_never_returns_a_score(client, monkeypatch):
    """Regression guard: a broken pipeline must not produce a plausible-looking score."""

    def boom(path):
        raise ValueError("decoder exploded")

    monkeypatch.setattr(main, "analyze_video", boom)
    response = client.post(
        "/analyze", files=video_upload(), data={"text_description": "Two people."}
    )
    assert response.status_code >= 400
    assert "consistency_score" not in response.json()
