import type { ButtonHTMLAttributes } from "react";
import { cx } from "../lib/cx";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = NSBM green with on-green label, once per view. secondary = neutral outline. */
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
}

export function Button({ variant = "primary", fullWidth, className, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={cx("np-btn", `np-btn-${variant}`, fullWidth && "np-btn-full", className)}
    />
  );
}
