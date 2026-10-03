import type { ReactNode } from "react";
import { cx } from "../lib/cx";

export interface NoticeProps {
  tone?: "info" | "warning" | "danger";
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Notice({ tone = "info", title, children, className }: NoticeProps) {
  return (
    <div className={cx("np-notice", `np-notice-${tone}`, className)} role={tone === "danger" ? "alert" : "note"}>
      {title ? <strong className="np-notice-title">{title}</strong> : null}
      {children}
    </div>
  );
}
