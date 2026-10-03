from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from fastapi.testclient import TestClient

from config import Settings
from main import create_app

if TYPE_CHECKING:
    from pathlib import Path


@pytest.fixture
def built_client(tmp_path: Path) -> TestClient:
    dist = tmp_path / "dist"
    (dist / "assets").mkdir(parents=True)
    (dist / "logo").mkdir()
    (dist / "index.html").write_text("<!doctype html><title>app</title>", encoding="utf-8")
    (dist / "assets" / "app.js").write_text("console.log(1)", encoding="utf-8")
    (dist / "logo" / "mark.png").write_bytes(b"\x89PNG\r\n\x1a\n")
    (tmp_path / "secret.txt").write_text("do not serve", encoding="utf-8")
    return TestClient(create_app(Settings(_env_file=None, frontend_dist=dist)))


def test_root_serves_the_app(built_client: TestClient) -> None:
    response = built_client.get("/")

    assert response.status_code == 200
    assert "<title>app</title>" in response.text


@pytest.mark.parametrize("path", ["/questions/3", "/results"])
def test_client_side_routes_fall_back_to_the_app(built_client: TestClient, path: str) -> None:
    assert "<title>app</title>" in built_client.get(path).text


def test_built_assets_and_public_files_are_served(built_client: TestClient) -> None:
    assert built_client.get("/assets/app.js").text == "console.log(1)"
    assert built_client.get("/logo/mark.png").content.startswith(b"\x89PNG")


def test_the_api_still_wins_over_the_fallback(built_client: TestClient) -> None:
    assert built_client.get("/api/health").json() == {"status": "ok"}
    assert built_client.get("/api/nope").status_code == 404


def test_paths_cannot_escape_the_build_directory(built_client: TestClient) -> None:
    for path in ("/../secret.txt", "/%2e%2e/secret.txt", "/..%2fsecret.txt"):
        response = built_client.get(path)

        assert "do not serve" not in response.text, path
