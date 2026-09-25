"use client";

import { useState, useRef, useEffect } from "react";
import { BrainCircuit, AlertCircle, RefreshCw } from "lucide-react";
import { ChatSidebar, type ChatSession } from "@/components/ai-chat/ChatSidebar";
import { ChatMessage, TypingIndicator, type Message } from "@/components/ai-chat/ChatMessage";
import { ChatInput } from "@/components/ai-chat/ChatInput";
import { FileManager, type UploadedFile } from "@/components/ai-chat/FileManager";
import {
  apiAiGetSessions,
  apiAiCreateSession,
  apiAiDeleteSession,
  apiAiGetSessionMessages,
  apiAiQuery,
  apiAiGetFiles,
  apiAiUploadFile,
  apiAiDeleteFile,
  type AiChatSession as ApiSession,
  type AiChatMessage as ApiMessage,
  type AiUploadedFile as ApiFile,
} from "@/lib/api";
import { isApiAuthError } from "@/lib/api";

// ─── Helpers ───────────────────────────────────────────────────────
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function toChatSession(api: ApiSession): ChatSession {
  return {
    id: api.sessionId,
    title: api.title,
    lastMessage: "",
    timestamp: new Date(api.createdAt).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function toMessage(api: ApiMessage): Message {
  return {
    id: api.messageId,
    role: api.role,
    content: api.content,
    timestamp: new Date(api.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function toUploadedFile(api: ApiFile): UploadedFile {
  return {
    id: api.fileId,
    name: api.fileName,
    size: api.fileSize,
    type: api.mimeType,
    uploadedAt: api.createdAt,
  };
}

export default function AiDocHandlerPage() {
  // ─── State: Sessions ────────────────────────────────────────────
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");

  // ─── State: Messages per session ─────────────────────────────────
  const [messagesBySession, setMessagesBySession] = useState<Record<string, Message[]>>({});

  // ─── State: Files ────────────────────────────────────────────────
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // ─── State: Chat ─────────────────────────────────────────────────
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Refs ────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadSessionsCalled = useRef(false);

  // ─── Auto-scroll to latest message ───────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesBySession, activeSessionId]);

  // ─── Get current messages ────────────────────────────────────────
  const currentMessages = messagesBySession[activeSessionId] ?? [];

  // ─── Load sessions on mount ──────────────────────────────────────
  useEffect(() => {
    if (loadSessionsCalled.current) return;
    loadSessionsCalled.current = true;

    (async () => {
      try {
        setInitialLoading(true);
        setError(null);

        const [apiSessions, apiFiles] = await Promise.all([
          apiAiGetSessions(),
          apiAiGetFiles(),
        ]);

        setUploadedFiles(apiFiles.map(toUploadedFile));
        const chatSessions = apiSessions.map(toChatSession);
        setSessions(chatSessions);

        // Auto-select first session
        if (chatSessions.length > 0) {
          const firstId = chatSessions[0].id;
          setActiveSessionId(firstId);
          try {
            const msgs = await apiAiGetSessionMessages(firstId);
            setMessagesBySession((prev) => ({
              ...prev,
              [firstId]: msgs.map(toMessage),
            }));
          } catch { /* ignore */ }
        } else {
          // Create a default session
          try {
            const newSession = await apiAiCreateSession("Getting started");
            setSessions([toChatSession(newSession)]);
            setActiveSessionId(newSession.sessionId);
          } catch { /* silent */ }
        }

        setInitialLoading(false);
      } catch (err: unknown) {
        if (!isApiAuthError(err)) {
          setError(err instanceof Error ? err.message : "Failed to load data");
        }
        setInitialLoading(false);
      }
    })();
  }, []);

  // ─── Refresh session messages when switching sessions ────────────
  useEffect(() => {
    if (!activeSessionId) return;
    const hasMessages = messagesBySession[activeSessionId]?.length;
    if (!hasMessages) {
      apiAiGetSessionMessages(activeSessionId)
        .then((msgs) => {
          setMessagesBySession((prev) => ({
            ...prev,
            [activeSessionId]: msgs.map(toMessage),
          }));
        })
        .catch(() => {});
    }
  }, [activeSessionId]);

  // ─── Session handlers ────────────────────────────────────────────
  const handleNewSession = async () => {
    try {
      setError(null);
      const apiSession = await apiAiCreateSession();
      const newSession = toChatSession(apiSession);
      setSessions((prev) => [newSession, ...prev]);
      setMessagesBySession((prev) => ({
        ...prev,
        [apiSession.sessionId]: [],
      }));
      setActiveSessionId(apiSession.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    }
  };

  const handleSelectSession = async (id: string) => {
    setActiveSessionId(id);
    // Load messages if not already loaded
    if (!messagesBySession[id] || messagesBySession[id].length === 0) {
      try {
        const msgs = await apiAiGetSessionMessages(id);
        setMessagesBySession((prev) => ({
          ...prev,
          [id]: msgs.map(toMessage),
        }));
      } catch { /* ignore */ }
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      setError(null);
      await apiAiDeleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setMessagesBySession((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      if (id === activeSessionId) {
        setActiveSessionId(sessions[0]?.id ?? "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete session");
    }
  };

  // ─── File handlers ───────────────────────────────────────────────
  const handleUploadFile = async (file: File) => {
    try {
      setError(null);
      const apiFile = await apiAiUploadFile(file);
      setUploadedFiles((prev) => [...prev, toUploadedFile(apiFile)]);

      // If active session, add file upload message
      if (activeSessionId) {
        const sessionMessages = messagesBySession[activeSessionId] ?? [];
        const content = `📄 Uploaded: ${file.name} (parsed into ${apiFile.chunkCount} chunks)`;
        setMessagesBySession((prev) => ({
          ...prev,
          [activeSessionId]: [
            ...sessionMessages,
            {
              id: `upload-${apiFile.fileId}`,
              role: "assistant",
              content,
              timestamp: formatTime(new Date()),
            },
          ],
        }));
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, lastMessage: `📄 Uploaded: ${file.name}` }
              : s
          )
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      setError(null);
      await apiAiDeleteFile(fileId);
      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete file");
    }
  };

  // ─── Chat handler — REAL RAG via backend API ─────────────────────
  const handleSendMessage = async (content: string) => {
    if (isLoading || isStreaming || !activeSessionId) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: formatTime(new Date()),
    };

    const sessionMessages = messagesBySession[activeSessionId] ?? [];
    setMessagesBySession((prev) => ({
      ...prev,
      [activeSessionId]: [...sessionMessages, userMsg],
    }));

    // Update sidebar
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              lastMessage: content,
              title:
                s.title === "New Chat"
                  ? content.length > 40
                    ? content.slice(0, 40) + "…"
                    : content
                  : s.title,
            }
          : s
      )
    );

    setIsLoading(true);
    setIsStreaming(true);

    try {
      setError(null);
      // 🔥 Call the RAG pipeline via backend
      const result = await apiAiQuery(activeSessionId, content);

      const botMsg: Message = {
        id: result.message.messageId,
        role: "assistant",
        content: result.message.content,
        timestamp: new Date(result.message.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessagesBySession((prev) => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] ?? []), botMsg],
      }));
    } catch (err) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `⚠️ Error: ${err instanceof Error ? err.message : "Request failed"}`,
        timestamp: formatTime(new Date()),
      };
      setMessagesBySession((prev) => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] ?? []), errorMsg],
      }));
    }

    setIsLoading(false);
    setIsStreaming(false);
  };

  const handleStopStreaming = () => {
    setIsStreaming(false);
    setIsLoading(false);
  };

  // ─── Loading State ───────────────────────────────────────────────
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <RefreshCw size={32} className="mx-auto mb-3 spin" style={{ color: "var(--accent)" }} />
          <p style={{ color: "var(--text-secondary)" }}>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-[calc(100vh-100px)] gap-0 rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border-subtle)" }}
    >
      {/* ─── Error Banner ───────────────────────────────────────────── */}
      {error && (
        <div
          className="absolute top-0 left-0 right-0 z-50 flex items-center gap-2 px-4 py-2 text-xs"
          style={{
            background: "var(--error-dim)",
            color: "var(--error)",
            borderBottom: "1px solid var(--error)",
          }}
        >
          <AlertCircle size={12} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="hover:opacity-70">&times;</button>
        </div>
      )}

      {/* ─── Left Panel: Chat Sidebar ───────────────────────────────── */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* ─── Center Panel: Chat Conversation ────────────────────────── */}
      <div
        className="flex-1 flex flex-col min-w-0 relative"
        style={{ background: "var(--surface-base)" }}
      >
        {activeSessionId ? (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {currentMessages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-sm">
                    <BrainCircuit
                      size={36}
                      className="mx-auto mb-3"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      Upload a document to get started, or ask me a question!
                    </p>
                  </div>
                </div>
              )}
              {currentMessages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isStreaming && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
            <ChatInput
              onSend={handleSendMessage}
              disabled={isLoading}
              isStreaming={isStreaming}
              onStopStreaming={handleStopStreaming}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <BrainCircuit
                size={48}
                className="mx-auto mb-4"
                style={{ color: "var(--text-muted)" }}
              />
              <h2
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                No Chat Selected
              </h2>
              <p
                className="text-sm mb-4"
                style={{ color: "var(--text-secondary)" }}
              >
                Create a new chat or select one from the history to start
                asking questions about your documents.
              </p>
              <button
                onClick={handleNewSession}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                + New Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Right Panel: File Manager ──────────────────────────────── */}
      <FileManager
        files={uploadedFiles}
        onUpload={handleUploadFile}
        onDelete={handleDeleteFile}
        disabled={isLoading}
      />
    </div>
  );
}

