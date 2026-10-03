import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { allAnswered, questions, recommendations } from "./fixtures";
import { jsonResponse, mockFetch, renderApp, seedAnswers } from "./helpers";

const PRIVACY_NOTE =
  "Your photo is used only to generate the career visualization and does not affect your pathway recommendation.";

function baseRoutes(status: { configured: boolean; provider: string }) {
  return {
    "GET /api/questions": () => jsonResponse(questions),
    "POST /api/recommend": () => jsonResponse({ recommendations }),
    "GET /api/career-image/status": () => jsonResponse(status),
  };
}

/** A camera that hands back a stream of one 640x480 frame. */
function installFakeCamera(getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] })) {
  Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia }, configurable: true });
  Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", { get: () => 640, configurable: true });
  Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", { get: () => 480, configurable: true });
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ drawImage: vi.fn() })) as never;
  HTMLCanvasElement.prototype.toBlob = function (callback: BlobCallback) {
    callback(new Blob(["frame"], { type: "image/jpeg" }));
  };
  URL.createObjectURL = vi.fn(() => "blob:photo");
  URL.revokeObjectURL = vi.fn();
  return getUserMedia;
}

beforeEach(() => seedAnswers(allAnswered));

describe("career visualization", () => {
  it("explains the photo rule before the camera is asked for", async () => {
    const getUserMedia = installFakeCamera();
    mockFetch(baseRoutes({ configured: true, provider: "some-provider" }));

    renderApp("/results");

    expect(await screen.findByText(PRIVACY_NOTE)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "See Yourself in This Career" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enable Camera" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate Visualization" })).toBeDisabled();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("captures a photo and uploads it only when Generate Visualization is chosen", async () => {
    installFakeCamera();
    const fetchMock = mockFetch({
      ...baseRoutes({ configured: true, provider: "some-provider" }),
      "POST /api/career-image": () => jsonResponse({ image_url: "data:image/png;base64,AAA" }),
    });
    const uploads = () => fetchMock.mock.calls.filter(([, init]) => init?.method === "POST" && init.body instanceof FormData);

    renderApp("/results");
    await userEvent.click(await screen.findByRole("button", { name: "Enable Camera" }));
    await userEvent.click(await screen.findByRole("button", { name: "Capture Photo" }));

    expect(await screen.findByAltText("The photo you captured")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retake Photo" })).toBeInTheDocument();
    expect(uploads()).toHaveLength(0);

    await userEvent.click(screen.getByRole("button", { name: "Generate Visualization" }));

    const result = await screen.findByAltText("Career visualization showing you as AI Engineer / Robotics Engineer");
    expect(result).toHaveAttribute("src", "data:image/png;base64,AAA");
    expect(uploads()).toHaveLength(1);
    const form = uploads()[0]?.[1]?.body as FormData;
    expect(form.get("pathway")).toBe("Artificial Intelligence");
  });

  it("labels the development mock so nobody mistakes it for a real result", async () => {
    installFakeCamera();
    mockFetch(baseRoutes({ configured: true, provider: "mock" }));

    renderApp("/results");

    expect(await screen.findByText(/shows your photo unchanged/)).toBeInTheDocument();
  });

  it("explains a blocked camera in plain words", async () => {
    installFakeCamera(vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError")));
    mockFetch(baseRoutes({ configured: true, provider: "some-provider" }));

    renderApp("/results");
    await userEvent.click(await screen.findByRole("button", { name: "Enable Camera" }));

    expect(await screen.findByText(/Camera access was blocked/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enable Camera" })).toBeEnabled();
  });

  it("explains when the browser has no camera API", async () => {
    Object.defineProperty(navigator, "mediaDevices", { value: undefined, configurable: true });
    mockFetch(baseRoutes({ configured: true, provider: "some-provider" }));

    renderApp("/results");
    await userEvent.click(await screen.findByRole("button", { name: "Enable Camera" }));

    expect(await screen.findByText(/needs a secure \(HTTPS\) connection/)).toBeInTheDocument();
  });

  it("shows the server's message when the visualization fails", async () => {
    installFakeCamera();
    mockFetch({
      ...baseRoutes({ configured: true, provider: "some-provider" }),
      "POST /api/career-image": () =>
        jsonResponse({ detail: { code: "provider_error", message: "The visualization could not be created. Please try again." } }, 502),
    });

    renderApp("/results");
    await userEvent.click(await screen.findByRole("button", { name: "Enable Camera" }));
    await userEvent.click(await screen.findByRole("button", { name: "Capture Photo" }));
    await userEvent.click(await screen.findByRole("button", { name: "Generate Visualization" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The visualization could not be created");
    expect(screen.getByRole("button", { name: "Generate Visualization" })).toBeEnabled();
  });

  it("switches to the unavailable notice if the server reports it is not configured", async () => {
    installFakeCamera();
    mockFetch({
      ...baseRoutes({ configured: true, provider: "some-provider" }),
      "POST /api/career-image": () =>
        jsonResponse({ detail: { code: "not_configured", message: "Career visualization is not set up on this system yet." } }, 503),
    });

    renderApp("/results");
    await userEvent.click(await screen.findByRole("button", { name: "Enable Camera" }));
    await userEvent.click(await screen.findByRole("button", { name: "Capture Photo" }));
    await userEvent.click(await screen.findByRole("button", { name: "Generate Visualization" }));

    await waitFor(() => expect(screen.getByText("Career visualization is not available yet")).toBeInTheDocument());
  });
});
