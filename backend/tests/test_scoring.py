from __future__ import annotations

import pytest

from models import Normalization, Option
from utils.scoring import PathwayTally, display_score, rank_pathways, tally_answers

NAMES = ["A", "B", "C"]


def option(**weights: int) -> Option:
    return Option(id="X", text="x", weights=weights)


def test_tally_adds_weights_and_counts_primary_matches() -> None:
    tallies = tally_answers([option(A=3, B=1), option(A=3, C=2), option(B=3)], NAMES)

    assert tallies == [
        PathwayTally("A", raw_score=6, primary_matches=2),
        PathwayTally("B", raw_score=4, primary_matches=1),
        PathwayTally("C", raw_score=2, primary_matches=0),
    ]


def test_rank_orders_by_raw_score() -> None:
    ranked = rank_pathways(
        [PathwayTally("A", 2, 0), PathwayTally("B", 9, 1), PathwayTally("C", 5, 3)]
    )

    assert [t.pathway for t in ranked] == ["B", "C", "A"]


def test_tie_goes_to_more_primary_matches() -> None:
    ranked = rank_pathways(
        [PathwayTally("A", 6, 1), PathwayTally("B", 6, 2), PathwayTally("C", 6, 0)]
    )

    assert [t.pathway for t in ranked] == ["B", "A", "C"]


def test_full_tie_keeps_predefined_order() -> None:
    ranked = rank_pathways(
        [PathwayTally("A", 6, 2), PathwayTally("B", 6, 2), PathwayTally("C", 6, 2)]
    )

    assert [t.pathway for t in ranked] == ["A", "B", "C"]


@pytest.mark.parametrize(
    ("raw", "expected"),
    [(15, 100), (5, 33), (2, 13), (1, 7), (0, 0)],
)
def test_relative_score_is_a_share_of_the_best(raw: int, expected: int) -> None:
    score = display_score(raw, mode=Normalization.RELATIVE, highest_raw=15, max_possible=99)

    assert score == expected


def test_max_possible_score_ignores_the_applicants_best() -> None:
    score = display_score(9, mode=Normalization.MAX_POSSIBLE, highest_raw=9, max_possible=18)

    assert score == 50


def test_scores_round_half_up() -> None:
    # 1/8 is exactly 12.5, which banker's rounding would turn into 12.
    score = display_score(1, mode=Normalization.RELATIVE, highest_raw=8, max_possible=0)

    assert score == 13


def test_score_is_zero_when_there_is_nothing_to_divide_by() -> None:
    score = display_score(0, mode=Normalization.RELATIVE, highest_raw=0, max_possible=0)

    assert score == 0
