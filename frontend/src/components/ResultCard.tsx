import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { MatchScore } from "./MatchScore";

export interface ResultCardProps {
  variant?: "primary" | "secondary";
  pathway: ReactNode;
  score: number;
  max?: number;
  scoreLabel?: ReactNode;
  /** Why it matches, in one or two plain sentences. */
  explanation?: ReactNode;
  headingLevel?: "h2" | "h3" | "h4";
  children?: ReactNode;
  className?: string;
}

export function ResultCard({
  variant = "primary",
  pathway,
  score,
  max,
  scoreLabel,
  explanation,
  headingLevel,
  children,
  className,
}: ResultCardProps) {
  const primary = variant !== "secondary";
  const Title = headingLevel ?? (primary ? "h2" : "h3");

  if (primary) {
    return (
      <article className={cx("np-result", "np-result-primary", className)}>
        <div>
          <Title className="np-result-title">{pathway}</Title>
          {explanation ? <p className="np-result-text">{explanation}</p> : null}
          {children}
        </div>
        <MatchScore
          score={score}
          max={max}
          label={scoreLabel === undefined ? "Strongest Match" : scoreLabel}
          tone="primary"
        />
      </article>
    );
  }

  return (
    <article className={cx("np-result", "np-result-secondary", className)}>
      <Title className="np-result-title">{pathway}</Title>
      <MatchScore
        score={score}
        max={max}
        label={scoreLabel === undefined ? "Pathway Match Score" : scoreLabel}
        tone="secondary"
        size="sm"
      />
      {explanation ? <p className="np-result-text">{explanation}</p> : null}
      {children}
    </article>
  );
}
