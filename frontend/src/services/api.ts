import type { Answers, CareerImageStatus, Pathway, Question, Recommendation } from "../types";

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

/** A failed API call. `code` is the backend's stable error code, or "network" / "unknown". */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body: unknown = await response.json();
    const detail = (body as { detail?: { code?: unknown; message?: unknown } }).detail;
    if (detail && typeof detail.code === "string") {
      const message = typeof detail.message === "string" ? detail.message : GENERIC_MESSAGE;
      return new ApiError(response.status, detail.code, message);
    }
  } catch {
    // Not JSON; fall through to the generic error.
  }
  return new ApiError(response.status, "unknown", GENERIC_MESSAGE);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new ApiError(0, "network", "Could not reach the server. Check the connection and try again.");
  }
  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as T;
}

let questionsCache: Question[] | null = null;
let questionsPromise: Promise<Question[]> | null = null;

/** The questions already loaded, if any, so screens can render without a loading flash. */
export function peekQuestions(): Question[] | null {
  return questionsCache;
}

/** The questionnaire never changes while the app is open, so it is fetched once. */
export function getQuestions(): Promise<Question[]> {
  questionsPromise ??= request<Question[]>("/api/questions")
    .then((questions) => {
      questionsCache = questions;
      return questions;
    })
    .catch((error: unknown) => {
      questionsPromise = null;
      throw error;
    });
  return questionsPromise;
}

export function clearQuestionsCache(): void {
  questionsCache = null;
  questionsPromise = null;
}

export function getPathways(): Promise<Pathway[]> {
  return request<Pathway[]>("/api/pathways");
}

export async function recommend(answers: Answers): Promise<Recommendation[]> {
  const body = {
    answers: Object.entries(answers).map(([questionId, optionId]) => ({
      question_id: Number(questionId),
      option_id: optionId,
    })),
  };
  const result = await request<{ recommendations: Recommendation[] }>("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return result.recommendations;
}

export function getCareerImageStatus(): Promise<CareerImageStatus> {
  return request<CareerImageStatus>("/api/career-image/status");
}

/** Sends the photo only when called, which the UI does only after "Generate Visualization". */
export async function createCareerImage(photo: Blob, pathway: string): Promise<string> {
  const form = new FormData();
  form.append("photo", photo, "photo.jpg");
  form.append("pathway", pathway);
  const result = await request<{ image_url: string }>("/api/career-image", {
    method: "POST",
    body: form,
  });
  return result.image_url;
}
