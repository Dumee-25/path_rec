"""The contract every image provider implements."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


class ProviderConfigError(RuntimeError):
    """IMAGE_PROVIDER names an unknown provider, or the chosen one is missing a setting."""


@dataclass(frozen=True, slots=True)
class GeneratedImage:
    data: bytes
    mime_type: str


class ImageProvider(Protocol):
    name: str
    configured: bool

    def generate(self, *, photo: bytes, mime_type: str, prompt: str) -> GeneratedImage:
        """Edit ``photo`` according to ``prompt`` and return the resulting image.

        This call blocks, so it runs in a worker thread. Raise ``ProviderError`` (or any
        exception) when the provider fails; the service turns it into a 502 response.
        """
        ...
