import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Answers } from "../types";

const STORAGE_KEY = "np.answers";

interface AnswersContextValue {
  answers: Answers;
  setAnswer: (questionId: number, optionId: string) => void;
  reset: () => void;
}

const AnswersContext = createContext<AnswersContextValue | null>(null);

/** Answers survive a refresh within the tab but are never stored beyond the session. */
function load(): Answers {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const answers: Answers = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && Number.isInteger(Number(key))) answers[Number(key)] = value;
    }
    return answers;
  } catch {
    return {};
  }
}

export function AnswersProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<Answers>(load);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // Storage can be unavailable; answers then live only in memory.
    }
  }, [answers]);

  const setAnswer = useCallback((questionId: number, optionId: string) => {
    setAnswers((previous) => ({ ...previous, [questionId]: optionId }));
  }, []);
  const reset = useCallback(() => setAnswers({}), []);

  const value = useMemo(() => ({ answers, setAnswer, reset }), [answers, setAnswer, reset]);
  return <AnswersContext.Provider value={value}>{children}</AnswersContext.Provider>;
}

export function useAnswers(): AnswersContextValue {
  const context = useContext(AnswersContext);
  if (!context) throw new Error("useAnswers must be used inside <AnswersProvider>");
  return context;
}
