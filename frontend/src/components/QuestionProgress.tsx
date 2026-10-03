import { cx } from "../lib/cx";
import { Bar } from "./Bar";

export interface QuestionProgressProps {
  current: number;
  total: number;
  className?: string;
}

export function QuestionProgress({ current, total, className }: QuestionProgressProps) {
  const text = `Question ${current} of ${total}`;
  return (
    <div
      className={cx("np-progress", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={text}
    >
      <p className="np-progress-label">{text}</p>
      <Bar percent={(current / total) * 100} />
    </div>
  );
}
