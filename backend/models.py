"""Domain models for the pathway catalogue and the recommendation rules.

These models double as the schema of the JSON files in ``data/``. They forbid unknown
keys so that a typo in a configuration file fails loudly when the catalogue loads.
"""

from __future__ import annotations

from enum import StrEnum
from typing import NamedTuple

from pydantic import BaseModel, ConfigDict, Field, PositiveInt


class StrictModel(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")


class Pathway(StrictModel):
    id: str
    name: str
    career: str
    description: str


class Degree(StrictModel):
    id: str
    name: str
    university: str
    country: str | None = None
    pathway: str


class Option(StrictModel):
    id: str
    text: str
    weights: dict[str, PositiveInt]


class Question(StrictModel):
    id: int
    topic: str
    text: str
    options: list[Option] = Field(min_length=2)


class Reason(StrictModel):
    """A predefined explanation line, tied to the questions whose answers justify it."""

    questions: list[int] = Field(min_length=1)
    text: str


class Normalization(StrEnum):
    RELATIVE = "relative"  # raw score / the applicant's best raw score
    MAX_POSSIBLE = "max_possible"  # raw score / the best this pathway could score


class ScoringConfig(StrictModel):
    normalization: Normalization
    top_n: PositiveInt
    min_raw_score: PositiveInt
    min_reason_weight: PositiveInt
    max_reasons_primary: PositiveInt
    max_reasons_secondary: PositiveInt
    labels: list[str] = Field(min_length=1)
    fallback_reason: str


class Answer(NamedTuple):
    """One submitted answer: which option was chosen for which question."""

    question_id: int
    option_id: str


class Recommendation(StrictModel):
    pathway: Pathway
    rank: int
    raw_score: int
    display_score: int
    label: str
    reasons: list[str]
    degrees: list[Degree]
