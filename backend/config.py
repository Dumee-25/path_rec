"""Runtime settings, read from environment variables or ``backend/.env``."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent
DATA_DIR = BACKEND_DIR / "data"
DEFAULT_FRONTEND_DIST = BACKEND_DIR.parent / "frontend" / "dist"

MAX_PHOTO_BYTES = 5 * 1024 * 1024


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    # Career visualization. "none" keeps the feature switched off, "mock" echoes the photo
    # back for local testing. See services/providers/ for how to add a real provider.
    image_provider: str = "none"
    image_api_key: SecretStr | None = None
    image_model: str | None = None
    # Which Hugging Face Inference Provider serves the model: "auto", "fal-ai", "replicate", ...
    image_inference_provider: str = "auto"
    # Seconds to wait for a generated image before giving up.
    image_timeout_seconds: float = Field(default=120.0, gt=0)
    max_photo_bytes: int = MAX_PHOTO_BYTES

    frontend_dist: Path = DEFAULT_FRONTEND_DIST


@lru_cache
def get_settings() -> Settings:
    return Settings()
