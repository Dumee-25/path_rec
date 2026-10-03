import type { ReactNode } from "react";
import { cx } from "../lib/cx";

export interface AnswerOptionProps {
  /** Shared radio group name for one question. */
  name: string;
  value: string;
  label?: ReactNode;
  children?: ReactNode;
  selected?: boolean;
  onSelect?: (value: string) => void;
  className?: string;
}

export function AnswerOption({ name, value, label, children, selected = false, onSelect, className }: AnswerOptionProps) {
  return (
    <label className={cx("np-answer", className)} data-selected={selected ? "true" : "false"}>
      <input type="radio" name={name} value={value} checked={selected} onChange={() => onSelect?.(value)} />
      <span className="np-marker" aria-hidden="true" />
      <span>{label ?? children}</span>
    </label>
  );
}
