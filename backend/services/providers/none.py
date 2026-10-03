"""The default provider: career visualization is switched off."""

from __future__ import annotations

from typing import TYPE_CHECKING

from services.career_image_errors import NotConfiguredError

if TYPE_CHECKING:
    from services.providers.base import GeneratedImage


class NotConfiguredProvider:
    name = "none"
    configured = False

    def generate(self, *, photo: bytes, mime_type: str, prompt: str) -> GeneratedImage:
        raise NotConfiguredError
