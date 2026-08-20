"""Tests for consistency scoring."""

import pytest

from app.scoring import score_consistency


def detections(people=0, cars=0, weapon_present=False):
    return {"people": people, "cars": cars, "weapon_present": weapon_present}


def claims(people=None, cars=None, weapon_present=None):
    return {"people": people, "cars": cars, "weapon_present": weapon_present}


def detail_for(result, claim_type):
    return next(d for d in result["details"] if d["claim_type"] == claim_type)


def test_perfect_agreement_scores_100():
    result = score_consistency(
        claims(people=2, cars=1, weapon_present=False),
        detections(people=2, cars=1, weapon_present=False),
    )
    assert result["score"] == 100
    assert all(d["result"] == "supported" for d in result["details"])


def test_unstated_claims_do_not_penalise():
    result = score_consistency(claims(), detections(people=5, cars=3))
    assert result["score"] == 100
    assert all(d["result"] == "not_applicable" for d in result["details"])


@pytest.mark.parametrize(
    ("claimed", "detected", "penalty", "expected_result"),
    [
        (2, 2, 0, "supported"),
        (3, 2, 10, "partial"),
        (1, 2, 10, "partial"),
        (5, 2, 30, "contradicted"),
        (0, 3, 30, "contradicted"),
    ],
)
def test_count_penalties(claimed, detected, penalty, expected_result):
    result = score_consistency(claims(people=claimed), detections(people=detected))
    assert result["score"] == 100 - penalty
    people = detail_for(result, "people")
    assert people["result"] == expected_result
    assert people["claim_score"] == 100 - penalty


def test_weapon_mismatch_is_the_heaviest_penalty():
    result = score_consistency(
        claims(weapon_present=False), detections(weapon_present=True)
    )
    assert result["score"] == 60
    assert detail_for(result, "weapons")["result"] == "contradicted"


def test_weapon_agreement_on_absence_is_supported():
    result = score_consistency(
        claims(weapon_present=False), detections(weapon_present=False)
    )
    assert detail_for(result, "weapons")["result"] == "supported"


def test_score_is_clamped_at_zero():
    """30 + 30 + 40 = 100 penalty; further disagreement must not go negative."""
    result = score_consistency(
        claims(people=10, cars=10, weapon_present=True),
        detections(people=0, cars=0, weapon_present=False),
    )
    assert result["score"] == 0


def test_details_cover_every_claim_type():
    result = score_consistency(claims(), detections())
    assert [d["claim_type"] for d in result["details"]] == [
        "people",
        "cars",
        "weapons",
    ]


def test_notes_reference_both_sides_of_a_disagreement():
    result = score_consistency(claims(people=5), detections(people=2))
    note = detail_for(result, "people")["note"]
    assert "5" in note and "2" in note
