import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { allAnswered, degrees, pathways, questions, recommendations } from "./fixtures";
import { jsonResponse, mockFetch, renderApp, seedAnswers } from "./helpers";

const questionsRoute = { "GET /api/questions": () => jsonResponse(questions) };
const catalogueRoutes = {
  "GET /api/pathways": () => jsonResponse(pathways),
  "GET /api/degrees": () => jsonResponse({ degrees }),
};

describe("landing page", () => {
  it("shows the design system copy, the photo and its credit", () => {
    mockFetch(catalogueRoutes);
    renderApp("/");

    expect(screen.getByRole("heading", { level: 1, name: "Find Your Computing Path" })).toBeInTheDocument();
    expect(screen.getByText(/Answer five short questions/)).toBeInTheDocument();
    expect(screen.getByText("5 questions · About 1 minute")).toBeInTheDocument();
    expect(screen.getByAltText(/Students working together on laptops/)).toBeInTheDocument();
    expect(screen.getByText("Photography by Charitha Dissanayaka")).toBeInTheDocument();
    expect(screen.getByText("© NSBM Media 2026. All rights reserved.")).toBeInTheDocument();
  });

  it("starts a fresh recommendation, clearing earlier answers", async () => {
    mockFetch({ ...questionsRoute, ...catalogueRoutes });
    seedAnswers({ 1: "B" });

    renderApp("/");
    await userEvent.click(screen.getByRole("button", { name: "Start Recommendation" }));

    expect(await screen.findByText("Question text 1")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Option B1" })).not.toBeChecked();
  });

  it("offers the faculty name and a theme choice in the header", () => {
    mockFetch(catalogueRoutes);
    renderApp("/");

    expect(screen.getAllByText("Faculty of Computing").length).toBeGreaterThan(0);
    expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeInTheDocument();
  });
});

describe("landing page sections", () => {
  it("explains how it works in three numbered steps", () => {
    mockFetch(catalogueRoutes);
    renderApp("/");

    expect(screen.getByRole("heading", { level: 2, name: "How It Works" })).toBeInTheDocument();
    const steps = screen.getAllByRole("listitem").filter((item) => item.classList.contains("app-step"));
    expect(steps.map((step) => within(step).getByRole("heading", { level: 3 }).textContent)).toEqual([
      "Answer five questions",
      "See your top pathways",
      "Explore degree programmes",
    ]);
  });

  it("lists every pathway with its description and career", async () => {
    mockFetch(catalogueRoutes);
    renderApp("/");

    expect(await screen.findByRole("heading", { level: 2, name: "Pathways You Can Explore" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Data Science" })).toBeInTheDocument();
    expect(screen.getByText("Focuses on analysing data.")).toBeInTheDocument();
    expect(screen.getByText("Career focus: AI Engineer")).toBeInTheDocument();
  });

  it("summarises the universities from the degree data", async () => {
    mockFetch(catalogueRoutes);
    renderApp("/");

    expect(await screen.findByRole("heading", { level: 2, name: "Where You Can Study" })).toBeInTheDocument();
    expect(screen.getByText("2 degree programmes")).toBeInTheDocument();
    expect(screen.getAllByText("1 degree programme")).toHaveLength(2);
    expect(screen.getByText("Australia")).toBeInTheDocument();
  });

  it("quietly leaves out the data-driven sections if the server cannot be reached", async () => {
    const fetchMock = mockFetch({
      "GET /api/pathways": () => Promise.reject(new TypeError("Failed to fetch")),
      "GET /api/degrees": () => Promise.reject(new TypeError("Failed to fetch")),
    });
    renderApp("/");

    expect(screen.getByRole("heading", { level: 2, name: "How It Works" })).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("heading", { name: "Pathways You Can Explore" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Where You Can Study" })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("questionnaire", () => {
  it("keeps Continue disabled until an answer is chosen", async () => {
    mockFetch(questionsRoute);
    renderApp("/questions/1");

    const next = await screen.findByRole("button", { name: "Continue" });
    expect(next).toBeDisabled();

    await userEvent.click(screen.getByRole("radio", { name: "Option A1" }));
    expect(next).toBeEnabled();
  });

  it("moves forward and back while keeping answers", async () => {
    mockFetch(questionsRoute);
    renderApp("/questions/1");

    await userEvent.click(await screen.findByRole("radio", { name: "Option B1" }));
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Question text 2")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "Question 2 of 5");

    await userEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(await screen.findByText("Question text 1")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Option B1" })).toBeChecked();
  });

  it("goes back to the landing page from the first question", async () => {
    mockFetch(questionsRoute);
    renderApp("/questions/1");

    await userEvent.click(await screen.findByRole("button", { name: "Back" }));

    expect(await screen.findByText("Find Your Computing Path")).toBeInTheDocument();
  });

  it("does not let a deep link skip unanswered questions", async () => {
    mockFetch(questionsRoute);
    seedAnswers({ 1: "A" });

    renderApp("/questions/4");

    expect(await screen.findByText("Question text 2")).toBeInTheDocument();
  });

  it("continues to the results after the last question", async () => {
    mockFetch({ ...questionsRoute, "POST /api/recommend": () => jsonResponse({ recommendations }) });
    seedAnswers({ 1: "A", 2: "B", 3: "A", 4: "B" });

    renderApp("/questions/5");
    await userEvent.click(await screen.findByRole("radio", { name: "Option A5" }));
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("heading", { name: "Your Strongest Match" })).toBeInTheDocument();
  });

  it("shows a clear error with a retry when the questions cannot load", async () => {
    let calls = 0;
    mockFetch({
      "GET /api/questions": () => (++calls === 1 ? jsonResponse({}, 500) : jsonResponse(questions)),
    });

    renderApp("/questions/1");

    expect(await screen.findByRole("alert")).toHaveTextContent("The questions could not be loaded");
    await userEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(await screen.findByText("Question text 1")).toBeInTheDocument();
  });
});

describe("results", () => {
  const resultsRoutes = {
    ...questionsRoute,
    "GET /api/career-image/status": () => jsonResponse({ configured: false, provider: "none" }),
  };

  it("shows the strongest match, its degrees and the other matches", async () => {
    mockFetch({ ...resultsRoutes, "POST /api/recommend": () => jsonResponse({ recommendations }) });
    seedAnswers(allAnswered);

    renderApp("/results");

    expect(await screen.findByRole("heading", { level: 1, name: "Your Strongest Match" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Artificial Intelligence" })).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("You showed interest in intelligent and automated systems.")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Available Degree Programmes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "BSc (Hons) Artificial Intelligence" })).toBeInTheDocument();
    expect(screen.getByText("Plymouth University · United Kingdom")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Other Matches" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Data Science" })).toBeInTheDocument();
    expect(screen.getByText("Strong Match · Pathway Match Score")).toBeInTheDocument();
    expect(screen.getByText("Related Match · Pathway Match Score")).toBeInTheDocument();
    expect(screen.getByText("NSBM Green University")).toBeInTheDocument();
  });

  it("says the visualization is not available when no image provider is set up", async () => {
    mockFetch({ ...resultsRoutes, "POST /api/recommend": () => jsonResponse({ recommendations }) });
    seedAnswers(allAnswered);

    renderApp("/results");

    expect(await screen.findByText("Career visualization is not available yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enable Camera" })).not.toBeInTheDocument();
  });

  it("shows plain loading copy while the matches are calculated", async () => {
    mockFetch({ ...resultsRoutes, "POST /api/recommend": () => new Promise<Response>(() => {}) });
    seedAnswers(allAnswered);

    renderApp("/results");

    expect(await screen.findByRole("status")).toHaveTextContent("Calculating your matches...");
  });

  it("offers a retry when the recommendation request fails", async () => {
    let calls = 0;
    mockFetch({
      ...resultsRoutes,
      "POST /api/recommend": () => (++calls === 1 ? jsonResponse({}, 500) : jsonResponse({ recommendations })),
    });
    seedAnswers(allAnswered);

    renderApp("/results");
    expect(await screen.findByRole("alert")).toHaveTextContent("Your results could not be loaded");

    await userEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(await screen.findByRole("heading", { name: "Your Strongest Match" })).toBeInTheDocument();
  });

  it("sends people with no answers back to the start", async () => {
    mockFetch(questionsRoute);

    renderApp("/results");

    expect(await screen.findByText("Find Your Computing Path")).toBeInTheDocument();
  });

  it("sends people with some answers to the first unanswered question", async () => {
    mockFetch(questionsRoute);
    seedAnswers({ 1: "A", 2: "B" });

    renderApp("/results");

    expect(await screen.findByText("Question text 3")).toBeInTheDocument();
  });

  it("starts again with cleared answers", async () => {
    mockFetch({ ...resultsRoutes, "POST /api/recommend": () => jsonResponse({ recommendations }) });
    seedAnswers(allAnswered);

    renderApp("/results");
    await userEvent.click(await screen.findByRole("button", { name: "Start Again" }));

    expect(await screen.findByText("Question text 1")).toBeInTheDocument();
    await waitFor(() => expect(sessionStorage.getItem("np.answers")).toBe("{}"));
  });
});
