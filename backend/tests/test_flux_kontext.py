"""Tests for the FLUX.1 Kontext [dev] provider.

No key or network is needed. The most important test runs the *real* Hugging Face client
against a faked fal-ai network, so the request it builds, the queue polling and the result
download are all exercised exactly as they would be live.
"""

from __future__ import annotations

import base64
import inspect
import json
import logging
import time
from io import BytesIO
from typing import TYPE_CHECKING, Any

import httpx2
import pytest
from huggingface_hub import InferenceClient, close_session, set_client_factory
from huggingface_hub.errors import HfHubHTTPError, InferenceTimeoutError
from huggingface_hub.inference._providers import fal_ai
from huggingface_hub.utils._http import default_client_factory
from PIL import Image
from pydantic import SecretStr

from config import Settings
from main import create_app
from services.career_image_errors import ProviderError, ProviderTimeoutError
from services.image_generation_service import CareerImageService
from services.providers import ProviderConfigError
from services.providers import flux_kontext as flux
from services.providers.flux_kontext import DEFAULT_MODEL, FluxKontextProvider, create_provider
from tests.conftest import JPEG_BYTES

if TYPE_CHECKING:
    from collections.abc import Iterator

    from services.catalog import Catalog

PROMPT = "Show the person as a data scientist working in a modern analytics environment."

# What huggingface.co returned for this model when the provider was written.
MODEL_METADATA = {
    "id": "black-forest-labs/FLUX.1-Kontext-dev",
    "pipeline_tag": "image-to-image",
    "gated": "auto",
    "inferenceProviderMapping": {
        "fal-ai": {
            "status": "live",
            "providerId": "fal-ai/flux-kontext/dev",
            "task": "image-to-image",
            "isModelAuthor": False,
        },
        "replicate": {
            "status": "live",
            "providerId": "black-forest-labs/flux-kontext-dev",
            "task": "image-to-image",
            "isModelAuthor": False,
        },
    },
}


def png_bytes(size: tuple[int, int]) -> bytes:
    buffer = BytesIO()
    Image.new("RGB", size, (20, 90, 160)).save(buffer, format="PNG")
    return buffer.getvalue()


def settings(**overrides: Any) -> Settings:
    return Settings(_env_file=None, image_provider="flux_kontext_dev", **overrides)


def http_error(status: int) -> HfHubHTTPError:
    response = httpx2.Response(status, request=httpx2.Request("POST", "https://example.test"))
    return HfHubHTTPError(f"HTTP {status}", response=response)


# --- the real client against a fake fal-ai network ---------------------------------------


class FakeFalNetwork:
    """Answers the handful of requests the client makes for one fal-ai image edit."""

    def __init__(self) -> None:
        self.requests: list[httpx2.Request] = []
        self.unmatched: list[str] = []
        self.status_polls = 0

    def __call__(self, request: httpx2.Request) -> httpx2.Response:
        self.requests.append(request)
        host, path, method = request.url.host, request.url.path, request.method

        if host == "huggingface.co" and path == "/api/agent-harnesses":
            return httpx2.Response(404)  # housekeeping the client does on its own; not our call
        if host == "huggingface.co" and path == "/api/models/black-forest-labs/FLUX.1-Kontext-dev":
            return httpx2.Response(200, json=MODEL_METADATA)
        if method == "POST" and host == "router.huggingface.co":
            return httpx2.Response(
                200,
                json={
                    "request_id": "req-1",
                    "response_url": "https://queue.fal.run/fal-ai/flux-kontext/requests/req-1",
                    "status": "IN_QUEUE",
                },
            )
        if path.endswith("/requests/req-1/status"):
            self.status_polls += 1
            done = self.status_polls >= 2  # the first poll still says IN_PROGRESS
            return httpx2.Response(200, json={"status": "COMPLETED" if done else "IN_PROGRESS"})
        if path.endswith("/requests/req-1"):
            image = {"url": "https://v3.fal.media/files/out.png", "content_type": "image/png"}
            return httpx2.Response(200, json={"images": [image]})
        if host == "v3.fal.media":
            return httpx2.Response(200, content=png_bytes((96, 72)))

        self.unmatched.append(f"{method} {request.url}")
        return httpx2.Response(404)


@pytest.fixture
def fal_network(monkeypatch: pytest.MonkeyPatch) -> Iterator[FakeFalNetwork]:
    network = FakeFalNetwork()
    monkeypatch.setattr(fal_ai, "_POLLING_INTERVAL", 0)
    close_session()
    set_client_factory(
        lambda: httpx2.Client(transport=httpx2.MockTransport(network), follow_redirects=True)
    )
    yield network
    close_session()
    set_client_factory(default_client_factory)


def test_the_real_client_edits_the_photo_through_fal_ai(fal_network: FakeFalNetwork) -> None:
    provider = create_provider(
        settings(image_api_key=SecretStr("hf_test_token"), image_inference_provider="fal-ai")
    )

    result = provider.generate(photo=JPEG_BYTES, mime_type="image/jpeg", prompt=PROMPT)

    assert fal_network.unmatched == []
    assert fal_network.status_polls == 2  # it waited for the queue
    assert result.mime_type == "image/jpeg"
    edited = Image.open(BytesIO(result.data))
    assert (edited.format, edited.size) == ("JPEG", (96, 72))


def test_the_request_carries_the_prompt_the_photo_and_the_token(
    fal_network: FakeFalNetwork,
) -> None:
    provider = create_provider(
        settings(image_api_key=SecretStr("hf_test_token"), image_inference_provider="fal-ai")
    )

    provider.generate(photo=JPEG_BYTES, mime_type="image/jpeg", prompt=PROMPT)

    post = next(r for r in fal_network.requests if r.method == "POST")
    body = json.loads(post.content)
    assert "fal-ai/flux-kontext/dev" in str(post.url)
    assert post.headers["authorization"] == "Bearer hf_test_token"
    assert body["prompt"] == PROMPT
    header, encoded = body["image_url"].split(",", 1)
    assert header == "data:image/jpeg;base64"
    assert base64.b64decode(encoded) == JPEG_BYTES


def test_the_whole_service_works_end_to_end_with_the_real_client(
    fal_network: FakeFalNetwork, catalog: Catalog
) -> None:
    provider = create_provider(
        settings(image_api_key=SecretStr("hf_test_token"), image_inference_provider="fal-ai")
    )
    service = CareerImageService(provider, catalog, max_photo_bytes=1024 * 1024)

    result = service.generate(photo=JPEG_BYTES, pathway="Data Science")

    post = next(r for r in fal_network.requests if r.method == "POST")
    prompt = json.loads(post.content)["prompt"]
    assert prompt.startswith("Transform the person in the uploaded photograph")
    assert "data scientist" in prompt
    assert prompt.endswith("Show only the one person from the photograph.")
    assert Image.open(BytesIO(result.data)).size == (96, 72)


# --- guarding against the library changing under us --------------------------------------


def test_the_installed_client_still_accepts_what_we_send() -> None:
    call = inspect.signature(InferenceClient.image_to_image).parameters
    build = inspect.signature(InferenceClient.__init__).parameters

    assert {"image", "prompt", "model"} <= set(call)
    assert {"provider", "api_key", "timeout"} <= set(build)


# --- behaviour with a stand-in editor ----------------------------------------------------


class FakeEditor:
    def __init__(
        self,
        *,
        error: BaseException | None = None,
        delay: float = 0.0,
        size: tuple[int, int] = (8, 8),
    ) -> None:
        self.error = error
        self.delay = delay
        self.size = size
        self.calls: list[dict[str, Any]] = []

    def image_to_image(
        self, image: bytes, prompt: str | None = None, *, model: str | None = None
    ) -> Image.Image:
        self.calls.append({"image": image, "prompt": prompt, "model": model})
        time.sleep(self.delay)
        if self.error:
            raise self.error
        return Image.new("RGB", self.size, (1, 2, 3))


def generate(editor: FakeEditor, **options: Any) -> Any:
    provider = FluxKontextProvider(editor, **options)
    return provider.generate(photo=JPEG_BYTES, mime_type="image/jpeg", prompt=PROMPT)


def test_the_model_prompt_and_photo_are_passed_through() -> None:
    editor = FakeEditor()

    result = generate(editor, model="someone/other-model")

    assert editor.calls == [{"image": JPEG_BYTES, "prompt": PROMPT, "model": "someone/other-model"}]
    assert result.mime_type == "image/jpeg"


def test_the_default_model_is_flux_kontext_dev() -> None:
    editor = FakeEditor()

    generate(editor)

    assert editor.calls[0]["model"] == "black-forest-labs/FLUX.1-Kontext-dev" == DEFAULT_MODEL


def test_a_slow_provider_is_given_up_on_at_the_deadline() -> None:
    started = time.monotonic()

    with pytest.raises(ProviderTimeoutError):
        generate(FakeEditor(delay=0.6), deadline_seconds=0.05)

    assert time.monotonic() - started < 0.5  # we did not wait for the slow call to finish


def test_the_clients_own_timeout_is_reported_the_same_way() -> None:
    with pytest.raises(ProviderTimeoutError):
        generate(FakeEditor(error=InferenceTimeoutError("model is loading")))


@pytest.mark.parametrize("status", [401, 403])
def test_refused_credentials_log_how_to_fix_it_but_tell_the_applicant_nothing_technical(
    status: int, caplog: pytest.LogCaptureFixture
) -> None:
    with caplog.at_level(logging.ERROR), pytest.raises(ProviderError) as caught:
        generate(FakeEditor(error=http_error(status)))

    assert str(caught.value) == ProviderError.default_message
    assert "IMAGE_API_KEY" in caplog.text
    assert "Inference Providers" in caplog.text


@pytest.mark.parametrize("status", [429, 503])
def test_a_busy_provider_asks_the_applicant_to_try_again(status: int) -> None:
    with pytest.raises(ProviderError, match="busy"):
        generate(FakeEditor(error=http_error(status)))


def test_running_out_of_credits_is_logged_for_the_operator(
    caplog: pytest.LogCaptureFixture,
) -> None:
    with caplog.at_level(logging.ERROR), pytest.raises(ProviderError):
        generate(FakeEditor(error=http_error(402)))

    assert "out of credits" in caplog.text


def test_any_other_provider_failure_is_a_generic_error(catalog: Catalog) -> None:
    # A malformed provider answer surfaces as KeyError inside the client.
    service = CareerImageService(
        FluxKontextProvider(FakeEditor(error=KeyError("images"))),
        catalog,
        max_photo_bytes=1024 * 1024,
    )

    with pytest.raises(ProviderError) as caught:
        service.generate(photo=JPEG_BYTES, pathway="Data Science")

    assert "images" not in str(caught.value)


# --- configuration -----------------------------------------------------------------------


class SpyClient:
    """Stands in for InferenceClient to record how it was built."""

    last: dict[str, Any] = {}  # noqa: RUF012

    def __init__(self, **kwargs: Any) -> None:
        SpyClient.last = kwargs

    def image_to_image(
        self, image: bytes, prompt: str | None = None, *, model: str | None = None
    ) -> Image.Image:
        raise AssertionError("not called in this test")


def test_settings_are_handed_to_the_client(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(flux, "InferenceClient", SpyClient)

    provider = create_provider(
        settings(
            image_api_key=SecretStr("  hf_abc  "),
            image_inference_provider="replicate",
            image_timeout_seconds=45,
            image_model="black-forest-labs/FLUX.1-Kontext-dev",
        )
    )

    assert SpyClient.last == {"provider": "replicate", "api_key": "hf_abc", "timeout": 45}
    assert provider.name == "flux_kontext_dev"
    assert provider.configured


def test_blank_optional_settings_fall_back_to_defaults(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(flux, "InferenceClient", SpyClient)
    # backend/.env.example leaves these empty.
    provider = create_provider(
        settings(image_api_key=SecretStr("hf_abc"), image_model="", image_inference_provider="")
    )

    assert SpyClient.last["provider"] == "auto"
    assert SpyClient.last["timeout"] == 120
    assert provider._model == DEFAULT_MODEL


@pytest.mark.parametrize("key", [None, SecretStr(""), SecretStr("   ")])
def test_a_missing_api_key_stops_startup_with_instructions(key: SecretStr | None) -> None:
    with pytest.raises(ProviderConfigError, match=r"IMAGE_API_KEY is required"):
        create_app(settings(image_api_key=key))


def test_the_app_reports_the_provider_as_configured_without_any_network_call() -> None:
    app = create_app(settings(image_api_key=SecretStr("hf_abc")))

    from fastapi.testclient import TestClient

    status = TestClient(app).get("/api/career-image/status").json()
    assert status == {"configured": True, "provider": "flux_kontext_dev"}


def test_a_non_positive_timeout_is_rejected() -> None:
    with pytest.raises(ValueError, match="greater than 0"):
        settings(image_api_key=SecretStr("hf_abc"), image_timeout_seconds=0)
