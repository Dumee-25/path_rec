import { describe, expect, it } from "vitest";
import { ApiError, createCareerImage, recommend } from "../services/api";
import { jsonResponse, mockFetch } from "./helpers";

describe("api client", () => {
  it("sends answers in the shape the backend expects", async () => {
    const fetchMock = mockFetch({
      "POST /api/recommend": () => jsonResponse({ recommendations: [] }),
    });

    await recommend({ 1: "C", 2: "D" });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(init?.body))).toEqual({
      answers: [
        { question_id: 1, option_id: "C" },
        { question_id: 2, option_id: "D" },
      ],
    });
  });

  it("turns a backend error into an ApiError with its code and message", async () => {
    mockFetch({
      "POST /api/recommend": () =>
        jsonResponse({ detail: { code: "invalid_answers", message: "Please answer every question." } }, 422),
    });

    const error = await recommend({}).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, code: "invalid_answers", message: "Please answer every question." });
  });

  it("falls back to a generic message for an unexpected error body", async () => {
    mockFetch({ "POST /api/recommend": () => jsonResponse({ detail: [{ msg: "bad" }] }, 422) });

    const error = await recommend({}).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: "unknown", message: "Something went wrong. Please try again." });
  });

  it("reports an unreachable server as a network error", async () => {
    mockFetch({ "POST /api/recommend": () => Promise.reject(new TypeError("Failed to fetch")) });

    const error = await recommend({}).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ status: 0, code: "network" });
  });

  it("uploads the photo and pathway as form data", async () => {
    const fetchMock = mockFetch({
      "POST /api/career-image": () => jsonResponse({ image_url: "data:image/png;base64,AAA" }),
    });

    const url = await createCareerImage(new Blob(["x"], { type: "image/jpeg" }), "Data Science");

    expect(url).toBe("data:image/png;base64,AAA");
    const body = fetchMock.mock.calls[0]?.[1]?.body as FormData;
    expect(body.get("pathway")).toBe("Data Science");
    expect(body.get("photo")).toBeInstanceOf(Blob);
  });
});
