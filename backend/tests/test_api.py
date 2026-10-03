from __future__ import annotations

from typing import TYPE_CHECKING

from tests.conftest import answers_json

if TYPE_CHECKING:
    from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    assert client.get("/api/health").json() == {"status": "ok"}


def test_pathways_are_listed_in_predefined_order(client: TestClient) -> None:
    pathways = client.get("/api/pathways").json()

    assert len(pathways) == 9
    assert pathways[0]["name"] == "Computer Science"
    assert pathways[2] == {
        "id": "artificial_intelligence",
        "name": "Artificial Intelligence",
        "career": "AI Engineer / Robotics Engineer",
        "description": "Focuses on intelligent systems, machine learning and automation.",
    }


def test_degrees_are_listed_with_their_pathway(client: TestClient) -> None:
    degrees = client.get("/api/degrees").json()["degrees"]

    assert len(degrees) == 13
    victoria = next(d for d in degrees if d["university"] == "Victoria University")
    assert victoria["pathway"] == "Cyber Security"
    assert victoria["country"] == "Australia"


def test_questions_hide_the_scoring_weights(client: TestClient) -> None:
    questions = client.get("/api/questions").json()

    assert [q["id"] for q in questions] == [1, 2, 3, 4, 5]
    assert set(questions[0]) == {"id", "text", "options"}
    assert set(questions[0]["options"][0]) == {"id", "text"}
    assert "weights" not in client.get("/api/questions").text


def test_recommend_returns_ranked_pathways_with_degrees(client: TestClient) -> None:
    response = client.post("/api/recommend", json=answers_json("CDCDD"))

    assert response.status_code == 200
    top, second, third = response.json()["recommendations"]
    assert (top["pathway"], top["raw_score"], top["display_score"], top["label"]) == (
        "Artificial Intelligence",
        15,
        100,
        "Strongest Match",
    )
    assert top["degrees"] == [
        {
            "id": "plymouth_bsc_artificial_intelligence",
            "name": "BSc (Hons) Artificial Intelligence",
            "university": "Plymouth University",
            "country": "United Kingdom",
            "pathway": "Artificial Intelligence",
        }
    ]
    assert (second["pathway"], second["display_score"]) == ("Data Science", 33)
    assert (third["pathway"], third["display_score"]) == ("Computer Science", 13)
    assert len(top["reasons"]) == 3


def test_recommend_rejects_unknown_answers_with_a_readable_message(client: TestClient) -> None:
    body = answers_json("CDCDD")
    body["answers"][0]["option_id"] = "Z"

    response = client.post("/api/recommend", json=body)

    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "invalid_answers"
    assert "not an option for question 1" in response.json()["detail"]["message"]


def test_recommend_rejects_incomplete_answers(client: TestClient) -> None:
    response = client.post("/api/recommend", json=answers_json("CD"))

    assert response.status_code == 422
    assert "Missing: 3, 4, 5" in response.json()["detail"]["message"]


def test_recommend_rejects_a_malformed_body(client: TestClient) -> None:
    assert client.post("/api/recommend", json={"answers": []}).status_code == 422


def test_unknown_api_route_is_a_json_404(client: TestClient) -> None:
    response = client.get("/api/nope")

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "not_found"


def test_without_a_frontend_build_only_the_api_is_served(client: TestClient) -> None:
    assert client.get("/").status_code == 404
