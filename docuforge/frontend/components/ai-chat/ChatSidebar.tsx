"use client";

import { MessageCircle, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: ChatSidebarProps) {
  return (
    <aside
      className="flex flex-col h-full shrink-0 border-r"
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
          Chat History
        </span>
        <button
          onClick={onNewSession}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
          style={{ color: "var(--accent)" }}
          title="New Chat"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle
              size={28}
              className="mx-auto mb-2"
              style={{ color: "var(--text-muted)" }}
            />
            <p
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              No chats yet
            </p>
            <p
              className="text-[10px] mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              Start a new conversation
            </p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                className={cn(
                  "group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150",
                  "hover:bg-[var(--surface-hover)]"
                )}
                style={{
                  background: isActive ? "var(--surface-active)" : "transparent",
                }}
                onClick={() => onSelectSession(session.id)}
              >
                <MessageCircle
                  size={14}
                  className="shrink-0"
                  style={{
                    color: isActive ? "var(--accent)" : "var(--text-muted)",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium truncate"
                    style={{
                      color: isActive
                        ? "var(--text-primary)"
                        : "var(--text-secondary)",
                    }}
                  >
                    {session.title}
                  </p>
                  <p
                    className="text-[10px] truncate mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {session.lastMessage}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--surface-raised)]"
                  style={{ color: "var(--error)" }}
                  title="Delete chat"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom info */}
      <div
        className="shrink-0 px-3 py-2 text-[10px] text-center"
        style={{
          color: "var(--text-muted)",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        {sessions.length} conversation{sessions.length !== 1 ? "s" : ""}
      </div>
    </aside>
  );
}

