"""
Consistency scoring for people/vehicles/weapons.

Takes structured claims from text and detections from video_analyzer
and produces a 0–100 consistency score plus per-claim breakdown.
"""

from typing import Dict, Any, List


def _score_count_claim(
    claim_count: int | None, detected_count: int
) -> tuple[int, str, str]:
    """
    Return (penalty, result_label, note) for a count-based claim.
    Penalty is the number of points to subtract from the global score.
    """
    if claim_count is None:
        return 0, "not_applicable", "No explicit claim provided."

    diff = abs(claim_count - detected_count)

    if diff == 0:
        return 0, "supported", "Exact match."
    if diff == 1:
        return 10, "partial", f"Close match: claimed {claim_count}, detected {detected_count} (difference: 1)."
    return 30, "contradicted", (
        f"Counts differ significantly: claimed {claim_count}, detected {detected_count} "
        f"(difference: {diff})."
    )


def _score_weapon_claim(
    claim_weapon: bool | None, detected_weapon: bool
) -> tuple[int, str, str]:
    """
    Return (penalty, result_label, note) for weapon presence claims.
    """
    if claim_weapon is None:
        return 0, "not_applicable", "No explicit weapon claim provided."

    if claim_weapon == detected_weapon:
        return 0, "supported", "Weapon presence/absence matches."

    return 40, "contradicted", (
        f"Weapon claim does not match video (claimed {'weapon present' if claim_weapon else 'no weapon'}, "
        f"detected {'weapon present' if detected_weapon else 'no weapon'})."
    )


def score_consistency(claims: Dict[str, Any], video_stats: Dict[str, Any]) -> Dict[str, Any]:
    """
    Score consistency between:
      - claims: {'people': int|None, 'cars': int|None, 'weapon_present': bool|None}
      - video_stats: {'people': int, 'cars': int, 'weapon_present': bool, ...}

    Returns:
      {
        'score': int (0–100),
        'details': [ { claim_type, claim_value, video_value, result, note, claim_score } ],
        'status': 'COMPLETE'
      }
    """
    details: List[Dict[str, Any]] = []
    score = 100

    claimed_people = claims.get("people")
    claimed_cars = claims.get("cars")
    claimed_weapon = claims.get("weapon_present")

    detected_people = int(video_stats.get("people", 0) or 0)
    detected_cars = int(video_stats.get("cars", 0) or 0)
    detected_weapon = bool(video_stats.get("weapon_present", False))

    # People
    penalty, result_label, note = _score_count_claim(claimed_people, detected_people)
    score -= penalty
    people_claim_score = max(0, 100 - penalty)
    details.append(
        {
            "claim_type": "people",
            "claim_value": claimed_people,
            "video_value": detected_people,
            "result": result_label,
            "note": note,
            "claim_score": people_claim_score,
        }
    )

    # Cars / vehicles
    penalty, result_label, note = _score_count_claim(claimed_cars, detected_cars)
    score -= penalty
    cars_claim_score = max(0, 100 - penalty)
    details.append(
        {
            "claim_type": "cars",
            "claim_value": claimed_cars,
            "video_value": detected_cars,
            "result": result_label,
            "note": note,
            "claim_score": cars_claim_score,
        }
    )

    # Weapons
    penalty, result_label, note = _score_weapon_claim(claimed_weapon, detected_weapon)
    score -= penalty
    weapons_claim_score = max(0, 100 - penalty)
    details.append(
        {
            "claim_type": "weapons",
            "claim_value": claimed_weapon,
            "video_value": detected_weapon,
            "result": result_label,
            "note": note,
            "claim_score": weapons_claim_score,
        }
    )

    score = max(0, min(100, score))

    return {
        "score": score,
        "status": "COMPLETE",
        "details": details,
    }

