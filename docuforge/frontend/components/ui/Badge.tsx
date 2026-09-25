import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide",
        className
      )}
      style={{
        background: color ? `${color}1A` : "var(--accent-dim)",
        color: color ?? "var(--accent)",
        border: `1px solid ${color ? `${color}30` : "rgba(124,111,255,0.2)"}`,
      }}
    >
      {children}
    </span>
  );
}
