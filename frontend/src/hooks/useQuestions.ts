import { useCallback, useEffect, useState } from "react";
import { ApiError, getQuestions, peekQuestions } from "../services/api";
import type { Question } from "../types";

export type QuestionsState =
  | { status: "loading" }
  | { status: "ready"; questions: Question[] }
  | { status: "error"; error: ApiError };

export function useQuestions(): { state: QuestionsState; retry: () => void } {
  const [state, setState] = useState<QuestionsState>(() => {
    const cached = peekQuestions();
    return cached ? { status: "ready", questions: cached } : { status: "loading" };
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getQuestions().then(
      (questions) => !cancelled && setState({ status: "ready", questions }),
      (error: unknown) => {
        if (cancelled) return;
        const apiError = error instanceof ApiError ? error : new ApiError(0, "unknown", "Something went wrong.");
        setState({ status: "error", error: apiError });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((count) => count + 1);
  }, []);

  return { state, retry };
}
