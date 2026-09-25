"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FilePlus2,
  FileText,
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { apiGetRecent, apiGetPreferences } from "@/lib/api";
import { apiAuthMe } from "@/lib/auth";

import type { HistoryItem, PersonalizationData } from "@/types";
import { DOC_TYPE_MAP, DOC_TYPES } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import { AuthButtons } from "@/components/auth/AuthButtons";
import ErrorBoundary from "@/components/common/ErrorBoundary";

type DashboardState = {
  recent: HistoryItem[];
  prefs: PersonalizationData | null;
  loading: boolean;
  loggedIn: boolean | null;
};

export default function DashboardPage() {
  const [recent, setRecent] = useState<HistoryItem[]>([]);
  const [prefs, setPrefs] = useState<PersonalizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await apiAuthMe();
        setLoggedIn(me.loggedIn);
      } catch {
        setLoggedIn(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (loggedIn !== true) {
      setLoading(false);
      return;
    }

    Promise.all([
      apiGetRecent(8).catch(() => []),
      apiGetPreferences().catch(() => null),
    ]).then(([r, p]) => {
      setRecent(r);
      setPrefs(p);
      setLoading(false);
    });
  }, [loggedIn]);

  const totalDocs = prefs
    ? Object.values(prefs.documentTypeCounts).reduce((a, b) => a + b, 0)
    : 0;

  const suggestedTypes = (prefs?.suggestedTypes ?? [])
    .slice(0, 3)
    .map((id) => DOC_TYPE_MAP[id])
    .filter(Boolean);

  return (
    <ErrorBoundary>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* ── Hero Banner ─────────────────────────────────────── */}
        <div
          className="relative rounded-2xl overflow-hidden p-7"
          style={{
            background:
              "linear-gradient(135deg, rgba(124,111,255,0.18) 0%, rgba(90,80,220,0.08) 60%, transparent 100%)",
            border: "1px solid rgba(124,111,255,0.25)",
          }}
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(124,111,255,0.12) 0%, transparent 70%)",
              transform: "translate(30%, -30%)",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(124,111,255,0.15)",
                  color: "var(--text-accent)",
                  border: "1px solid rgba(124,111,255,0.3)",
                }}
              >
                <Sparkles size={11} />
                AI-Powered
              </div>
            </div>
            <h2
              className="text-2xl font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Professional documents,
              <span style={{ color: "var(--accent)" }}> written in seconds.</span>
            </h2>
            <p
              className="text-sm mb-5 max-w-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              DocuCraft generates ready-to-send emails, cover letters, leave
              requests, resignations, and more — using your inputs and your
              preferred style.
            </p>

            <div className="flex items-center gap-3">
              <Link
                href={loggedIn ? "/generate" : "/login"}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--accent)" }}
              >
                <FilePlus2 size={15} />
                Generate a document
              </Link>
              <div className="flex items-center gap-2">
                {loggedIn === false ? (
                  <AuthButtons />
                ) : loggedIn === true ? (
                  <AuthButtons />
                ) : (
                  <div
                    className="h-10 w-48 rounded-lg"
                    style={{ background: "var(--surface-raised)" }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ───────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Documents generated"
            value={loading ? "—" : String(totalDocs)}
            icon={<FileText size={16} />}
            color="var(--accent)"
            loading={loading}
          />
          <StatCard
            label="Most used type"
            value={
              loading
                ? "—"
                : prefs?.mostUsedDocumentType
                  ? DOC_TYPE_MAP[prefs.mostUsedDocumentType]?.shortLabel ?? "—"
                  : "None yet"
            }
            icon={<TrendingUp size={16} />}
            color="var(--success)"
            loading={loading}
          />
          <StatCard
            label="Preferred tone"
            value={
              loading
                ? "—"
                : prefs?.preferredTone
                  ? prefs.preferredTone.charAt(0).toUpperCase() +
                    prefs.preferredTone.slice(1)
                  : "Not set"
            }
            icon={<BarChart3 size={16} />}
            color="var(--warning)"
            loading={loading}
          />
        </div>

        {/* ── Suggested doc types (personalized) ──────────────── */}
        {!loading && suggestedTypes.length > 0 && (
          <section>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Suggested for you
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {suggestedTypes.map((cfg) => (
                <Link
                  key={cfg.id}
                  href="/generate"
                  className="flex items-center gap-3 p-3 rounded-xl border transition-all group"
                  style={{
                    background: "var(--surface-card)",
                    borderColor: "var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      cfg.accentColor;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "var(--border-subtle)";
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
                    }}
                  >
                    {cfg.icon}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {cfg.shortLabel}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {cfg.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Document type quick grid ─────────────────────────── */}
        {(!prefs?.suggestedTypes?.length || loading) && (
          <section>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Document types
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {DOC_TYPES.map((cfg) => (
                <Link
                  key={cfg.id}
                  href="/generate"
                  className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                  style={{
                    background: "var(--surface-card)",
                    borderColor: "var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      cfg.accentColor;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "var(--border-subtle)";
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
                    }}
                  >
                    {cfg.icon}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {cfg.shortLabel}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Recent documents ─────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              Recent documents
            </h3>
            {loggedIn === true ? (
              <Link
                href="/history"
                className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
                style={{ color: "var(--accent)" }}
              >
                View all <ArrowRight size={12} />
              </Link>
            ) : (
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Login to see history
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl skeleton" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-1.5">
              {recent.map((doc) => (
                <RecentDocRow key={doc.documentId} doc={doc} />
              ))}
            </div>
          )}
        </section>
      </div>
    </ErrorBoundary>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-center gap-2 mb-3" style={{ color }}>
        {icon}
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
      </div>
      {loading ? (
        <div className="h-7 w-20 skeleton rounded-md" />
      ) : (
        <p className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          {value}
        </p>
      )}
    </div>
  );
}

function RecentDocRow({ doc }: { doc: HistoryItem }) {
  const cfg = DOC_TYPE_MAP[doc.documentType];

  return (
    <Link
      href="/history"
      className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group"
      style={{
        background: "var(--surface-card)",
        borderColor: "var(--border-subtle)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "var(--border-emphasis)";
        (e.currentTarget as HTMLElement).style.background =
          "var(--surface-raised)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "var(--border-subtle)";
        (e.currentTarget as HTMLElement).style.background =
          "var(--surface-card)";
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
        style={{
          background: cfg
            ? `linear-gradient(135deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`
            : "var(--surface-active)",
        }}
      >
        {cfg?.icon ?? "📄"}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
          {doc.title}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {cfg?.shortLabel ?? doc.documentType} · {doc.wordCount} words
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {timeAgo(doc.createdAt)}
        </span>
        <ArrowRight
          size={14}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "var(--text-muted)" }}
        />
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed text-center"
      style={{
        borderColor: "var(--border-default)",
        background: "var(--surface-card)",
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: "var(--surface-raised)" }}
      >
        <FileText size={22} style={{ color: "var(--text-muted)" }} />
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
        No documents yet
      </p>
      <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
        Generate your first document to see it here.
      </p>
      <Link
        href="/generate"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
        style={{ background: "var(--accent)" }}
      >
        <FilePlus2 size={14} />
        Get started
      </Link>
    </div>
  );
}

