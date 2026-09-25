"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use a stable timestamp on server to avoid hydration mismatch
  const displayTimestamp = mounted
    ? message.timestamp
    : "";

  return (
    <div
      className={cn(
        "flex items-start gap-3 fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
          isUser
            ? "bg-[var(--accent-dim)]"
            : "bg-[var(--success-dim)]"
        )}
      >
        {isUser ? (
          <User size={14} style={{ color: "var(--accent)" }} />
        ) : (
          <Bot size={14} style={{ color: "var(--success)" }} />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-md"
            : "rounded-tl-md"
        )}
        style={
          isUser
            ? {
                background: "var(--accent-dim)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
              }
            : {
                background: "var(--surface-raised)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
              }
        }
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {displayTimestamp && (
          <p
            className="text-[10px] mt-1.5 text-right opacity-60"
            style={{ color: isUser ? "var(--text-secondary)" : "var(--text-muted)" }}
          >
            {displayTimestamp}
          </p>
        )}
      </div>
    </div>
  );
}

/** Typing indicator shown while the AI is generating a response */
export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 fade-in">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: "var(--success-dim)" }}
      >
        <Bot size={14} style={{ color: "var(--success)" }} />
      </div>
      <div
        className="rounded-2xl rounded-tl-md px-4 py-3"
        style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full pulse-dot"
            style={{ background: "var(--text-muted)", animationDelay: "0s" }}
          />
          <span
            className="w-2 h-2 rounded-full pulse-dot"
            style={{ background: "var(--text-muted)", animationDelay: "0.3s" }}
          />
          <span
            className="w-2 h-2 rounded-full pulse-dot"
            style={{ background: "var(--text-muted)", animationDelay: "0.6s" }}
          />
        </div>
      </div>
    </div>
  );
}

