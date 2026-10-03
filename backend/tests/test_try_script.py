from __future__ import annotations

from io import BytesIO
from typing import TYPE_CHECKING

from PIL import Image

from config import Settings
from scripts.try_career_image import main
from tests.conftest import JPEG_BYTES

if TYPE_CHECKING:
    from pathlib import Path

    import pytest


def photo_file(tmp_path: Path) -> Path:
    path = tmp_path / "me.jpg"
    path.write_bytes(JPEG_BYTES)
    return path


def test_it_saves_the_result_beside_the_photo(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    photo = photo_file(tmp_path)

    code = main([str(photo), "Data Science"], Settings(_env_file=None, image_provider="mock"))

    saved = tmp_path / "me-data-science.jpg"
    assert code == 0
    assert Image.open(BytesIO(saved.read_bytes())).format == "JPEG"
    assert "Saved" in capsys.readouterr().out


def test_it_can_show_the_exact_prompt(capsys: pytest.CaptureFixture[str], tmp_path: Path) -> None:
    main(
        [str(photo_file(tmp_path)), "Cyber Security", "--show-prompt"],
        Settings(_env_file=None, image_provider="mock"),
    )

    assert "cybersecurity analyst" in capsys.readouterr().out


def test_it_explains_when_the_feature_is_switched_off(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    code = main([str(photo_file(tmp_path)), "Data Science"], Settings(_env_file=None))

    assert code == 2
    assert "IMAGE_PROVIDER is 'none'" in capsys.readouterr().out


def test_it_explains_a_missing_api_key(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    code = main(
        [str(photo_file(tmp_path)), "Data Science"],
        Settings(_env_file=None, image_provider="flux_kontext_dev"),
    )

    assert code == 2
    assert "IMAGE_API_KEY is required" in capsys.readouterr().out


def test_it_reports_an_unknown_pathway(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    code = main(
        [str(photo_file(tmp_path)), "Basket Weaving"],
        Settings(_env_file=None, image_provider="mock"),
    )

    assert code == 1
    assert "unknown_pathway" in capsys.readouterr().out


def test_it_reports_a_photo_that_cannot_be_read(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    code = main(
        [str(tmp_path / "missing.jpg"), "Data Science"],
        Settings(_env_file=None, image_provider="mock"),
    )

    assert code == 2
    assert "Cannot read the photo" in capsys.readouterr().out
