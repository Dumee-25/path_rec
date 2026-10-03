from __future__ import annotations

import base64
from typing import TYPE_CHECKING

import pytest

from config import Settings
from services.career_image_errors import NotConfiguredError, UnknownPathwayError
from services.image_generation_service import CareerImageService, detect_image_type
from services.providers import PROVIDERS, ProviderConfigError, build_provider
from services.providers.base import GeneratedImage
from services.providers.mock import MockProvider
from services.providers.none import NotConfiguredProvider
from tests.conftest import JPEG_BYTES, PNG_BYTES

if TYPE_CHECKING:
    from collections.abc import Callable

    from fastapi.testclient import TestClient
    from httpx import Response

    from services.catalog import Catalog


def upload(
    client: TestClient,
    data: bytes = JPEG_BYTES,
    *,
    pathway: str = "Artificial Intelligence",
    content_type: str = "image/jpeg",
) -> Response:
    response: Response = client.post(
        "/api/career-image",
        files={"photo": ("photo.jpg", data, content_type)},
        data={"pathway": pathway},
    )
    return response


# --- not configured (the default) -------------------------------------------------------


def test_status_reports_not_configured_by_default(client: TestClient) -> None:
    assert client.get("/api/career-image/status").json() == {
        "configured": False,
        "provider": "none",
    }


def test_generating_without_a_provider_is_a_clear_503(client: TestClient) -> None:
    response = upload(client)

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "not_configured"


# --- mock provider -----------------------------------------------------------------------


@pytest.fixture
def mock_client(make_client: Callable[..., TestClient]) -> TestClient:
    return make_client(image_provider="mock")


def test_status_reports_the_mock_provider(mock_client: TestClient) -> None:
    assert mock_client.get("/api/career-image/status").json() == {
        "configured": True,
        "provider": "mock",
    }


def test_mock_provider_returns_the_photo_as_a_data_url(mock_client: TestClient) -> None:
    response = upload(mock_client, PNG_BYTES, content_type="image/png")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    image_url = response.json()["image_url"]
    prefix, encoded = image_url.split(",", 1)
    assert prefix == "data:image/png;base64"
    assert base64.b64decode(encoded) == PNG_BYTES


def test_the_file_type_is_taken_from_the_bytes_not_the_claim(mock_client: TestClient) -> None:
    response = upload(mock_client, JPEG_BYTES, content_type="image/png")

    assert response.json()["image_url"].startswith("data:image/jpeg;base64,")


def test_a_non_image_is_rejected(mock_client: TestClient) -> None:
    response = upload(mock_client, b"%PDF-1.7 not an image", content_type="image/jpeg")

    assert response.status_code == 415
    assert response.json()["detail"]["code"] == "unsupported_photo"


def test_an_oversized_photo_is_rejected(make_client: Callable[..., TestClient]) -> None:
    client = make_client(image_provider="mock", max_photo_bytes=32)

    response = upload(client, JPEG_BYTES)

    assert response.status_code == 413
    assert response.json()["detail"]["code"] == "photo_too_large"


def test_an_unknown_pathway_is_rejected(mock_client: TestClient) -> None:
    response = upload(mock_client, pathway="Underwater Basket Weaving")

    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "unknown_pathway"


def test_a_missing_photo_is_rejected(mock_client: TestClient) -> None:
    response = mock_client.post("/api/career-image", data={"pathway": "Data Science"})

    assert response.status_code == 422


# --- prompts -----------------------------------------------------------------------------


@pytest.fixture
def service(catalog: Catalog) -> CareerImageService:
    return CareerImageService(MockProvider(), catalog, max_photo_bytes=1024)


def test_prompt_is_base_then_scene_then_constraints(service: CareerImageService) -> None:
    prompt = service.build_prompt("Artificial Intelligence")

    parts = prompt.split("\n\n")
    assert parts[0].startswith("Transform the person in the uploaded photograph")
    assert "Preserve the person's identity" in prompt
    assert parts[-2].startswith("Show the person as an AI engineer")
    assert parts[-1].startswith("Do not add any text, captions, logos or watermarks")


def test_every_pathway_has_a_distinct_prompt(service: CareerImageService, catalog: Catalog) -> None:
    prompts = {name: service.build_prompt(name) for name in catalog.pathway_names}

    assert len(set(prompts.values())) == 9


def test_prompt_for_an_unknown_pathway_raises(service: CareerImageService) -> None:
    with pytest.raises(UnknownPathwayError):
        service.build_prompt("Nope")


def test_photo_type_detection() -> None:
    assert detect_image_type(JPEG_BYTES) == "image/jpeg"
    assert detect_image_type(PNG_BYTES) == "image/png"
    assert detect_image_type(b"GIF89a") is None


# --- registering a provider: the one-time fix --------------------------------------------


class FakeProvider:
    """What a real provider looks like: bytes and a prompt in, bytes out."""

    name = "fake"
    configured = True

    def __init__(self) -> None:
        self.seen: dict[str, object] = {}

    def generate(self, *, photo: bytes, mime_type: str, prompt: str) -> GeneratedImage:
        self.seen = {"photo": photo, "mime_type": mime_type, "prompt": prompt}
        return GeneratedImage(data=b"generated", mime_type="image/png")


def test_a_registered_provider_receives_the_photo_and_finished_prompt(
    monkeypatch: pytest.MonkeyPatch, make_client: Callable[..., TestClient]
) -> None:
    fake = FakeProvider()
    monkeypatch.setitem(PROVIDERS, "fake", lambda _settings: fake)
    client = make_client(image_provider="fake")

    response = upload(client, pathway="Cyber Security")

    assert response.status_code == 200
    assert fake.seen["photo"] == JPEG_BYTES
    assert fake.seen["mime_type"] == "image/jpeg"
    assert "cybersecurity analyst" in str(fake.seen["prompt"])
    encoded = response.json()["image_url"].split(",", 1)[1]
    assert base64.b64decode(encoded) == b"generated"


def test_a_failing_provider_becomes_a_502_without_leaking_details(
    monkeypatch: pytest.MonkeyPatch, make_client: Callable[..., TestClient]
) -> None:
    class Broken(FakeProvider):
        def generate(self, *, photo: bytes, mime_type: str, prompt: str) -> GeneratedImage:
            raise RuntimeError("secret upstream detail")

    monkeypatch.setitem(PROVIDERS, "broken", lambda _settings: Broken())
    client = make_client(image_provider="broken")

    response = upload(client)

    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "provider_error"
    assert "secret" not in response.text


def test_unknown_provider_name_stops_startup_and_lists_the_options(
    make_client: Callable[..., TestClient],
) -> None:
    with pytest.raises(ProviderConfigError, match=r"Available: mock, none"):
        make_client(image_provider="gpt-banana")


def test_provider_name_is_case_and_whitespace_insensitive() -> None:
    settings = Settings(_env_file=None, image_provider="  NONE ")

    assert isinstance(build_provider(settings), NotConfiguredProvider)


def test_the_none_provider_raises_not_configured() -> None:
    with pytest.raises(NotConfiguredError):
        NotConfiguredProvider().generate(photo=b"", mime_type="", prompt="")
