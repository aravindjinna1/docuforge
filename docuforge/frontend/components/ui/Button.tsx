import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, className, children, disabled, ...props },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants: Record<string, string> = {
      primary:
        "text-white",
      secondary:
        "text-[var(--text-secondary)] border border-[var(--border-default)] hover:border-[var(--border-emphasis)] hover:text-[var(--text-primary)]",
      ghost:
        "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
      danger:
        "text-white",
    };

    const sizes: Record<string, string> = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-2.5 text-sm",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        style={
          variant === "primary"
            ? { background: "var(--accent)" }
            : variant === "danger"
            ? { background: "var(--error)" }
            : variant === "secondary"
            ? { background: "var(--surface-raised)" }
            : undefined
        }
        {...props}
      >
        {loading && (
          <span
            className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent spin"
          />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
