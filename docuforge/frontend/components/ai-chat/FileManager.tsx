"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Trash2, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface FileManagerProps {
  files: UploadedFile[];
  onUpload: (file: File) => void;
  onDelete: (fileId: string) => void;
  uploadProgress?: boolean;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string): string {
  if (type.includes("pdf")) return "pdf";
  if (type.includes("word") || type.includes("docx")) return "doc";
  if (type.includes("text") || type.includes("txt")) return "txt";
  return "generic";
}

export function FileManager({
  files,
  onUpload,
  onDelete,
  uploadProgress = false,
  disabled = false,
}: FileManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && !disabled) {
      onUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  return (
    <aside
      className="flex flex-col h-full shrink-0 border-l"
      style={{
        width: 260,
        background: "var(--surface-card)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Uploaded Files
        </span>
        <span
          className="text-[10px] font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          {files.length} file{files.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Upload Area */}
      <div className="px-3 py-3 shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "w-full flex flex-col items-center justify-center gap-1.5 rounded-xl px-4 py-5 transition-all duration-150 border-2 border-dashed cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
            dragOver
              ? "border-[var(--accent)] bg-[var(--accent-dim)]"
              : "border-[var(--border-default)] hover:border-[var(--border-emphasis)] hover:bg-[var(--surface-hover)]"
          )}
          style={{
            background: dragOver ? "var(--accent-dim)" : "var(--surface-base)",
          }}
        >
          {uploadProgress ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--accent-dim)" }}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 border-[var(--accent)] border-t-transparent spin"
                />
              </div>
              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                Uploading...
              </span>
            </div>
          ) : (
            <>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--accent-dim)" }}
              >
                <Upload size={15} style={{ color: "var(--accent)" }} />
              </div>
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Upload Document
              </span>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                PDF, DOCX, TXT
              </span>
            </>
          )}
        </button>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
        {files.length === 0 ? (
          <div className="text-center py-8">
            <FileText
              size={28}
              className="mx-auto mb-2"
              style={{ color: "var(--text-muted)" }}
            />
            <p
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              No files uploaded
            </p>
            <p
              className="text-[10px] mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              Upload a document to start chatting
            </p>
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="group flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all duration-150 hover:bg-[var(--surface-hover)]"
            >
              {/* File icon */}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--surface-base)" }}
              >
                <FileText
                  size={13}
                  style={{ color: "var(--accent)" }}
                />
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium truncate"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {file.name}
                </p>
                <p
                  className="text-[10px] mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {formatFileSize(file.size)}
                </p>
              </div>

              {/* Delete button */}
              <button
                onClick={() => onDelete(file.id)}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--surface-raised)]"
                style={{ color: "var(--error)" }}
                title="Delete file"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Bottom info */}
      {files.length > 0 && (
        <div
          className="shrink-0 px-3 py-2"
          style={{
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <p
            className="text-[10px] text-center flex items-center justify-center gap-1"
            style={{ color: "var(--text-muted)" }}
          >
            <AlertCircle size={10} />
            Files remain on your device
          </p>
        </div>
      )}
    </aside>
  );
}

