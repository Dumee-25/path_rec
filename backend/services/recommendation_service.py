"""Turn a set of questionnaire answers into ranked pathway recommendations."""

from __future__ import annotations

from typing import TYPE_CHECKING

from models import Recommendation
from utils.scoring import PathwayTally, display_score, rank_pathways, tally_answers

if TYPE_CHECKING:
    from collections.abc import Sequence

    from models import Answer, Option
    from services.catalog import Catalog


class InvalidAnswersError(ValueError):
    """The submitted answers do not match the questionnaire."""


class RecommendationService:
    def __init__(self, catalog: Catalog) -> None:
        self._catalog = catalog

    def recommend(self, answers: Sequence[Answer]) -> list[Recommendation]:
        """Rank the pathways for one applicant.

        Only pathways the applicant actually scored on are returned, so some answer
        patterns produce fewer than ``top_n`` results rather than a meaningless 0 score.

        Raises:
            InvalidAnswersError: if an answer is unknown, duplicated or missing.
        """
        config = self._catalog.scoring
        selected = self._resolve(answers)
        tallies = tally_answers(selected.values(), self._catalog.pathway_names)
        ranked = [t for t in rank_pathways(tallies) if t.raw_score >= config.min_raw_score]
        ranked = ranked[: config.top_n]
        if not ranked:
            return []

        highest_raw = ranked[0].raw_score
        return [
            self._build(rank, tally, highest_raw, selected)
            for rank, tally in enumerate(ranked, start=1)
        ]

    def _resolve(self, answers: Sequence[Answer]) -> dict[int, Option]:
        """Match each answer to its option, returned in questionnaire order."""
        questions = {question.id: question for question in self._catalog.questions}
        selected: dict[int, Option] = {}
        for answer in answers:
            question = questions.get(answer.question_id)
            if question is None:
                raise InvalidAnswersError(f"Unknown question {answer.question_id}.")
            if answer.question_id in selected:
                raise InvalidAnswersError(
                    f"Question {answer.question_id} was answered more than once."
                )
            option = next((o for o in question.options if o.id == answer.option_id), None)
            if option is None:
                raise InvalidAnswersError(
                    f"{answer.option_id!r} is not an option for question {answer.question_id}."
                )
            selected[answer.question_id] = option

        if missing := [str(qid) for qid in questions if qid not in selected]:
            raise InvalidAnswersError(
                f"Please answer every question. Missing: {', '.join(missing)}."
            )
        return {qid: selected[qid] for qid in questions}

    def _build(
        self, rank: int, tally: PathwayTally, highest_raw: int, selected: dict[int, Option]
    ) -> Recommendation:
        catalog = self._catalog
        labels = catalog.scoring.labels
        score = display_score(
            tally.raw_score,
            mode=catalog.scoring.normalization,
            highest_raw=highest_raw,
            max_possible=catalog.max_possible_score(tally.pathway),
        )
        return Recommendation(
            pathway=catalog.pathway(tally.pathway),
            rank=rank,
            raw_score=tally.raw_score,
            display_score=score,
            label=labels[min(rank, len(labels)) - 1],
            reasons=self._reasons(tally.pathway, rank, selected),
            degrees=catalog.degrees_for(tally.pathway),
        )

    def _reasons(self, pathway: str, rank: int, selected: dict[int, Option]) -> list[str]:
        """Pick the explanation lines backed by the answers that scored this pathway highest.

        A line is only used when at least one answer behind it weighted this pathway by
        ``min_reason_weight`` or more. Two weak +1 answers never add up to a claim of
        "strong interest". Qualifying lines are ordered by their total contribution.
        """
        config = self._catalog.scoring
        limit = config.max_reasons_primary if rank == 1 else config.max_reasons_secondary

        scored: list[tuple[int, int, str]] = []
        for position, reason in enumerate(self._catalog.reasons[pathway]):
            weights = [
                selected[qid].weights.get(pathway, 0) for qid in reason.questions if qid in selected
            ]
            if weights and max(weights) >= config.min_reason_weight:
                scored.append((-sum(weights), position, reason.text))

        lines = [text for _, _, text in sorted(scored)[:limit]]
        return lines or [config.fallback_reason]
