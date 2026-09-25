"use client";

import { useState, useEffect } from "react";
import { Check, Save, ExternalLink } from "lucide-react";
import { apiGetPreferences, apiUpdatePreferences, isApiAuthError } from "@/lib/api";
import type { PersonalizationData, ToneType } from "@/types";
import { TONE_OPTIONS, DOC_TYPE_MAP } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { useAuthMe } from "@/components/auth/useAuthMe";
import { RequireAuthNotice } from "@/components/auth/RequireAuthNotice";

export default function SettingsPage() {
  const { loading: authLoading, loggedIn } = useAuthMe();

  const [prefs, setPrefs] = useState<PersonalizationData | null>(null);

  const [selectedTone, setSelectedTone] = useState<ToneType>("professional");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (loggedIn === false) {
      setAuthRequired(true);
      setLoading(false);
      return;
    }

    setAuthRequired(false);
    setLoading(true);
    apiGetPreferences()
      .then((p) => {
        setPrefs(p);
        setSelectedTone(p.preferredTone);
      })
      .catch((e: unknown) => {
        if (isApiAuthError(e)) {
          setAuthRequired(true);
          return;
        }
        console.error(e);
      })
      .finally(() => setLoading(false));
  }, [authLoading, loggedIn]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiUpdatePreferences(selectedTone);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      if (isApiAuthError(e)) {
        setAuthRequired(true);
        return;
      }
      console.error("Save failed:", e);
    } finally {
      setSaving(false);
    }
  };

  const totalDocs = prefs
    ? Object.values(prefs.documentTypeCounts).reduce((a, b) => a + b, 0)
    : 0;

  if (!authLoading && (loggedIn === false || authRequired)) {
    return (
      <div className="max-w-md mx-auto">
        <RequireAuthNotice on message="Please login to update your preferences." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Preferences ───────────────────────────────────── */}

      <section
        className="rounded-xl p-6"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <h2
          className="text-sm font-semibold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Writing Preferences
        </h2>
        <p
          className="text-xs mb-5"
          style={{ color: "var(--text-secondary)" }}
        >
          These preferences are stored locally and used to pre-fill forms and
          influence AI prompts.
        </p>

        <div className="space-y-4">
          <div>
            <label
              className="block text-xs font-medium mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Default Tone
            </label>
            <div className="grid grid-cols-1 gap-2">
              {TONE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedTone(opt.value)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all"
                  style={{
                    background:
                      selectedTone === opt.value
                        ? "var(--accent-dim, rgba(124,111,255,0.12))"
                        : "var(--surface-base)",
                    borderColor:
                      selectedTone === opt.value
                        ? "var(--accent)"
                        : "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{
                      borderColor:
                        selectedTone === opt.value
                          ? "var(--accent)"
                          : "var(--border-emphasis)",
                      background:
                        selectedTone === opt.value
                          ? "var(--accent)"
                          : "transparent",
                    }}
                  >
                    {selectedTone === opt.value && (
                      <Check size={9} className="text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {opt.hint}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={saving}
          >
            {saved ? (
              <>
                <Check size={14} />
                Saved
              </>
            ) : (
              <>
                <Save size={14} />
                Save preferences
              </>
            )}
          </Button>
          {saved && (
            <span
              className="text-xs fade-in"
              style={{ color: "var(--success)" }}
            >
              Preferences updated successfully.
            </span>
          )}
        </div>
      </section>

      {/* ── Usage stats ────────────────────────────────────── */}
      {!loading && prefs && (
        <section
          className="rounded-xl p-6"
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <h2
            className="text-sm font-semibold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Usage
          </h2>
          <p
            className="text-xs mb-5"
            style={{ color: "var(--text-secondary)" }}
          >
            Your document generation history, derived from the database.
          </p>

          <div className="space-y-3">
            <StatRow
              label="Total documents generated"
              value={String(totalDocs)}
            />
            <StatRow
              label="Most used document type"
              value={
                prefs.mostUsedDocumentType
                  ? DOC_TYPE_MAP[prefs.mostUsedDocumentType]?.label ?? "—"
                  : "None yet"
              }
            />
            <StatRow
              label="Preferred tone (inferred)"
              value={
                prefs.preferredTone.charAt(0).toUpperCase() +
                prefs.preferredTone.slice(1)
              }
            />
            {prefs.commonNames.length > 0 && (
              <StatRow
                label="Common names (auto-detected)"
                value={prefs.commonNames.slice(0, 4).join(", ")}
              />
            )}
            {prefs.commonCompanies.length > 0 && (
              <StatRow
                label="Common companies (auto-detected)"
                value={prefs.commonCompanies.slice(0, 4).join(", ")}
              />
            )}
          </div>

          {totalDocs > 0 && (
            <div className="mt-5">
              <p
                className="text-xs font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Documents by type
              </p>
              <div className="space-y-2">
                {Object.entries(prefs.documentTypeCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const cfg = DOC_TYPE_MAP[type as keyof typeof DOC_TYPE_MAP];
                    const pct = Math.round((count / totalDocs) * 100);
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {cfg?.shortLabel ?? type}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {count}
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: "var(--surface-base)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: cfg?.accentColor ?? "var(--accent)",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── API configuration ───────────────────────────────── */}
      <section
        className="rounded-xl p-6"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <h2
          className="text-sm font-semibold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          AI Provider Configuration
        </h2>
        <p
          className="text-xs mb-5"
          style={{ color: "var(--text-secondary)" }}
        >
          DocuCraft uses free-tier AI APIs for document generation. Configure
          at least one provider in your backend <code className="px-1 py-0.5 rounded text-[11px]"
            style={{ background: "var(--surface-base)", color: "var(--text-accent)" }}>
            .env
          </code> file.
        </p>

        <div className="space-y-3">
          <ProviderCard
            name="Google Gemini"
            model="gemini-1.5-flash"
            envKey="GEMINI_API_KEY"
            link="https://aistudio.google.com/app/apikey"
            tier="Free tier: 60 requests/min"
            primary
          />
          <ProviderCard
            name="Groq"
            model="llama3-70b-8192"
            envKey="GROQ_API_KEY"
            link="https://console.groq.com/keys"
            tier="Free tier: 30 requests/min"
          />
        </div>

        <div
          className="mt-4 p-3 rounded-lg text-xs"
          style={{
            background: "rgba(124,111,255,0.08)",
            border: "1px solid rgba(124,111,255,0.2)",
            color: "var(--text-secondary)",
          }}
        >
          <strong style={{ color: "var(--text-accent)" }}>Fallback chain:</strong>{" "}
          DocuCraft tries Gemini first. If that fails (rate limit, quota), it
          automatically falls back to Groq. Set both keys for maximum reliability.
        </div>
      </section>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between py-2.5 border-b"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <span
        className="text-xs font-medium text-right max-w-[55%] truncate"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}

function ProviderCard({
  name,
  model,
  envKey,
  link,
  tier,
  primary,
}: {
  name: string;
  model: string;
  envKey: string;
  link: string;
  tier: string;
  primary?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg border"
      style={{
        background: "var(--surface-base)",
        borderColor: primary ? "var(--border-emphasis)" : "var(--border-default)",
      }}
    >
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {name}
          </p>
          {primary && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{
                background: "var(--accent-dim, rgba(124,111,255,0.15))",
                color: "var(--accent)",
              }}
            >
              Primary
            </span>
          )}
        </div>
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {model} · {tier}
        </p>
        <code
          className="text-[11px] mt-1 block"
          style={{ color: "var(--text-accent)" }}
        >
          {envKey}=your_key_here
        </code>
      </div>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs font-medium shrink-0 ml-4 transition-opacity hover:opacity-70"
        style={{ color: "var(--accent)" }}
      >
        Get key
        <ExternalLink size={11} />
      </a>
    </div>
  );
}
