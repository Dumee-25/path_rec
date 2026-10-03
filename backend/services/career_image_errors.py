"""Errors raised by the career visualization feature.

Each error carries the HTTP status and a stable ``code`` the frontend can switch on.
"""

from __future__ import annotations


class CareerImageError(Exception):
    code = "career_image_error"
    http_status = 500
    default_message = "The career visualization could not be created."

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.default_message)


class NotConfiguredError(CareerImageError):
    code = "not_configured"
    http_status = 503
    default_message = "Career visualization is not set up on this system yet."


class UnknownPathwayError(CareerImageError):
    code = "unknown_pathway"
    http_status = 422
    default_message = "That pathway is not recognised."


class UnsupportedPhotoError(CareerImageError):
    code = "unsupported_photo"
    http_status = 415
    default_message = "The photo must be a JPEG or PNG image."


class PhotoTooLargeError(CareerImageError):
    code = "photo_too_large"
    http_status = 413
    default_message = "The photo is too large."


class ProviderError(CareerImageError):
    code = "provider_error"
    http_status = 502
    default_message = "The visualization could not be created. Please try again."
