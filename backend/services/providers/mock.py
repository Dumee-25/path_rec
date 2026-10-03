"""A development provider that returns the uploaded photo unchanged.

It exists so the camera, upload and display flow can be tried end to end without an image
model or an API key. The frontend labels it clearly. Never use it as the production provider.
"""

from __future__ import annotations

from services.providers.base import GeneratedImage


class MockProvider:
    name = "mock"
    configured = True

    def generate(self, *, photo: bytes, mime_type: str, prompt: str) -> GeneratedImage:
        return GeneratedImage(data=photo, mime_type=mime_type)
