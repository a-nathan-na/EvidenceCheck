"""
Score a report against what the detector saw.

Every claim starts at 100 and loses points for disagreement. The penalties are
deliberately blunt — an off-by-one on a count is treated as a near miss, a larger gap
as a contradiction, and a weapon mismatch as the most serious disagreement of the
three. Claims the report never made are skipped rather than counted as agreement.
"""

from __future__ import annotations

from typing import Any

PENALTY_COUNT_OFF_BY_ONE = 10
PENALTY_COUNT_MISMATCH = 30
PENALTY_WEAPON_MISMATCH = 40


def _score_count_claim(claimed: int | None, detected: int) -> tuple[int, str, str]:
    """Return (penalty, result, note) for a count claim."""
    if claimed is None:
        return 0, "not_applicable", "The report did not state a count."

    difference = abs(claimed - detected)

    if difference == 0:
        return 0, "supported", f"Exact match: {detected}."

    if difference == 1:
        return (
            PENALTY_COUNT_OFF_BY_ONE,
            "partial",
            f"Close: report says {claimed}, video shows {detected}.",
        )

    return (
        PENALTY_COUNT_MISMATCH,
        "contradicted",
        f"Report says {claimed}, video shows {detected} (off by {difference}).",
    )


def _score_weapon_claim(claimed: bool | None, detected: bool) -> tuple[int, str, str]:
    """Return (penalty, result, note) for the weapon-presence claim."""
    if claimed is None:
        return 0, "not_applicable", "The report did not mention a weapon."

    if claimed == detected:
        state = "a weapon" if detected else "no weapon"
        return 0, "supported", f"Both report and video indicate {state}."

    return (
        PENALTY_WEAPON_MISMATCH,
        "contradicted",
        "Report says {}, video shows {}.".format(
            "a weapon was present" if claimed else "no weapon",
            "a weapon" if detected else "no weapon",
        ),
    )


def score_consistency(
    claims: dict[str, Any], video_stats: dict[str, Any]
) -> dict[str, Any]:
    """
    Compare parsed claims against detector output.

    Returns `{"score": int, "details": [...]}` where score is 0–100 and details holds
    one entry per claim type with its own sub-score and a human-readable note.
    """
    detected_people = int(video_stats.get("people", 0) or 0)
    detected_cars = int(video_stats.get("cars", 0) or 0)
    detected_weapon = bool(video_stats.get("weapon_present", False))

    details: list[dict[str, Any]] = []
    score = 100

    for claim_type, claimed, detected, scorer in (
        ("people", claims.get("people"), detected_people, _score_count_claim),
        ("cars", claims.get("cars"), detected_cars, _score_count_claim),
        (
            "weapons",
            claims.get("weapon_present"),
            detected_weapon,
            _score_weapon_claim,
        ),
    ):
        penalty, result, note = scorer(claimed, detected)
        score -= penalty
        details.append(
            {
                "claim_type": claim_type,
                "claim_value": claimed,
                "video_value": detected,
                "result": result,
                "note": note,
                "claim_score": max(0, 100 - penalty),
            }
        )

    return {"score": max(0, min(100, score)), "details": details}
