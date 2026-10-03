import { useEffect, useRef, type FormEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { AnswerOption, Button, LoadingState, Notice, QuestionProgress } from "../components";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useQuestions } from "../hooks/useQuestions";
import { useAnswers } from "../state/answers";

export function Questionnaire() {
  const { number } = useParams();
  const position = Number(number);
  const navigate = useNavigate();
  const { state, retry } = useQuestions();
  const { answers, setAnswer } = useAnswers();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useDocumentTitle(`Question ${Number.isInteger(position) ? position : ""}`.trim());

  // Move focus to the new question so screen readers announce it.
  useEffect(() => {
    headingRef.current?.focus();
  }, [position, state.status]);

  if (state.status === "loading") {
    return (
      <div className="app-page">
        <LoadingState message="Loading the questions..." />
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="app-page app-question-panel">
        <Notice tone="danger" title="The questions could not be loaded">
          {state.error.message}
        </Notice>
        <div>
          <Button variant="secondary" onClick={retry}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { questions } = state;
  const total = questions.length;
  if (!Number.isInteger(position) || position < 1 || position > total) return <Navigate to="/" replace />;

  // Deep links cannot skip ahead of the first unanswered question.
  const firstUnanswered = questions.findIndex((candidate) => answers[candidate.id] === undefined) + 1;
  if (firstUnanswered > 0 && position > firstUnanswered) {
    return <Navigate to={`/questions/${firstUnanswered}`} replace />;
  }

  const question = questions[position - 1];
  if (!question) return <Navigate to="/" replace />;
  const selected = answers[question.id];

  function goBack() {
    navigate(position > 1 ? `/questions/${position - 1}` : "/");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (selected === undefined) return;
    navigate(position < total ? `/questions/${position + 1}` : "/results");
  }

  return (
    <form className="app-page app-question-panel" onSubmit={onSubmit}>
      <QuestionProgress current={position} total={total} />
      <h1 id="question-title" className="question app-question-title" tabIndex={-1} ref={headingRef}>
        {question.text}
      </h1>
      <div className="app-answers" role="radiogroup" aria-labelledby="question-title">
        {question.options.map((option) => (
          <AnswerOption
            key={option.id}
            name={`question-${question.id}`}
            value={option.id}
            label={option.text}
            selected={selected === option.id}
            onSelect={(value) => setAnswer(question.id, value)}
          />
        ))}
      </div>
      <div className="app-actions">
        <Button variant="secondary" onClick={goBack}>
          Back
        </Button>
        <Button type="submit" disabled={selected === undefined}>
          Continue
        </Button>
      </div>
    </form>
  );
}
