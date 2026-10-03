"""Career visualization: build the prompt, check the photo, call the provider.

The photo is held in memory for the length of one request. It is never written to disk,
logged, or used for scoring. Before it reaches a provider it is re-encoded as a JPEG of at
most 1024 pixels, which also removes any location data stored in the file.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from services.career_image_errors import (
    CareerImageError,
    NotConfiguredError,
    PhotoTooLargeError,
    ProviderError,
    UnknownPathwayError,
    UnsupportedPhotoError,
)
from utils.images import ImageReadError, ImageTooLargeError, normalize_photo

if TYPE_CHECKING:
    from services.catalog import Catalog
    from services.providers.base import GeneratedImage, ImageProvider

logger = logging.getLogger(__name__)

_IMAGE_SIGNATURES = (
    (b"\xff\xd8\xff", "image/jpeg"),
    (b"\x89PNG\r\n\x1a\n", "image/png"),
)


def detect_image_type(data: bytes) -> str | None:
    """Identify JPEG or PNG from the file's own bytes rather than the client's claim."""
    for signature, mime_type in _IMAGE_SIGNATURES:
        if data.startswith(signature):
            return mime_type
    return None


class CareerImageService:
    def __init__(self, provider: ImageProvider, catalog: Catalog, *, max_photo_bytes: int) -> None:
        self._provider = provider
        self._catalog = catalog
        self._max_photo_bytes = max_photo_bytes

    @property
    def configured(self) -> bool:
        return self._provider.configured

    @property
    def provider_name(self) -> str:
        return self._provider.name

    @property
    def max_photo_bytes(self) -> int:
        return self._max_photo_bytes

    def build_prompt(self, pathway: str) -> str:
        """Base identity-preservation prompt, then the pathway scene, then the constraints."""
        prompts = self._catalog.career_prompts
        try:
            scene = prompts.by_pathway[pathway]
        except KeyError:
            raise UnknownPathwayError(f"{pathway!r} is not a recognised pathway.") from None
        return "\n\n".join([*prompts.base, scene, prompts.constraints])

    def generate(self, *, photo: bytes, pathway: str) -> GeneratedImage:
        """Create the career visualization for ``pathway`` from ``photo``.

        Raises:
            CareerImageError: a subclass describing what went wrong; each has an HTTP status.
        """
        if not self._provider.configured:
            raise NotConfiguredError
        prompt = self.build_prompt(pathway)
        if len(photo) > self._max_photo_bytes:
            raise PhotoTooLargeError(
                f"The photo must be smaller than {self._max_photo_bytes // (1024 * 1024)} MB."
            )
        if detect_image_type(photo) is None:
            raise UnsupportedPhotoError
        try:
            prepared = normalize_photo(photo)
        except ImageTooLargeError as exc:
            raise PhotoTooLargeError(str(exc)) from exc
        except ImageReadError as exc:
            raise UnsupportedPhotoError(str(exc)) from exc

        try:
            return self._provider.generate(photo=prepared, mime_type="image/jpeg", prompt=prompt)
        except CareerImageError:
            raise
        except Exception as exc:
            logger.exception("Image provider %r failed", self._provider.name)
            raise ProviderError from exc
