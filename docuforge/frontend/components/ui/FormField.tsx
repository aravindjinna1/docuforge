import { forwardRef, type TextareaHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// ─── FormField wrapper ─────────────────────────────────────────────
interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, error, hint, required, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-xs font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
        {required && (
          <span className="ml-0.5" style={{ color: "var(--error)" }}>
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-[11px]" style={{ color: "var(--error)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => (
  <input
    ref={ref}
    className={cn("form-input", className)}
    style={error ? { borderColor: "var(--error)" } : undefined}
    {...props}
  />
));
Input.displayName = "Input";

// ─── Textarea ─────────────────────────────────────────────────────
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn("form-input resize-none", className)}
    style={error ? { borderColor: "var(--error)" } : undefined}
    {...props}
  />
));
Textarea.displayName = "Textarea";

// ─── Select ───────────────────────────────────────────────────────
export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }
>(({ className, error, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn("form-input cursor-pointer", className)}
    style={{
      ...(error ? { borderColor: "var(--error)" } : {}),
      colorScheme: "dark",
    }}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
