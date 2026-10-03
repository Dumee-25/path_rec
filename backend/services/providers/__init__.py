"""Image providers for the career visualization.

``flux_kontext_dev`` (FLUX.1 Kontext [dev] through Hugging Face) is built in. Set
``IMAGE_PROVIDER=flux_kontext_dev`` and ``IMAGE_API_KEY`` in ``backend/.env`` to use it; see
``flux_kontext.py`` for all of its settings.

To connect a different model instead, the job only touches this package:

1. Add a module here with a class that implements ``ImageProvider`` (see ``base.py``). It
   receives the photo bytes and the finished prompt, and returns the generated image.
2. Register it in ``PROVIDERS`` below. Raise ``ProviderConfigError`` from the factory if a
   required setting such as ``settings.image_api_key`` is missing, so the server refuses to
   start with a half-finished setup.
3. Set ``IMAGE_PROVIDER`` (and ``IMAGE_API_KEY``, ``IMAGE_MODEL``) in ``backend/.env``.

The prompts, upload checks, API endpoints and the whole frontend flow need no changes.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from services.providers.base import ProviderConfigError
from services.providers.mock import MockProvider
from services.providers.none import NotConfiguredProvider

if TYPE_CHECKING:
    from collections.abc import Callable

    from config import Settings
    from services.providers.base import ImageProvider

    ProviderFactory = Callable[[Settings], ImageProvider]


def _flux_kontext_dev(settings: Settings) -> ImageProvider:
    # Imported here so the Hugging Face client is only loaded when this provider is selected.
    from services.providers.flux_kontext import create_provider

    return create_provider(settings)


PROVIDERS: dict[str, ProviderFactory] = {
    "none": lambda _settings: NotConfiguredProvider(),
    "mock": lambda _settings: MockProvider(),
    "flux_kontext_dev": _flux_kontext_dev,
    # "my_provider": lambda settings: MyProvider(settings),
}

__all__ = ["PROVIDERS", "ProviderConfigError", "build_provider"]


def build_provider(settings: Settings) -> ImageProvider:
    name = settings.image_provider.strip().lower()
    try:
        factory = PROVIDERS[name]
    except KeyError:
        available = ", ".join(sorted(PROVIDERS))
        raise ProviderConfigError(
            f"Unknown IMAGE_PROVIDER {settings.image_provider!r}. Available: {available}."
        ) from None
    return factory(settings)
