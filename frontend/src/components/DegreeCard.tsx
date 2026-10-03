import type { ReactNode } from "react";
import { cx } from "../lib/cx";

export interface DegreeCardProps {
  title: ReactNode;
  university?: string;
  country?: string | null;
  headingLevel?: "h3" | "h4";
  children?: ReactNode;
  className?: string;
}

export function DegreeCard({ title, university, country, headingLevel: Title = "h3", children, className }: DegreeCardProps) {
  const meta = [university, country].filter(Boolean).join(" · ");
  return (
    <article className={cx("np-degree", className)}>
      <Title className="np-degree-title">{title}</Title>
      {meta ? <p className="np-degree-meta">{meta}</p> : null}
      {children}
    </article>
  );
}
