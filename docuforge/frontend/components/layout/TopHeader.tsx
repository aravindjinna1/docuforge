"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { FilePlus2, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

const PAGE_META: Record<string, { title: string; crumb?: string }> = {
  "/": { title: "Dashboard" },
  "/generate": { title: "Generate Document", crumb: "New" },
  "/history": { title: "History" },
  "/templates": { title: "Templates" },
  "/settings": { title: "Settings" },
};

export function TopHeader() {
  const pathname = usePathname();
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const meta = PAGE_META[pathname] ?? { title: "DocuCraft" };

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    fetch(`${API}/health`, { signal: AbortSignal.timeout(3000) })
      .then((r) => setApiOk(r.ok))
      .catch(() => setApiOk(false));
  }, []);

  return (
    <header
      className="flex items-center justify-between px-4 sm:px-6 shrink-0"
      style={{
        height: 56,
        background: "var(--surface-card)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      {/* Page title */}
      <div>
        <h1
          className="font-semibold text-sm"
          style={{ color: "var(--text-primary)" }}
        >
          {meta.title}
        </h1>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* API status indicator */}
        {apiOk !== null && (
          <div
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md"
            style={{
              background: apiOk ? "var(--success-dim, rgba(16,185,129,0.1))" : "var(--error-dim, rgba(239,68,68,0.1))",
              color: apiOk ? "var(--success)" : "var(--error)",
            }}
          >
            {apiOk ? <Wifi size={11} /> : <WifiOff size={11} />}
            <span>{apiOk ? "API connected" : "API offline"}</span>
          </div>
        )}

        {pathname !== "/generate" && (
          <Link
            href="/generate"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            <FilePlus2 size={14} />
            <span>New Document</span>
          </Link>
        )}
      </div>
    </header>
  );
}
