"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

export function RequireAuthNotice({
  on,
  message = "Please login to create AI documents.",
}: {
  on?: boolean;
  message?: string;
}) {
  if (!on) return null;
  return (
    <div
      className="mb-4 p-4 rounded-xl"
      style={{ background: "rgba(124,111,255,0.10)", border: "1px solid rgba(124,111,255,0.22)", color: "var(--text-secondary)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(124,111,255,0.16)", border: "1px solid rgba(124,111,255,0.25)" }}
        >
          <Lock size={16} style={{ color: "var(--accent)" }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Login required
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {message}
          </p>
          <div className="mt-3 flex gap-3">
            <Link href="/login" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "var(--accent)", color: "white" }}>
              Login
            </Link>
            <Link href="/register" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

