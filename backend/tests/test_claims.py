"""Tests for report parsing."""

import pytest

from app.claims import extract_claims


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("Three people were standing on the corner.", 3),
        ("3 people were standing on the corner.", 3),
        ("Ten pedestrians crossed the street.", 10),
        ("A single individual approached the vehicle.", 1),
        ("One person entered the area.", 1),
        ("A man walked past the camera.", 1),
        ("Two men and a woman were present.", 2),
        ("Nothing of note occurred.", None),
    ],
)
def test_people_counts(text, expected):
    assert extract_claims(text)["people"] == expected


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("Two cars collided at the intersection.", 2),
        ("2 vehicles were involved.", 2),
        ("A red sedan was parked nearby.", None),
        ("A sedan was parked nearby.", 1),
        ("One truck blocked the lane.", 1),
        ("Four suvs were queued at the light.", 4),
        ("The intersection was empty.", None),
    ],
)
def test_vehicle_counts(text, expected):
    assert extract_claims(text)["cars"] == expected


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("No weapons were present.", False),
        ("There was no gun.", False),
        ("The suspect approached without a knife.", False),
        ("A weapon was not visible.", False),
        ("The weapon was not seen at any point.", False),
        ("A knife was visible in the footage.", True),
        ("The gun was shown clearly.", True),
        ("A firearm was recovered.", True),
        ("The driver exited the car.", None),
    ],
)
def test_weapon_presence(text, expected):
    assert extract_claims(text)["weapon_present"] == expected


def test_negation_beats_the_noun_phrase_it_contains():
    """'the weapon was not visible' asserts absence despite containing 'the weapon'."""
    assert extract_claims("The weapon was not visible.")["weapon_present"] is False


def test_explicit_count_beats_singular_article():
    """A trailing 'and a woman' must not override an explicit leading count."""
    assert extract_claims("Two men and a woman were present.")["people"] == 2


def test_parsing_is_case_insensitive():
    assert extract_claims("THREE PEOPLE AND TWO CARS.") == {
        "people": 3,
        "cars": 2,
        "weapon_present": None,
    }


def test_all_claim_types_together():
    text = "There were three people near two cars. No weapons were present."
    assert extract_claims(text) == {
        "people": 3,
        "cars": 2,
        "weapon_present": False,
    }


def test_empty_text_yields_no_claims():
    assert extract_claims("") == {
        "people": None,
        "cars": None,
        "weapon_present": None,
    }
