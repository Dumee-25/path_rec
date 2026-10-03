"""Try the career visualization from the command line, without the browser.

    uv run python -m scripts.try_career_image path/to/photo.jpg "Data Science"

It uses the settings in ``backend/.env``, so it is the quickest way to check that the API key,
model and provider work. The result is saved next to the photo unless ``--output`` is given.
Add ``--show-prompt`` to print the exact prompt that is sent with the photo.
"""

from __future__ import annotations

import argparse
import logging
import time
from pathlib import Path
from typing import TYPE_CHECKING

from config import DATA_DIR, get_settings
from services.career_image_errors import CareerImageError
from services.catalog import load_catalog
from services.image_generation_service import CareerImageService
from services.providers import ProviderConfigError, build_provider

if TYPE_CHECKING:
    from collections.abc import Sequence

    from config import Settings


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create a career visualization from a photo.")
    parser.add_argument("photo", type=Path, help="a JPEG or PNG photo of one person")
    parser.add_argument("pathway", help='a pathway name, for example "Data Science"')
    parser.add_argument(
        "--output", type=Path, help="where to save the result (default: beside the photo)"
    )
    parser.add_argument(
        "--show-prompt", action="store_true", help="print the prompt before sending"
    )
    return parser


def main(argv: Sequence[str] | None = None, settings: Settings | None = None) -> int:
    """Run one visualization and report how it went. Returns the process exit code."""
    args = _parser().parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    settings = settings or get_settings()

    try:
        service = CareerImageService(
            build_provider(settings),
            load_catalog(DATA_DIR),
            max_photo_bytes=settings.max_photo_bytes,
        )
    except ProviderConfigError as exc:
        print(f"Cannot start: {exc}")
        return 2
    if not service.configured:
        print(
            "IMAGE_PROVIDER is 'none'. Set IMAGE_PROVIDER=flux_kontext_dev in backend/.env first."
        )
        return 2

    print(f"Provider: {service.provider_name}   Pathway: {args.pathway}")
    try:
        if args.show_prompt:
            print(f"\n{service.build_prompt(args.pathway)}\n")
        photo = args.photo.read_bytes()
        started = time.perf_counter()
        result = service.generate(photo=photo, pathway=args.pathway)
    except OSError as exc:
        print(f"Cannot read the photo: {exc}")
        return 2
    except CareerImageError as exc:
        print(f"Failed ({exc.code}): {exc}")
        return 1

    slug = args.pathway.lower().replace(" ", "-")
    output = args.output or args.photo.with_name(f"{args.photo.stem}-{slug}.jpg")
    output.write_bytes(result.data)
    print(f"Done in {time.perf_counter() - started:.1f}s. Saved {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
