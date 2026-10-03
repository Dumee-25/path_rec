"""Load the JSON catalogue from ``data/`` and check that its files agree with each other.

Pathway weights, degrees, explanations and prompts are all configuration. Each file is
validated on its own by the models, and the cross-file rules (every weight points at a
real pathway, every pathway has a degree, and so on) are checked here, so a bad edit stops
the server at startup instead of surfacing as a wrong recommendation.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from pydantic import ValidationError

from models import Degree, Pathway, Question, Reason, ScoringConfig, StrictModel

if TYPE_CHECKING:
    from collections.abc import Mapping
    from pathlib import Path


class CatalogError(ValueError):
    """The catalogue files are malformed or inconsistent."""


class _PathwaysFile(StrictModel):
    pathways: list[Pathway]


class _DegreesFile(StrictModel):
    degrees: list[Degree]


class _QuestionsFile(StrictModel):
    questions: list[Question]


class _ExplanationsFile(StrictModel):
    reasons: dict[str, list[Reason]]


class _CareerPromptsFile(StrictModel):
    base: list[str]
    constraints: str
    pathways: dict[str, str]


@dataclass(frozen=True)
class CareerPrompts:
    base: tuple[str, ...]
    constraints: str
    by_pathway: Mapping[str, str]


@dataclass(frozen=True)
class Catalog:
    """Everything the recommender knows. Pathways are in tie-break order (spec section 8)."""

    pathways: tuple[Pathway, ...]
    degrees: tuple[Degree, ...]
    questions: tuple[Question, ...]
    reasons: Mapping[str, tuple[Reason, ...]]
    scoring: ScoringConfig
    career_prompts: CareerPrompts

    @property
    def pathway_names(self) -> tuple[str, ...]:
        return tuple(pathway.name for pathway in self.pathways)

    def pathway(self, name: str) -> Pathway:
        for pathway in self.pathways:
            if pathway.name == name:
                return pathway
        raise KeyError(name)

    def degrees_for(self, pathway_name: str) -> list[Degree]:
        return [degree for degree in self.degrees if degree.pathway == pathway_name]

    def max_possible_score(self, pathway_name: str) -> int:
        """The most this pathway could score: its best option in every question."""
        return sum(
            max((option.weights.get(pathway_name, 0) for option in question.options), default=0)
            for question in self.questions
        )


def _load[ModelT: StrictModel](path: Path, model: type[ModelT]) -> ModelT:
    try:
        raw: Any = json.loads(path.read_text(encoding="utf-8"))
        return model.model_validate(raw)
    except OSError as exc:
        raise CatalogError(f"Cannot read {path.name}: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise CatalogError(f"{path.name} is not valid JSON: {exc}") from exc
    except ValidationError as exc:
        raise CatalogError(f"{path.name} is invalid:\n{exc}") from exc


def _find_duplicates(values: list[str]) -> list[str]:
    return sorted({value for value in values if values.count(value) > 1})


def _check(catalog: Catalog) -> None:
    problems: list[str] = []
    names = list(catalog.pathway_names)
    known = set(names)

    if dupes := _find_duplicates(names + [p.id for p in catalog.pathways]):
        problems.append(f"Duplicate pathway names or ids: {dupes}")

    question_ids = [question.id for question in catalog.questions]
    if len(set(question_ids)) != len(question_ids):
        problems.append(f"Duplicate question ids: {question_ids}")
    for question in catalog.questions:
        if dupes := _find_duplicates([option.id for option in question.options]):
            problems.append(f"Question {question.id} has duplicate option ids: {dupes}")
        for option in question.options:
            if unknown := set(option.weights) - known:
                problems.append(f"Question {question.id} option {option.id}: unknown {unknown}")

    if dupes := _find_duplicates([degree.id for degree in catalog.degrees]):
        problems.append(f"Duplicate degree ids: {dupes}")
    for degree in catalog.degrees:
        if degree.pathway not in known:
            problems.append(f"Degree {degree.id} points at unknown pathway {degree.pathway!r}")
    problems.extend(
        f"Pathway {name!r} has no degree programmes"
        for name in names
        if not catalog.degrees_for(name)
    )

    if set(catalog.reasons) != known:
        problems.append(f"explanations.json must cover exactly the pathways: {sorted(known)}")
    for name, reasons in catalog.reasons.items():
        for reason in reasons:
            if unknown_questions := set(reason.questions) - set(question_ids):
                problems.append(f"Reason for {name!r} uses unknown questions {unknown_questions}")

    if set(catalog.career_prompts.by_pathway) != known:
        problems.append(f"career_prompts.json must cover exactly the pathways: {sorted(known)}")

    if len(catalog.scoring.labels) < catalog.scoring.top_n:
        problems.append("scoring.json needs at least one label per recommended pathway (top_n)")

    if problems:
        raise CatalogError("Inconsistent catalogue:\n- " + "\n- ".join(problems))


def load_catalog(data_dir: Path) -> Catalog:
    """Read and validate every file in ``data_dir``."""
    prompts = _load(data_dir / "career_prompts.json", _CareerPromptsFile)
    catalog = Catalog(
        pathways=tuple(_load(data_dir / "pathways.json", _PathwaysFile).pathways),
        degrees=tuple(_load(data_dir / "degrees.json", _DegreesFile).degrees),
        questions=tuple(_load(data_dir / "questions.json", _QuestionsFile).questions),
        reasons={
            name: tuple(reasons)
            for name, reasons in _load(
                data_dir / "explanations.json", _ExplanationsFile
            ).reasons.items()
        },
        scoring=_load(data_dir / "scoring.json", ScoringConfig),
        career_prompts=CareerPrompts(
            base=tuple(prompts.base),
            constraints=prompts.constraints,
            by_pathway=prompts.pathways,
        ),
    )
    _check(catalog)
    return catalog
