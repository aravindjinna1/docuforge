"use client";

import { useState, useRef, useEffect } from "react";
import {
  RefreshCw,
  Scissors,
  Sparkles,
  FileText,
  Download,
  Copy,
  Check,
  Pencil,
  X,
  Eye,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { GeneratedDocResult, RefineAction, DocumentType } from "@/types";
import { apiDownloadDocx, apiDownloadPdf } from "@/lib/api";
import { triggerBlobDownload, toSafeFilename } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DOC_TYPE_MAP } from "@/lib/constants";

// Lazy-load the rich text editor for performance
const RichTextEditor = dynamic(
  () => import("@/components/editor/RichTextEditor").then((mod) => mod.RichTextEditor),
  { ssr: false }
);

interface Props {
  document: GeneratedDocResult;
  onRefine: (action: RefineAction, currentContent: string) => void;
  isRefining: boolean;
}

const REFINE_ACTIONS: {
  action: RefineAction;
  label: string;
  icon: React.ReactNode;
  hint: string;
}[] = [
  {
    action: "regenerate",
    label: "Regenerate",
    icon: <RefreshCw size={13} />,
    hint: "Same inputs, completely different output",
  },
  {
    action: "shorten",
    label: "Shorten",
    icon: <Scissors size={13} />,
    hint: "Remove 35% while keeping all key information",
  },
  {
    action: "improve_tone",
    label: "Improve Tone",
    icon: <Sparkles size={13} />,
    hint: "Stronger word choice, better rhythm",
  },
  {
    action: "make_formal",
    label: "Make Formal",
    icon: <FileText size={13} />,
    hint: "Executive-level formal register",
  },
];

export function DocumentPreview({ document, onRefine, isRefining }: Props) {
  const [editedContent, setEditedContent] = useState(document.content);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState<"pdf" | "docx" | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Sync content when AI regenerates
  useEffect(() => {
    if (!isEditing) {
      setEditedContent(document.content);
    }
  }, [document.content, isEditing]);

  const config = DOC_TYPE_MAP[document.documentType];

  const handleCopy = async () => {
    // Strip HTML tags for clipboard copy
    const plainText = editedContent.replace(/<[^>]*>/g, "");
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDownloadDocx = async () => {
    try {
      setDownloading("docx");
      // Strip HTML for DOCX
      const plainText = editedContent.replace(/<[^>]*>/g, "");
      const blob = await apiDownloadDocx(
        plainText,
        document.title,
        document.documentType
      );
      triggerBlobDownload(blob, toSafeFilename(document.title, "docx"));
    } catch (e) {
      console.error("DOCX download failed:", e);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading("pdf");
      // Preserve HTML formatting for PDF
      const result = await apiDownloadPdf(
        editedContent,
        document.title
      );

      if (result.blob) {
        triggerBlobDownload(result.blob, toSafeFilename(document.title, "pdf"));
      } else if (result.html) {
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(result.html);
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 500);
        }
      }
    } catch (e) {
      console.error("PDF download failed:", e);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex flex-col h-full fade-in">
      {/* Header bar */}
      <div
        className="flex items-start justify-between gap-4 px-5 py-3 rounded-t-xl border-b shrink-0"
        style={{
          background: "var(--surface-card)",
          borderColor: "var(--border-subtle)",
          border: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
          borderRadius: "12px 12px 0 0",
        }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge color={config?.accentColor}>{config?.shortLabel ?? document.documentType}</Badge>
            <span
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {document.wordCount} words
            </span>
          </div>
          <h3
            className="text-sm font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {document.title}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{
              background: "var(--surface-raised)",
              color: copied ? "var(--success)" : "var(--text-secondary)",
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={isEditing ? () => setIsEditing(false) : handleEdit}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{
              background: isEditing ? "var(--accent-dim)" : "var(--surface-raised)",
              color: isEditing ? "var(--accent)" : "var(--text-secondary)",
            }}
          >
            {isEditing ? <Eye size={12} /> : <Pencil size={12} />}
            {isEditing ? "Preview" : "Edit"}
          </button>
        </div>
      </div>

      {/* Refine actions */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 shrink-0 overflow-x-auto"
        style={{
          background: "var(--surface-card)",
          borderLeft: "1px solid var(--border-subtle)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        <span
          className="text-[10px] font-semibold uppercase tracking-wider shrink-0 mr-1"
          style={{ color: "var(--text-muted)" }}
        >
          Refine
        </span>
        {REFINE_ACTIONS.map(({ action, label, icon }) => (
          <button
            key={action}
            disabled={isRefining}
            onClick={() => onRefine(action, editedContent)}
            title={
              REFINE_ACTIONS.find((a) => a.action === action)?.hint
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all border"
            style={{
              background: "var(--surface-base)",
              borderColor: "var(--border-default)",
              color: isRefining ? "var(--text-muted)" : "var(--text-secondary)",
              opacity: isRefining ? 0.6 : 1,
              cursor: isRefining ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isRefining) {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
              (e.currentTarget as HTMLElement).style.color = isRefining
                ? "var(--text-muted)"
                : "var(--text-secondary)";
            }}
          >
            {isRefining && action === "regenerate" ? (
              <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent spin" />
            ) : (
              icon
            )}
            {label}
          </button>
        ))}
      </div>

      {/* Editor / Preview area */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          background: "var(--surface-base)",
          border: "1px solid var(--border-subtle)",
          borderTop: "none",
        }}
      >
        {isRefining ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 py-12">
            <div
              className="w-10 h-10 rounded-full border-2 border-t-transparent spin"
              style={{ borderColor: "var(--accent)" }}
            />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Rewriting your document…
            </p>
          </div>
        ) : (
          <div className="p-4 mx-auto" style={{ maxWidth: 650 }}>
            {isEditing ? (
              <RichTextEditor
                content={editedContent}
                onChange={setEditedContent}
                placeholder="Edit your document…"
                minHeight={400}
              />
            ) : (
              <div
                ref={contentRef}
                className="doc-paper p-8"
                style={{ maxWidth: 620, margin: "0 auto" }}
              >
                <div
                  className="tiptap-rendered"
                  style={{
                    fontFamily: "'Crimson Pro', Georgia, serif",
                    fontSize: 14,
                    lineHeight: 1.85,
                    color: "#1a1c2e",
                  }}
                  dangerouslySetInnerHTML={{ __html: editedContent }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Download actions */}
      <div
        className="flex gap-3 p-4 shrink-0 rounded-b-xl"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderTop: "1px solid var(--border-subtle)",
          borderRadius: "0 0 12px 12px",
        }}
      >
        <Button
          onClick={handleDownloadDocx}
          loading={downloading === "docx"}
          disabled={!!downloading}
          className="flex-1"
          size="md"
        >
          <Download size={14} />
          {downloading === "docx" ? "Preparing…" : "Download DOCX"}
        </Button>
        <Button
          variant="secondary"
          onClick={handleDownloadPdf}
          loading={downloading === "pdf"}
          disabled={!!downloading}
          className="flex-1"
          size="md"
        >
          <Download size={14} />
          {downloading === "pdf" ? "Preparing…" : "Download PDF"}
        </Button>
      </div>
    </div>
  );
}

