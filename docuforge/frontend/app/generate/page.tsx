 "use client";

import { useState, useEffect } from "react";
import { ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  DocumentType,
  AnyDocumentInputs,
  GeneratedDocResult,
  RefineAction,
  PersonalizationData,
} from "@/types";
import { DOC_TYPES, DOC_TYPE_MAP } from "@/lib/constants";
import { apiGenerate, apiRefine, apiGetPreferences } from "@/lib/api";
import { EmailForm } from "@/components/forms/EmailForm";
import { CoverLetterForm } from "@/components/forms/CoverLetterForm";
import { LeaveLetterForm } from "@/components/forms/LeaveLetterForm";
import { ResignationLetterForm } from "@/components/forms/ResignationLetterForm";
import { ResumeForm } from "@/components/forms/ResumeForm";
import { CustomDocumentForm } from "@/components/forms/CustomDocumentForm";
import { MemoForm } from "@/components/forms/MemoForm";
import { ProposalForm } from "@/components/forms/ProposalForm";
import { AgreementForm } from "@/components/forms/AgreementForm";
import { MeetingMinutesForm } from "@/components/forms/MeetingMinutesForm";
import { ReportForm } from "@/components/forms/ReportForm";
import { DocumentPreview } from "@/components/document/DocumentPreview";

type Step = "select" | "form" | "preview";

import { useAuthMe } from "@/components/auth/useAuthMe";
import { RequireAuthNotice } from "@/components/auth/RequireAuthNotice";

export default function GeneratePage() {
  const { loading: authLoading, loggedIn } = useAuthMe();

  const [step, setStep] = useState<Step>("select");
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [lastInputs, setLastInputs] = useState<AnyDocumentInputs | null>(null);
  const [result, setResult] = useState<GeneratedDocResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<PersonalizationData | null>(null);


  useEffect(() => {
    if (!authLoading && loggedIn === false) return;

    apiGetPreferences()
      .then(setPrefs)
      .catch(() => null);
  }, [authLoading, loggedIn]);


  const handleSelectType = (type: DocumentType) => {
    setSelectedType(type);
    setResult(null);
    setError(null);
    setStep("form");
  };

  const handleFormSubmit = async (inputs: AnyDocumentInputs) => {
    if (!selectedType) return;
    setLastInputs(inputs);
    setIsGenerating(true);
    setError(null);

    try {
      const doc = await apiGenerate(selectedType, inputs);
      setResult(doc);
      setStep("preview");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async (action: RefineAction, currentContent: string) => {
    if (!selectedType || !lastInputs) return;
    setIsRefining(true);
    setError(null);

    try {
      const doc = await apiRefine(selectedType, lastInputs, action, currentContent);
      setResult(doc);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Refinement failed";
      setError(msg);
    } finally {
      setIsRefining(false);
    }
  };

  const suggestedTypes = (prefs?.suggestedTypes ?? []).slice(0, 3);

  if (!authLoading && loggedIn === false) {
    return <RequireAuthNotice on />;
  }


  // ── Step breadcrumb ────────────────────────────────────────────
  const STEPS: { key: Step; label: string }[] = [
    { key: "select", label: "Choose type" },
    { key: "form", label: "Fill details" },
    { key: "preview", label: "Preview & export" },
  ];
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="flex flex-col h-full">
      {/* Step breadcrumb */}
      <div className="flex items-center gap-1.5 mb-6 shrink-0">
        {STEPS.map((s, i) => {
          const isDone = i < stepIndex;
          const isActive = i === stepIndex;
          return (
            <div key={s.key} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronRight size={13} style={{ color: "var(--text-muted)" }} />
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{
                    background: isDone
                      ? "var(--success)"
                      : isActive
                      ? "var(--accent)"
                      : "var(--surface-raised)",
                    color: isDone || isActive ? "white" : "var(--text-muted)",
                    border: !isDone && !isActive
                      ? "1px solid var(--border-default)"
                      : undefined,
                  }}
                >
                  {isDone ? "✓" : i + 1}
                </div>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{
                    color: isActive
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  }}
                >
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Step: Select ──────────────────────────────────────── */}
      {step === "select" && (
        <div className="flex-1 overflow-y-auto space-y-7 fade-in">
          {suggestedTypes.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={13} style={{ color: "var(--accent)" }} />
                <h2
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  Suggested for you
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {suggestedTypes.map((id) => {
                  const cfg = DOC_TYPE_MAP[id];
                  if (!cfg) return null;
                  return (
                    <DocTypeCard
                      key={cfg.id}
                      cfg={cfg}
                      onSelect={handleSelectType}
                      highlighted
                    />
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <h2
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              All document types
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {DOC_TYPES.map((cfg) => (
                <DocTypeCard
                  key={cfg.id}
                  cfg={cfg}
                  onSelect={handleSelectType}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── Step: Form ────────────────────────────────────────── */}
      {step === "form" && selectedType && (
        <div className="flex-1 overflow-y-auto fade-in">
          <div className="max-w-xl mx-auto">
            {/* Back + title */}
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setStep("select")}
                className="text-xs transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.color = "var(--text-primary)")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.color = "var(--text-muted)")
                }
              >
                ← Back
              </button>
              <span style={{ color: "var(--border-default)" }}>·</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-sm"
                  style={{
                    background: `linear-gradient(135deg, ${DOC_TYPE_MAP[selectedType]?.gradientFrom}, ${DOC_TYPE_MAP[selectedType]?.gradientTo})`,
                  }}
                >
                  {DOC_TYPE_MAP[selectedType]?.icon}
                </div>
                <h2
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {DOC_TYPE_MAP[selectedType]?.label}
                </h2>
              </div>
            </div>

            {/* Form card */}
            <div
              className="rounded-xl p-5"
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {isGenerating ? (
                <GeneratingState
                  label={DOC_TYPE_MAP[selectedType]?.shortLabel ?? "document"}
                />
              ) : (
                <FormForType
                  docType={selectedType}
                  defaultValues={
                    prefs?.lastUsedInputs?.[selectedType] as Record<string, string> ?? {}
                  }
                  onSubmit={handleFormSubmit}
                  isLoading={isGenerating}
                />
              )}

              {error && !isGenerating && (
                <div
                  className="mt-4 p-3 rounded-lg text-sm"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "var(--error)",
                  }}
                >
                  <strong>Error:</strong> {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Step: Preview ─────────────────────────────────────── */}
      {step === "preview" && result && selectedType && (
        <div className="flex-1 min-h-0 flex flex-col fade-in">
          {/* Back to form */}
          <div className="flex items-center gap-3 mb-4 shrink-0">
            <button
              onClick={() => setStep("form")}
              className="text-xs transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.color = "var(--text-primary)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color = "var(--text-muted)")
              }
            >
              ← Edit inputs
            </button>
          </div>

          {error && (
            <div
              className="mb-3 p-3 rounded-lg text-sm shrink-0"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "var(--error)",
              }}
            >
              {error}
            </div>
          )}

          <div className="flex-1 min-h-0">
            <DocumentPreview
              document={result}
              onRefine={handleRefine}
              isRefining={isRefining}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── DocTypeCard ──────────────────────────────────────────────────
function DocTypeCard({
  cfg,
  onSelect,
  highlighted,
}: {
  cfg: (typeof DOC_TYPES)[0];
  onSelect: (id: DocumentType) => void;
  highlighted?: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(cfg.id)}
      className="text-left p-4 rounded-xl border transition-all group"
      style={{
        background: "var(--surface-card)",
        borderColor: highlighted ? `${cfg.accentColor}50` : "var(--border-subtle)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = cfg.accentColor;
        (e.currentTarget as HTMLElement).style.background = "var(--surface-raised)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = highlighted
          ? `${cfg.accentColor}50`
          : "var(--border-subtle)";
        (e.currentTarget as HTMLElement).style.background = "var(--surface-card)";
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{
            background: `linear-gradient(135deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
          }}
        >
          {cfg.icon}
        </div>
        <div className="min-w-0">
          <h3
            className="font-semibold text-sm mb-0.5"
            style={{ color: "var(--text-primary)" }}
          >
            {cfg.label}
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {cfg.description}
          </p>
        </div>
      </div>
    </button>
  );
}

// ── Form router ──────────────────────────────────────────────────
function FormForType({
  docType,
  defaultValues,
  onSubmit,
  isLoading,
}: {
  docType: DocumentType;
  defaultValues: Record<string, string>;
  onSubmit: (d: AnyDocumentInputs) => void;
  isLoading: boolean;
}) {
  const props = { defaultValues: defaultValues as never, onSubmit: onSubmit as never, isLoading };

  switch (docType) {
    case "email": return <EmailForm {...props} />;
    case "cover_letter": return <CoverLetterForm {...props} />;
    case "leave_letter": return <LeaveLetterForm {...props} />;
    case "resignation_letter": return <ResignationLetterForm {...props} />;
    case "resume": return <ResumeForm {...props} />;
    case "custom": return <CustomDocumentForm {...props} />;
    case "memo": return <MemoForm {...props} />;
    case "proposal": return <ProposalForm {...props} />;
    case "agreement": return <AgreementForm {...props} />;
    case "meeting_minutes": return <MeetingMinutesForm {...props} />;
    case "report": return <ReportForm {...props} />;
    default: return null;
  }
}

// ── Generating state ─────────────────────────────────────────────
function GeneratingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="relative">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: "var(--accent-dim, rgba(124,111,255,0.12))",
          }}
        >
          <Loader2 size={24} className="spin" style={{ color: "var(--accent)" }} />
        </div>
      </div>
      <div className="text-center">
        <p
          className="text-sm font-medium mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Writing your {label}…
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          AI is crafting a professional, ready-to-send document
        </p>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full pulse-dot"
            style={{
              background: "var(--accent)",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
