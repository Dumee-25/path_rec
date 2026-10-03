import type { ReactNode } from "react";
import { cx } from "../lib/cx";

export interface MediaFrameProps {
  label?: string;
  /** Shown when there is no media yet, e.g. "Camera preview appears here". */
  placeholder?: ReactNode;
  /** An <img>, <video> or <canvas>; fills the 4:3 frame. */
  children?: ReactNode;
  /** Buttons under the frame: Capture Photo, Retake Photo, Generate Visualization. */
  actions?: ReactNode;
  className?: string;
}

export function MediaFrame({ label, placeholder, children, actions, className }: MediaFrameProps) {
  const placeholderText = typeof placeholder === "string" ? placeholder : undefined;
  return (
    <section className={cx("np-media", className)} aria-label={label}>
      {label ? <p className="np-media-label">{label}</p> : null}
      <div
        className="np-media-frame"
        role={children ? undefined : "img"}
        aria-label={children ? undefined : placeholderText}
      >
        {children ?? placeholder}
      </div>
      {actions ? <div className="np-media-actions">{actions}</div> : null}
    </section>
  );
}
