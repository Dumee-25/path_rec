import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { Bar } from "./Bar";

export interface MatchScoreProps {
  score: number;
  /** Default 100. */
  max?: number;
  /** primary = green bar (strongest match); secondary = blue bar (other matches). */
  tone?: "primary" | "secondary";
  size?: "lg" | "sm";
  /** Default "Pathway Match Score". Pass null to hide. */
  label?: ReactNode;
  className?: string;
}

export function MatchScore({ score, max = 100, tone = "primary", size, label = "Pathway Match Score", className }: MatchScoreProps) {
  const resolvedSize = size ?? (tone === "secondary" ? "sm" : "lg");
  return (
    <div className={cx("np-score", `np-score-${resolvedSize}`, className)}>
      <p className="np-score-num">
        {score}
        <span>{`/ ${max}`}</span>
      </p>
      {label ? <p className="np-score-label">{label}</p> : null}
      <Bar percent={(score / max) * 100} tone={tone} />
    </div>
  );
}
