from __future__ import annotations

import json
import shutil
from typing import TYPE_CHECKING, Any

import pytest

from config import DATA_DIR
from services.catalog import Catalog, CatalogError, load_catalog

if TYPE_CHECKING:
    from collections.abc import Callable
    from pathlib import Path

# Spec section 8. The order only breaks ties; it does not rank pathways.
SPEC_PATHWAY_ORDER = [
    "Computer Science",
    "Data Science",
    "Artificial Intelligence",
    "Computer Security",
    "Cyber Security",
    "Software Engineering",
    "Computer Networks",
    "Technology Management",
    "Management Information Systems",
]


def test_pathways_follow_the_spec_tie_break_order(catalog: Catalog) -> None:
    assert list(catalog.pathway_names) == SPEC_PATHWAY_ORDER


def test_there_are_five_questions_matching_the_copy(catalog: Catalog) -> None:
    # The landing page says "five short questions"; change that copy if this number changes.
    assert [question.id for question in catalog.questions] == [1, 2, 3, 4, 5]


def test_every_pathway_has_at_least_one_degree(catalog: Catalog) -> None:
    for name in catalog.pathway_names:
        assert catalog.degrees_for(name), name


def test_every_degree_names_its_university(catalog: Catalog) -> None:
    assert all(degree.university for degree in catalog.degrees)
    assert len(catalog.degrees) == 13


def test_every_pathway_has_reasons_and_a_career_prompt(catalog: Catalog) -> None:
    for name in catalog.pathway_names:
        assert len(catalog.reasons[name]) == 3
        assert catalog.career_prompts.by_pathway[name].startswith("Show the person as")


def test_max_possible_score_sums_the_best_option_per_question(catalog: Catalog) -> None:
    # Artificial Intelligence has a +3 option in every question.
    assert catalog.max_possible_score("Artificial Intelligence") == 15


@pytest.fixture
def data_copy(tmp_path: Path) -> Path:
    target = tmp_path / "data"
    shutil.copytree(DATA_DIR, target)
    return target


def edit(path: Path, change: Callable[[dict[str, Any]], None]) -> None:
    content = json.loads(path.read_text(encoding="utf-8"))
    change(content)
    path.write_text(json.dumps(content), encoding="utf-8")


def test_copy_of_the_data_loads(data_copy: Path) -> None:
    assert load_catalog(data_copy).pathway_names


def test_weight_for_unknown_pathway_is_rejected(data_copy: Path) -> None:
    edit(
        data_copy / "questions.json",
        lambda content: content["questions"][0]["options"][0]["weights"].update({"Robotics": 3}),
    )

    with pytest.raises(CatalogError, match=r"unknown"):
        load_catalog(data_copy)


def test_pathway_without_degrees_is_rejected(data_copy: Path) -> None:
    edit(
        data_copy / "degrees.json",
        lambda content: content.update(
            degrees=[d for d in content["degrees"] if d["pathway"] != "Cyber Security"]
        ),
    )

    with pytest.raises(CatalogError, match=r"Cyber Security.*no degree"):
        load_catalog(data_copy)


def test_unknown_key_in_a_data_file_is_rejected(data_copy: Path) -> None:
    edit(data_copy / "scoring.json", lambda content: content.update(typo=1))

    with pytest.raises(CatalogError, match=r"scoring.json"):
        load_catalog(data_copy)


def test_malformed_json_is_reported_with_the_file_name(data_copy: Path) -> None:
    (data_copy / "degrees.json").write_text("{ nope", encoding="utf-8")

    with pytest.raises(CatalogError, match=r"degrees\.json is not valid JSON"):
        load_catalog(data_copy)
