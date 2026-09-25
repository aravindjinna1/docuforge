"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Trash2,
  Download,
  Eye,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { apiGetHistory, apiGetDocument, apiDeleteDocument, apiDownloadDocx, isApiAuthError } from "@/lib/api";
import type { HistoryItem, HistoryItemFull, DocumentType } from "@/types";
import { DOC_TYPES, DOC_TYPE_MAP } from "@/lib/constants";
import { timeAgo, triggerBlobDownload, toSafeFilename } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuthMe } from "@/components/auth/useAuthMe";
import { RequireAuthNotice } from "@/components/auth/RequireAuthNotice";

const TYPE_FILTERS: { value: "all" | DocumentType; label: string }[] = [
  { value: "all", label: "All types" },
  ...DOC_TYPES.map((d) => ({ value: d.id as DocumentType, label: d.shortLabel })),
];

export default function HistoryPage() {
  const { loading: authLoading, loggedIn } = useAuthMe();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filter, setFilter] = useState<"all" | DocumentType>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<HistoryItemFull | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);

  const fetchHistory = useCallback(
    async (page = 1) => {
      if (authLoading) return;
      if (loggedIn === false) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await apiGetHistory(page, 15, filter === "all" ? undefined : filter);
        setAuthRequired(false);
        setItems(res.data);
        setPagination(res.pagination);
      } catch (e: unknown) {
        if (isApiAuthError(e)) {
          setAuthRequired(true);
          return;
        }
        console.error("Failed to load history:", e);
      } finally {
        setLoading(false);
      }
    },
    [authLoading, loggedIn, filter]
  );

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handleView = async (documentId: string) => {
    setViewLoading(true);
    try {
      const doc = await apiGetDocument(documentId);
      setSelectedDoc(doc);
    } catch (e: unknown) {
      if (isApiAuthError(e)) {
        setAuthRequired(true);
        return;
      }
      console.error("Failed to load document:", e);
    } finally {
      setViewLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    setDeletingId(documentId);
    try {
      await apiDeleteDocument(documentId);
      setItems((prev) => prev.filter((d) => d.documentId !== documentId));
      if (selectedDoc?.documentId === documentId) setSelectedDoc(null);
    } catch (e: unknown) {
      if (isApiAuthError(e)) {
        setAuthRequired(true);
        return;
      }
      console.error("Delete failed:", e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (item: HistoryItem) => {
    try {
      const full = await apiGetDocument(item.documentId);
      const blob = await apiDownloadDocx(full.content, item.title, item.documentType);
      triggerBlobDownload(blob, toSafeFilename(item.title, "docx"));
    } catch (e: unknown) {
      if (isApiAuthError(e)) {
        setAuthRequired(true);
        return;
      }
      console.error("Download failed:", e);
    }
  };

  // Client-side search filter (title only)
  const filtered = search.trim()
    ? items.filter((i) =>
        i.title.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  if (!authLoading && (loggedIn === false || authRequired)) {
    return (
      <div className="max-w-md mx-auto">
        <RequireAuthNotice on message="Please login to view your document history." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5 shrink-0">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9"
            style={{ height: 36 }}
          />
        </div>

        {/* Type filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background:
                  filter === f.value ? "var(--accent)" : "var(--surface-raised)",
                color:
                  filter === f.value ? "white" : "var(--text-secondary)",
                border:
                  filter === f.value
                    ? "1px solid var(--accent)"
                    : "1px solid var(--border-default)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchHistory(pagination.page)}
          title="Refresh"
        >
          <RefreshCw size={13} />
        </Button>
      </div>

      {/* ── Count ──────────────────────────────────────────── */}
      <p className="text-xs mb-3 shrink-0" style={{ color: "var(--text-muted)" }}>
        {loading ? "Loading…" : `${pagination.total} document${pagination.total !== 1 ? "s" : ""} total`}
      </p>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* List */}
        <div className="flex-1 min-w-0 flex flex-col">
          {loading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl skeleton" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyHistory hasFilter={filter !== "all" || !!search} />
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-1.5">
                {filtered.map((doc) => (
                  <HistoryRow
                    key={doc.documentId}
                    doc={doc}
                    isSelected={selectedDoc?.documentId === doc.documentId}
                    isDeleting={deletingId === doc.documentId}
                    onView={() => handleView(doc.documentId)}
                    onDelete={() => handleDelete(doc.documentId)}
                    onDownload={() => handleDownload(doc)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t shrink-0"
                  style={{ borderColor: "var(--border-subtle)" }}>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => fetchHistory(pagination.page - 1)}
                    >
                      <ChevronLeft size={14} />
                      Prev
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => fetchHistory(pagination.page + 1)}
                    >
                      Next
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Document viewer panel */}
        {(selectedDoc || viewLoading) && (
          <div
            className="w-[360px] shrink-0 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: "1px solid var(--border-default)",
              background: "var(--surface-card)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b shrink-0"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Document Preview
              </span>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1 rounded-md transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")
                }
              >
                <X size={15} />
              </button>
            </div>

            {viewLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div
                  className="w-6 h-6 rounded-full border-2 border-t-transparent spin"
                  style={{ borderColor: "var(--accent)" }}
                />
              </div>
            ) : selectedDoc ? (
              <>
                <div className="px-4 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {selectedDoc.title}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {selectedDoc.wordCount} words · {timeAgo(selectedDoc.createdAt)}
                  </p>
                </div>
                <div
                  className="flex-1 overflow-y-auto p-4"
                  style={{ background: "var(--surface-base)" }}
                >
                  <div
                    className="doc-paper p-5 text-xs"
                    style={{ lineHeight: 1.75 }}
                  >
                    {selectedDoc.content}
                  </div>
                </div>
                <div className="p-3 shrink-0" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      handleDownload(selectedDoc as HistoryItem)
                    }
                  >
                    <Download size={13} />
                    Download DOCX
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryRow({
  doc,
  isSelected,
  isDeleting,
  onView,
  onDelete,
  onDownload,
}: {
  doc: HistoryItem;
  isSelected: boolean;
  isDeleting: boolean;
  onView: () => void;
  onDelete: () => void;
  onDownload: () => void;
}) {
  const cfg = DOC_TYPE_MAP[doc.documentType];

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group"
      style={{
        background: isSelected ? "var(--surface-active)" : "var(--surface-card)",
        borderColor: isSelected ? "var(--accent)" : "var(--border-subtle)",
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
        <p
          className="text-sm font-medium truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {doc.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge color={cfg?.accentColor}>{cfg?.shortLabel ?? doc.documentType}</Badge>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {doc.wordCount} words · {timeAgo(doc.createdAt)}
          </span>
        </div>
      </div>

      {/* Actions — visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <ActionIcon label="View" onClick={onView}>
          <Eye size={13} />
        </ActionIcon>
        <ActionIcon label="Download DOCX" onClick={onDownload}>
          <Download size={13} />
        </ActionIcon>
        <ActionIcon label="Delete" onClick={onDelete} danger>
          {isDeleting ? (
            <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent spin" />
          ) : (
            <Trash2 size={13} />
          )}
        </ActionIcon>
      </div>
    </div>
  );
}

function ActionIcon({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
      style={{ color: danger ? "var(--error)" : "var(--text-muted)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = danger
          ? "rgba(239,68,68,0.1)"
          : "var(--surface-active)";
        (e.currentTarget as HTMLElement).style.color = danger
          ? "var(--error)"
          : "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
        (e.currentTarget as HTMLElement).style.color = danger
          ? "var(--error)"
          : "var(--text-muted)";
      }}
    >
      {children}
    </button>
  );
}

function EmptyHistory({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed text-center"
      style={{
        borderColor: "var(--border-default)",
        background: "var(--surface-card)",
      }}
    >
      <FileText size={28} className="mb-3" style={{ color: "var(--text-muted)" }} />
      <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        {hasFilter ? "No documents match this filter" : "No documents yet"}
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
        {hasFilter
          ? "Try removing the filter or search term"
          : "Generate a document to see it here"}
      </p>
    </div>
  );
}
