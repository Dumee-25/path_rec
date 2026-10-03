"""Image providers for the career visualization.

Switching the feature on is a one-time job, and it only touches this package:

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

from services.providers.mock import MockProvider
from services.providers.none import NotConfiguredProvider

if TYPE_CHECKING:
    from collections.abc import Callable

    from config import Settings
    from services.providers.base import ImageProvider

    ProviderFactory = Callable[[Settings], ImageProvider]


class ProviderConfigError(RuntimeError):
    """IMAGE_PROVIDER names an unknown provider, or the chosen one is missing a setting."""


PROVIDERS: dict[str, ProviderFactory] = {
    "none": lambda _settings: NotConfiguredProvider(),
    "mock": lambda _settings: MockProvider(),
    # "my_provider": lambda settings: MyProvider(settings),
}


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
