"""FastAPI application: the JSON API, plus the built frontend when one exists.

Run from ``backend/`` with::

    uv run uvicorn main:create_app --factory --reload
"""

from __future__ import annotations

import base64
import logging
from typing import TYPE_CHECKING, Annotated, NoReturn

from fastapi import APIRouter, FastAPI, File, Form, HTTPException, Response, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from config import DATA_DIR, Settings, get_settings
from models import Answer, Degree, Pathway
from schemas import (
    CareerImageResponse,
    CareerImageStatus,
    ErrorResponse,
    QuestionOut,
    RecommendRequest,
    RecommendResponse,
    question_out,
    recommendation_out,
)
from services.career_image_errors import CareerImageError
from services.catalog import load_catalog
from services.image_generation_service import CareerImageService
from services.providers import build_provider
from services.recommendation_service import InvalidAnswersError, RecommendationService

if TYPE_CHECKING:
    from pathlib import Path

logger = logging.getLogger(__name__)

API_TITLE = "NSBM Pathway Recommender"


def _error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail={"code": code, "message": message})


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    catalog = load_catalog(DATA_DIR)
    recommender = RecommendationService(catalog)
    images = CareerImageService(
        build_provider(settings), catalog, max_photo_bytes=settings.max_photo_bytes
    )

    app = FastAPI(title=API_TITLE, version="0.1.0")
    api = APIRouter(prefix="/api")

    @api.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @api.get("/pathways")
    def list_pathways() -> list[Pathway]:
        return list(catalog.pathways)

    @api.get("/degrees")
    def list_degrees() -> dict[str, list[Degree]]:
        return {"degrees": list(catalog.degrees)}

    @api.get("/questions")
    def list_questions() -> list[QuestionOut]:
        return [question_out(question) for question in catalog.questions]

    @api.post("/recommend", responses={422: {"model": ErrorResponse}})
    def recommend(body: RecommendRequest) -> RecommendResponse:
        answers = [Answer(item.question_id, item.option_id) for item in body.answers]
        try:
            recommendations = recommender.recommend(answers)
        except InvalidAnswersError as exc:
            raise _error(422, "invalid_answers", str(exc)) from exc
        return RecommendResponse(
            recommendations=[recommendation_out(item) for item in recommendations]
        )

    @api.get("/career-image/status")
    def career_image_status() -> CareerImageStatus:
        return CareerImageStatus(configured=images.configured, provider=images.provider_name)

    @api.post(
        "/career-image",
        responses={code: {"model": ErrorResponse} for code in (413, 415, 422, 502, 503)},
    )
    def create_career_image(
        photo: Annotated[UploadFile, File()],
        pathway: Annotated[str, Form()],
        response: Response,
    ) -> CareerImageResponse:
        # Read one byte past the limit so an oversized upload is detected without loading it all.
        data = photo.file.read(images.max_photo_bytes + 1)
        try:
            result = images.generate(photo=data, pathway=pathway)
        except CareerImageError as exc:
            raise _error(exc.http_status, exc.code, str(exc)) from exc
        response.headers["Cache-Control"] = "no-store"
        encoded = base64.b64encode(result.data).decode("ascii")
        return CareerImageResponse(image_url=f"data:{result.mime_type};base64,{encoded}")

    @api.api_route(
        "/{path:path}", methods=["GET", "POST"], include_in_schema=False, response_model=None
    )
    def unknown_api_route(path: str) -> NoReturn:  # noqa: ARG001
        raise _error(404, "not_found", "There is no such API endpoint.")

    app.include_router(api)
    _serve_frontend(app, settings.frontend_dist)
    return app


def _serve_frontend(app: FastAPI, dist: Path) -> None:
    """Serve the built single-page app, falling back to index.html for client-side routes."""
    index = dist / "index.html"
    if not index.is_file():
        logger.info("No frontend build at %s; serving the API only.", dist)
        return

    root = dist.resolve()
    app.mount("/assets", StaticFiles(directory=root / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str) -> FileResponse:
        candidate = (root / path).resolve()
        if candidate.is_file() and candidate.is_relative_to(root):
            return FileResponse(candidate)
        return FileResponse(index)
