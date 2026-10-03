import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CareerVisualization } from "../components/CareerVisualization";
import { Button, DegreeCard, LoadingState, Notice, ResultCard } from "../components";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useQuestions } from "../hooks/useQuestions";
import { ApiError, recommend } from "../services/api";
import { useAnswers } from "../state/answers";
import type { Degree, Recommendation } from "../types";

type ResultState =
  | { status: "loading" }
  | { status: "ready"; recommendations: Recommendation[] }
  | { status: "error"; error: ApiError };

const SCORE_LABEL = "Pathway Match Score";

export function Results() {
  const navigate = useNavigate();
  const { answers, reset } = useAnswers();
  const { state: questionsState, retry: retryQuestions } = useQuestions();
  const [result, setResult] = useState<ResultState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useDocumentTitle("Your Strongest Match");

  const questions = questionsState.status === "ready" ? questionsState.questions : null;
  const firstUnanswered = questions?.findIndex((question) => answers[question.id] === undefined) ?? -1;
  const complete = questions !== null && firstUnanswered === -1;

  useEffect(() => {
    if (!complete) return;
    let cancelled = false;
    setResult({ status: "loading" });
    recommend(answers).then(
      (recommendations) => !cancelled && setResult({ status: "ready", recommendations }),
      (error: unknown) => {
        if (cancelled) return;
        const apiError = error instanceof ApiError ? error : new ApiError(0, "unknown", "Something went wrong.");
        setResult({ status: "error", error: apiError });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [complete, answers, attempt]);

  useEffect(() => {
    if (result.status === "ready") headingRef.current?.focus();
  }, [result.status]);

  function startAgain() {
    reset();
    navigate("/questions/1");
  }

  if (questionsState.status === "error") {
    return (
      <div className="app-page app-stack">
        <Notice tone="danger" title="Your results could not be loaded">
          {questionsState.error.message}
        </Notice>
        <div>
          <Button variant="secondary" onClick={retryQuestions}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  if (questions && firstUnanswered !== -1) {
    // Opened without finishing: send the person to the question they still owe.
    const target = firstUnanswered === 0 && Object.keys(answers).length === 0 ? "/" : `/questions/${firstUnanswered + 1}`;
    return <Navigate to={target} replace />;
  }
  if (!questions || result.status === "loading") {
    return (
      <div className="app-page">
        <LoadingState message="Calculating your matches..." />
      </div>
    );
  }
  if (result.status === "error") {
    const wrongAnswers = result.error.code === "invalid_answers";
    return (
      <div className="app-page app-stack">
        <Notice tone="danger" title="Your results could not be loaded">
          {result.error.message}
        </Notice>
        <div className="app-actions-inline">
          {wrongAnswers ? null : (
            <Button variant="secondary" onClick={() => setAttempt((count) => count + 1)}>
              Try Again
            </Button>
          )}
          <Button onClick={startAgain}>Start Again</Button>
        </div>
      </div>
    );
  }

  const [primary, ...others] = result.recommendations;
  if (!primary) {
    return (
      <div className="app-page app-stack">
        <Notice tone="warning" title="No matches found">
          Your answers did not produce a match. Please start again and choose the options that interest you most.
        </Notice>
        <div>
          <Button onClick={startAgain}>Start Again</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app-page app-results">
        <section className="app-section">
          <h1 className="section-title app-section-title" tabIndex={-1} ref={headingRef}>
            Your Strongest Match
          </h1>
          <ResultCard
            pathway={primary.pathway}
            score={primary.display_score}
            scoreLabel={SCORE_LABEL}
            explanation={primary.summary}
          >
            <p className="app-why-label">Why this matched</p>
            <ul className="app-reasons">
              {primary.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </ResultCard>
        </section>

        <section className="app-section" aria-labelledby="degrees-title">
          <h2 id="degrees-title" className="section-title app-section-title">
            Available Degree Programmes
          </h2>
          <div className="np-grid-2">
            {primary.degrees.map((degree) => (
              <DegreeCard key={degree.id} title={degree.name} university={degree.university} country={degree.country} />
            ))}
          </div>
        </section>

        {others.length > 0 ? (
          <section className="app-section" aria-labelledby="others-title">
            <h2 id="others-title" className="section-title app-section-title">
              Other Matches
            </h2>
            <div className="np-grid-2">
              {others.map((match) => (
                <ResultCard
                  key={match.pathway_id}
                  variant="secondary"
                  pathway={match.pathway}
                  score={match.display_score}
                  scoreLabel={`${match.label} · ${SCORE_LABEL}`}
                  explanation={match.reasons[0]}
                >
                  <DegreeList degrees={match.degrees} />
                </ResultCard>
              ))}
            </div>
          </section>
        ) : null}

        <div className="app-section">
          <Button variant="secondary" onClick={startAgain}>
            Start Again
          </Button>
        </div>
      </div>

      <section className="app-band" aria-labelledby="career-title">
        <div className="app-page app-career">
          <CareerVisualization pathway={primary.pathway} career={primary.career} />
        </div>
      </section>
    </>
  );
}

/** Compact degree list for the secondary cards, where full DegreeCards would be too heavy. */
function DegreeList({ degrees }: { degrees: Degree[] }) {
  return (
    <div className="app-degree-list">
      <p className="app-why-label">Available Degree Programmes</p>
      <ul>
        {degrees.map((degree) => (
          <li key={degree.id}>
            <span className="app-degree-name">{degree.name}</span>
            <span className="app-degree-meta">{[degree.university, degree.country].filter(Boolean).join(" · ")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
