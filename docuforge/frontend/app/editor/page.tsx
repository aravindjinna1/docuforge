"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { v4 as uuidv4 } from "uuid";
import {
  Save,
  Download,
  FileText,
  Undo,
  Check,
  X,
  Loader2,
  Trash2,
} from "lucide-react";
import { useAuthMe } from "@/components/auth/useAuthMe";
import { RequireAuthNotice } from "@/components/auth/RequireAuthNotice";
import { Button } from "@/components/ui/Button";
import { apiDownloadDocx, apiDownloadPdf } from "@/lib/api";
import { triggerBlobDownload, toSafeFilename } from "@/lib/utils";

const RichTextEditor = dynamic(
  () =>
    import("@/components/editor/RichTextEditor").then(
      (mod) => mod.RichTextEditor
    ),
  { ssr: false }
);

interface SavedDraft {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

const STORAGE_KEY = "docuforge_manual_drafts";

function loadDrafts(): SavedDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDrafts(drafts: SavedDraft[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // storage full — silently fail
  }
}

export default function ManualEditorPage() {
  const { loading: authLoading, loggedIn } = useAuthMe();

  const [title, setTitle] = useState("Untitled Document");
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState<"pdf" | "docx" | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [showSaves, setShowSaves] = useState(false);
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setDrafts(loadDrafts());
  }, []);

  const wordCount = content
    ? content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length
    : 0;

  const handleSave = useCallback(() => {
    setSaving(true);
    const draftsList = loadDrafts();
    const now = new Date().toISOString();
    const id = draftId || uuidv4();

    const existingIdx = draftsList.findIndex((d) => d.id === id);
    const entry: SavedDraft = { id, title, content, updatedAt: now };

    if (existingIdx >= 0) {
      draftsList[existingIdx] = entry;
    } else {
      draftsList.unshift(entry);
    }

    saveDrafts(draftsList);
    setDraftId(id);
    setDrafts(draftsList);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }, [title, content, draftId]);

  const loadDraft = useCallback((draft: SavedDraft) => {
    setTitle(draft.title);
    setContent(draft.content);
    setDraftId(draft.id);
    setShowSaves(false);
  }, []);

  const deleteDraft = useCallback(
    (id: string) => {
      const filtered = drafts.filter((d) => d.id !== id);
      saveDrafts(filtered);
      setDrafts(filtered);
      if (draftId === id) {
        setDraftId(null);
      }
    },
    [drafts, draftId]
  );

  const handleNew = useCallback(() => {
    setTitle("Untitled Document");
    setContent("");
    setDraftId(null);
  }, []);

  const handleDownloadDocx = async () => {
    try {
      setDownloading("docx");
      const plainText = content.replace(/<[^>]*>/g, "");
      const blob = await apiDownloadDocx(plainText, title, "custom");
      triggerBlobDownload(blob, toSafeFilename(title, "docx"));
    } catch (e) {
      console.error("DOCX download failed:", e);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading("pdf");
      const result = await apiDownloadPdf(content, title);
      if (result.blob) {
        triggerBlobDownload(result.blob, toSafeFilename(title, "pdf"));
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

  if (!authLoading && loggedIn === false) {
    return (
      <div className="max-w-md mx-auto">
        <RequireAuthNotice
          on
          message="Please login to use the Manual Document Editor."
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
      {/* Top toolbar */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-t-xl shrink-0 flex-wrap"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderBottom: "none",
        }}
      >
        {/* Title input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 min-w-[200px] text-sm font-semibold bg-transparent outline-none border-none"
          style={{ color: "var(--text-primary)" }}
          placeholder="Document title…"
        />

        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {wordCount} words
        </span>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Saved drafts dropdown */}
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSaves(!showSaves)}
            >
              <FileText size={13} />
              Drafts ({drafts.length})
            </Button>
            {showSaves && (
              <div
                className="absolute top-full right-0 mt-1 w-72 rounded-xl overflow-hidden z-50"
                style={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-default)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}
              >
                <div className="max-h-64 overflow-y-auto">
                  {drafts.length === 0 ? (
                    <div className="p-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                      No saved drafts yet
                    </div>
                  ) : (
                    drafts.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-2 px-3 py-2.5 border-b cursor-pointer transition-colors"
                        style={{
                          borderColor: "var(--border-subtle)",
                          background:
                            d.id === draftId
                              ? "var(--surface-active)"
                              : "transparent",
                        }}
                        onClick={() => loadDraft(d)}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background =
                            "var(--surface-hover)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background =
                            d.id === draftId
                              ? "var(--surface-active)"
                              : "transparent";
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-xs font-medium truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {d.title}
                          </p>
                          <p
                            className="text-[10px]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {new Date(d.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDraft(d.id);
                          }}
                          className="p-1 rounded transition-colors"
                          style={{ color: "var(--text-muted)" }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.color =
                              "var(--error)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.color =
                              "var(--text-muted)";
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={handleNew}>
            <FileText size={13} />
            New
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleSave}
            loading={saving}
          >
            {saved ? (
              <>
                <Check size={13} />
                Saved
              </>
            ) : (
              <>
                <Save size={13} />
                Save
              </>
            )}
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadDocx}
            loading={downloading === "docx"}
            disabled={!!downloading}
          >
            <Download size={13} />
            DOCX
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadPdf}
            loading={downloading === "pdf"}
            disabled={!!downloading}
          >
            <Download size={13} />
            PDF
          </Button>
        </div>
      </div>

      {/* Editor area */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          background: "var(--surface-base)",
          border: "1px solid var(--border-subtle)",
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
        }}
      >
        <div className="p-4 mx-auto" style={{ maxWidth: 680 }}>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your document…"
            minHeight={500}
          />
        </div>
      </div>
    </div>
  );
}

