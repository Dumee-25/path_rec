"""Photo handling shared by the career visualization service and its providers."""

from __future__ import annotations

from io import BytesIO

from PIL import Image, ImageOps, UnidentifiedImageError

# Image editing models work best around one megapixel, and every provider accepts JPEG.
MAX_SIDE = 1024
JPEG_QUALITY = 92
# Refuse anything whose decoded size would be unreasonable (a "decompression bomb").
MAX_PIXELS = 40_000_000


class ImageReadError(ValueError):
    """The bytes are not a readable image."""


class ImageTooLargeError(ImageReadError):
    """The image decodes to more pixels than we are willing to process."""


def normalize_photo(data: bytes) -> bytes:
    """Return the photo as an upright RGB JPEG no larger than ``MAX_SIDE`` on its long edge.

    Re-encoding drops all metadata, including any GPS location, and flattens transparency
    onto white. The original bytes are never kept.

    Raises:
        ImageTooLargeError: if the image has too many pixels.
        ImageReadError: if the bytes cannot be decoded as an image.
    """
    try:
        with Image.open(BytesIO(data)) as source:
            if source.width * source.height > MAX_PIXELS:
                raise ImageTooLargeError("The photo's dimensions are too large.")
            source.load()
            upright = ImageOps.exif_transpose(source)
            rgb = _flatten_to_rgb(upright)
    except ImageReadError:
        raise
    except (
        UnidentifiedImageError,
        OSError,
        SyntaxError,
        ValueError,
        Image.DecompressionBombError,
    ) as exc:
        raise ImageReadError("The photo could not be read as an image.") from exc

    rgb.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
    return to_jpeg_bytes(rgb)


def to_jpeg_bytes(image: Image.Image) -> bytes:
    buffer = BytesIO()
    image.convert("RGB").save(buffer, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return buffer.getvalue()


def _flatten_to_rgb(image: Image.Image) -> Image.Image:
    """Convert to RGB, placing any transparency on white rather than black."""
    if image.mode in ("RGBA", "LA") or "transparency" in image.info:
        rgba = image.convert("RGBA")
        background = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        background.alpha_composite(rgba)
        return background.convert("RGB")
    return image.convert("RGB")
