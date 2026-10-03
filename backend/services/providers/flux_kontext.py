"""FLUX.1 Kontext [dev] through Hugging Face Inference Providers.

``black-forest-labs/FLUX.1-Kontext-dev`` is an image *editing* model: it takes the photo and a
written instruction and returns the edited picture. Hugging Face routes the call to a hosting
provider (fal-ai, replicate or wavespeed at the time of writing), so one token covers all of
them. Settings, all read from ``backend/.env``:

``IMAGE_API_KEY``
    A Hugging Face access token (``hf_...``) allowed to call Inference Providers. A provider's
    own key also works, but then ``IMAGE_INFERENCE_PROVIDER`` must name that provider.
``IMAGE_MODEL``
    Optional. Defaults to ``black-forest-labs/FLUX.1-Kontext-dev``.
``IMAGE_INFERENCE_PROVIDER``
    Optional. ``auto`` (the default) lets Hugging Face choose, or name one such as ``fal-ai``.
``IMAGE_TIMEOUT_SECONDS``
    Optional. How long to wait for an image. Defaults to 120.
"""

from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor
from typing import TYPE_CHECKING, Any, Protocol

from huggingface_hub import InferenceClient
from huggingface_hub.errors import HfHubHTTPError

from services.career_image_errors import ProviderError, ProviderTimeoutError
from services.providers.base import GeneratedImage, ProviderConfigError
from utils.images import to_jpeg_bytes

if TYPE_CHECKING:
    from PIL import Image

    from config import Settings

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "black-forest-labs/FLUX.1-Kontext-dev"

# Hosting providers queue the job and the client polls until it is done, with no limit of its
# own. These threads let us stop waiting at our own deadline without tying up the web server's
# worker pool. A job we gave up on still finishes in the background; the cap keeps that bounded.
_MAX_BACKGROUND_JOBS = 4
_executor = ThreadPoolExecutor(max_workers=_MAX_BACKGROUND_JOBS, thread_name_prefix="flux-kontext")

_BUSY_STATUSES = frozenset({429, 503})
_AUTH_STATUSES = frozenset({401, 403})
_BUSY_MESSAGE = "The image service is busy. Please try again in a moment."


class ImageEditor(Protocol):
    """The part of ``huggingface_hub.InferenceClient`` that this provider uses."""

    def image_to_image(
        self, image: bytes, prompt: str | None = None, *, model: str | None = None
    ) -> Image.Image: ...


class FluxKontextProvider:
    name = "flux_kontext_dev"
    configured = True

    def __init__(
        self, editor: ImageEditor, *, model: str = DEFAULT_MODEL, deadline_seconds: float = 120.0
    ) -> None:
        self._editor = editor
        self._model = model
        self._deadline_seconds = deadline_seconds

    def generate(self, *, photo: bytes, mime_type: str, prompt: str) -> GeneratedImage:
        future = _executor.submit(self._edit, photo, prompt)
        try:
            image = future.result(timeout=self._deadline_seconds)
        except TimeoutError:
            # Covers our own deadline and the client's request timeout (both are TimeoutError).
            future.cancel()
            logger.error("FLUX Kontext gave no result within %.0f seconds", self._deadline_seconds)
            raise ProviderTimeoutError from None
        except HfHubHTTPError as exc:
            raise _error_for(exc) from exc
        return GeneratedImage(data=to_jpeg_bytes(image), mime_type="image/jpeg")

    def _edit(self, photo: bytes, prompt: str) -> Image.Image:
        return self._editor.image_to_image(photo, prompt=prompt, model=self._model)


def _error_for(exc: HfHubHTTPError) -> ProviderError:
    """Turn a failed provider call into a plain message for the applicant and a useful log line."""
    status = exc.response.status_code
    if status in _AUTH_STATUSES:
        logger.error(
            "The image provider refused the credentials (HTTP %s). IMAGE_API_KEY must be a "
            "Hugging Face token that can call Inference Providers, and that account may need to "
            "accept the FLUX.1 Kontext licence on huggingface.co first.",
            status,
        )
        return ProviderError()
    if status == 402:
        logger.error("The image provider says the account is out of credits (HTTP 402).")
        return ProviderError()
    if status in _BUSY_STATUSES:
        logger.warning("The image provider is busy or rate limiting (HTTP %s).", status)
        return ProviderError(_BUSY_MESSAGE)
    logger.error("The image provider failed (HTTP %s): %s", status, exc)
    return ProviderError()


def create_provider(settings: Settings) -> FluxKontextProvider:
    """Build the provider from settings, refusing to start without an API key."""
    api_key = settings.image_api_key.get_secret_value().strip() if settings.image_api_key else ""
    if not api_key:
        raise ProviderConfigError(
            "IMAGE_API_KEY is required when IMAGE_PROVIDER=flux_kontext_dev. "
            "Set it in backend/.env to a Hugging Face access token."
        )
    inference_provider: Any = (settings.image_inference_provider or "auto").strip()
    client = InferenceClient(
        provider=inference_provider, api_key=api_key, timeout=settings.image_timeout_seconds
    )
    return FluxKontextProvider(
        client,
        model=(settings.image_model or "").strip() or DEFAULT_MODEL,
        deadline_seconds=settings.image_timeout_seconds,
    )
