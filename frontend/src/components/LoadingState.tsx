import { cx } from "../lib/cx";

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Calculating your matches...", className }: LoadingStateProps) {
  return (
    <div className={cx("np-loading", className)} role="status" aria-live="polite">
      <span className="np-spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
