import { cx } from "../lib/cx";

/** The progress / score track shared by QuestionProgress and MatchScore. Decorative: the value is always printed beside it. */
export function Bar({ percent, tone }: { percent: number; tone?: "primary" | "secondary" }) {
  const width = Math.max(0, Math.min(100, percent));
  return (
    <div className="np-track" aria-hidden="true">
      <div className={cx("np-fill", tone === "secondary" && "np-fill-blue")} style={{ width: `${width}%` }} />
    </div>
  );
}
