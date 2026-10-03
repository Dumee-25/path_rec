from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from fastapi.testclient import TestClient

from config import DATA_DIR, Settings
from main import create_app
from models import Answer
from services.catalog import Catalog, load_catalog
from services.recommendation_service import RecommendationService

if TYPE_CHECKING:
    from collections.abc import Callable
    from pathlib import Path

JPEG_BYTES = b"\xff\xd8\xff\xe0" + b"\x00" * 64
PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


@pytest.fixture(scope="session")
def catalog() -> Catalog:
    return load_catalog(DATA_DIR)


@pytest.fixture
def service(catalog: Catalog) -> RecommendationService:
    return RecommendationService(catalog)


@pytest.fixture
def make_client(tmp_path: Path) -> Callable[..., TestClient]:
    """Build an app with isolated settings (never reads backend/.env)."""

    def factory(**overrides: object) -> TestClient:
        settings = Settings(_env_file=None, frontend_dist=tmp_path / "no-dist", **overrides)  # type: ignore[arg-type]
        return TestClient(create_app(settings))

    return factory


@pytest.fixture
def client(make_client: Callable[..., TestClient]) -> TestClient:
    return make_client()


def answers(letters: str) -> list[Answer]:
    """Answers for questions 1..n from a string of option letters, e.g. ``"CDCDD"``."""
    return [Answer(question_id, letter) for question_id, letter in enumerate(letters, start=1)]


def answers_json(letters: str) -> dict[str, list[dict[str, object]]]:
    return {
        "answers": [
            {"question_id": a.question_id, "option_id": a.option_id} for a in answers(letters)
        ]
    }
