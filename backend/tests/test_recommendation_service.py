from __future__ import annotations

from itertools import pairwise, product
from typing import TYPE_CHECKING

import pytest

from models import Answer, Recommendation
from services.recommendation_service import InvalidAnswersError, RecommendationService
from tests.conftest import answers

if TYPE_CHECKING:
    from services.catalog import Catalog


def test_spec_example_scores(service: RecommendationService) -> None:
    # Answers C, D, C, D, D from spec section 20. Working the weights through gives
    # AI 15, Data Science 5, Computer Science 2. The spec's printed 6 and 4 are wrong.
    result = service.recommend(answers("CDCDD"))

    assert [(r.pathway.name, r.raw_score, r.display_score, r.label) for r in result] == [
        ("Artificial Intelligence", 15, 100, "Strongest Match"),
        ("Data Science", 5, 33, "Strong Match"),
        ("Computer Science", 2, 13, "Related Match"),
    ]
    assert [r.rank for r in result] == [1, 2, 3]


def test_degrees_are_attached_to_every_recommendation(service: RecommendationService) -> None:
    result = service.recommend(answers("CDCDD"))

    assert [d.university for d in result[0].degrees] == ["Plymouth University"]
    assert len(result[1].degrees) == 2  # Data Science: NSBM and Plymouth


def test_primary_match_gets_up_to_three_reasons_secondary_one(
    service: RecommendationService,
) -> None:
    result = service.recommend(answers("CDCDD"))

    assert len(result[0].reasons) == 3
    assert result[0].reasons[0] == "You showed interest in intelligent and automated systems."
    assert len(result[1].reasons) == 1


def test_weak_match_falls_back_to_a_generic_line_instead_of_overclaiming(
    service: RecommendationService, catalog: Catalog
) -> None:
    # Networking answers give Cyber Security only +1 each, so it must not claim an interest.
    result = service.recommend(answers("EFFGG"))

    cyber = next(r for r in result if r.pathway.name == "Cyber Security")
    assert cyber.reasons == [catalog.scoring.fallback_reason]
    assert result[0].pathway.name == "Computer Networks"


def test_pathways_with_no_score_are_not_returned(service: RecommendationService) -> None:
    # Software options throughout only ever score Software Engineering and Computer Science.
    result = service.recommend(answers("ABABB"))

    assert [r.pathway.name for r in result] == ["Software Engineering", "Computer Science"]
    assert all(r.raw_score > 0 for r in result)


@pytest.mark.parametrize(
    ("bad", "message"),
    [
        ([Answer(9, "A")], "Unknown question 9"),
        ([Answer(1, "Z")], "not an option for question 1"),
        ([*answers("CDCDD"), Answer(1, "A")], "more than once"),
        (answers("CDC"), "Missing: 4, 5"),
        ([], "Missing: 1, 2, 3, 4, 5"),
    ],
)
def test_invalid_answers_are_rejected(
    service: RecommendationService, bad: list[Answer], message: str
) -> None:
    with pytest.raises(InvalidAnswersError, match=message):
        service.recommend(bad)


def test_answer_order_does_not_matter(service: RecommendationService) -> None:
    forward = service.recommend(answers("CDCDD"))
    backward = service.recommend(list(reversed(answers("CDCDD"))))

    assert forward == backward


def primary_matches(catalog: Catalog, combo: tuple[str, ...], pathway: str) -> int:
    """How many chosen options gave ``pathway`` its +3, counted straight from the data."""
    return sum(
        option.weights.get(pathway, 0) == 3
        for question, letter in zip(catalog.questions, combo, strict=True)
        for option in question.options
        if option.id == letter
    )


def test_every_possible_set_of_answers_gives_a_valid_ranking(
    service: RecommendationService, catalog: Catalog
) -> None:
    """Check the ranking invariants for all 6 x 7 x 8 x 9 x 9 = 27,216 answer combinations."""
    order = {name: index for index, name in enumerate(catalog.pathway_names)}
    letters = [[o.id for o in question.options] for question in catalog.questions]

    for combo in product(*letters):
        result = service.recommend(answers("".join(combo)))

        assert 1 <= len(result) <= 3, combo
        assert result[0].display_score == 100, combo
        assert [r.rank for r in result] == list(range(1, len(result) + 1)), combo
        for earlier, later in pairwise(result):
            assert earlier.raw_score >= later.raw_score, combo
            assert earlier.display_score >= later.display_score, combo
            if earlier.raw_score == later.raw_score:
                # Spec section 8: more +3 matches first, then the predefined order.
                def tie_key(r: Recommendation, combo: tuple[str, ...] = combo) -> tuple[int, int]:
                    name = r.pathway.name
                    return (-primary_matches(catalog, combo, name), order[name])

                assert tie_key(earlier) < tie_key(later), combo
        assert all(r.raw_score > 0 and 0 < r.display_score <= 100 for r in result), combo
        assert all(r.reasons and r.degrees for r in result), combo


def test_recommend_does_not_mutate_the_catalog(catalog: Catalog) -> None:
    service = RecommendationService(catalog)
    before = catalog.questions

    service.recommend(answers("CDCDD"))

    assert catalog.questions is before
