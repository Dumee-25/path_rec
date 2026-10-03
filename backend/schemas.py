"""Request and response bodies for the HTTP API."""

from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

from models import Degree

if TYPE_CHECKING:
    from models import Question, Recommendation


class AnswerIn(BaseModel):
    question_id: int
    option_id: str


class RecommendRequest(BaseModel):
    answers: list[AnswerIn] = Field(min_length=1, max_length=50)


class OptionOut(BaseModel):
    id: str
    text: str


class QuestionOut(BaseModel):
    """A question as shown to the applicant. Pathway weights are deliberately left out."""

    id: int
    text: str
    options: list[OptionOut]


class RecommendationOut(BaseModel):
    rank: int
    pathway: str
    pathway_id: str
    career: str
    summary: str
    raw_score: int
    display_score: int
    label: str
    reasons: list[str]
    degrees: list[Degree]


class RecommendResponse(BaseModel):
    recommendations: list[RecommendationOut]


class CareerImageStatus(BaseModel):
    configured: bool
    provider: str


class CareerImageResponse(BaseModel):
    image_url: str


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    detail: ErrorDetail


def question_out(question: Question) -> QuestionOut:
    return QuestionOut(
        id=question.id,
        text=question.text,
        options=[OptionOut(id=option.id, text=option.text) for option in question.options],
    )


def recommendation_out(recommendation: Recommendation) -> RecommendationOut:
    pathway = recommendation.pathway
    return RecommendationOut(
        rank=recommendation.rank,
        pathway=pathway.name,
        pathway_id=pathway.id,
        career=pathway.career,
        summary=pathway.description,
        raw_score=recommendation.raw_score,
        display_score=recommendation.display_score,
        label=recommendation.label,
        reasons=recommendation.reasons,
        degrees=recommendation.degrees,
    )
