"""
Extract structured claims from the text of an incident report.

This module deliberately imports nothing beyond the standard library. Keeping the
parsing logic free of OpenCV and PyTorch means it can be unit tested — and reasoned
about — without a multi-gigabyte install.

The parser is intentionally shallow: it recognises counts of people and vehicles and
whether a weapon is asserted to be present or absent. See the limitations section of
the README for what that does and does not buy you.
"""

from __future__ import annotations

import re
from typing import TypedDict

NUMBER_WORDS: dict[str, int] = {
    "one": 1,
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

_NUMBER_WORD_ALTERNATION = "|".join(NUMBER_WORDS)

PEOPLE_PLURAL = r"(?:people|persons|individuals|men|women|pedestrians|bystanders)"
PEOPLE_SINGULAR = r"(?:person|individual|man|woman|pedestrian|bystander)"

VEHICLE_PLURAL = r"(?:cars|vehicles|autos|sedans|suvs|trucks|vans)"
VEHICLE_SINGULAR = r"(?:car|vehicle|auto|sedan|suv|truck|van)"

WEAPON = r"(?:guns?|knives|knife|weapons?|firearms?|pistols?|rifles?)"

# Checked before the affirmative patterns: "the weapon was not visible" asserts absence,
# even though it contains the phrase "the weapon".
_WEAPON_ABSENT_PATTERNS = (
    rf"\b(?:no|without)\s+(?:a\s+|any\s+)?{WEAPON}\b",
    rf"\b(?:the\s+|a\s+|an\s+)?{WEAPON}\s+(?:was|were|is|are)\s+not\s+"
    r"(?:visible|present|seen|observed|detected)\b",
)

_WEAPON_PRESENT_PATTERNS = (
    rf"\b{WEAPON}\s+(?:present|visible|seen|detected|shown|observed)\b",
    rf"\b(?:a|an|the)\s+{WEAPON}\b",
)


class Claims(TypedDict):
    """Claims asserted by the report. `None` means the report did not say."""

    people: int | None
    cars: int | None
    weapon_present: bool | None


def _extract_count(text: str, plural: str, singular: str) -> int | None:
    """
    Find an asserted count for one noun class.

    Digits and number words are matched before the singular-article form, so
    "two men and a woman" yields 2 rather than 1.
    """
    digits = re.search(rf"\b(\d+)\s+{plural}\b", text)
    if digits:
        return int(digits.group(1))

    words = re.search(rf"\b({_NUMBER_WORD_ALTERNATION})\s+{plural}\b", text)
    if words:
        return NUMBER_WORDS[words.group(1)]

    if re.search(rf"\b(?:one|single|a|an)\s+{singular}\b", text):
        return 1

    return None


def _extract_weapon_presence(text: str) -> bool | None:
    for pattern in _WEAPON_ABSENT_PATTERNS:
        if re.search(pattern, text):
            return False

    for pattern in _WEAPON_PRESENT_PATTERNS:
        if re.search(pattern, text):
            return True

    return None


def extract_claims(text: str) -> Claims:
    """Parse a report into the claims the scorer knows how to check."""
    lowered = text.lower()
    return Claims(
        people=_extract_count(lowered, PEOPLE_PLURAL, PEOPLE_SINGULAR),
        cars=_extract_count(lowered, VEHICLE_PLURAL, VEHICLE_SINGULAR),
        weapon_present=_extract_weapon_presence(lowered),
    )
