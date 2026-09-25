"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
}

export function ChatInput({
  onSend,
  disabled = false,
  isStreaming = false,
  onStopStreaming,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }, [input]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled || isStreaming) return;
    onSend(trimmed);
    setInput("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send (Shift+Enter for newline)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex items-end gap-2 p-3"
      style={{
        background: "var(--surface-card)",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your documents..."
          rows={1}
          disabled={disabled}
          className="w-full resize-none rounded-xl px-4 py-2.5 text-sm pr-12 transition-all duration-150"
          style={{
            background: "var(--surface-base)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
            outline: "none",
            minHeight: 42,
            maxHeight: 160,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--accent)";
            e.target.style.boxShadow = "0 0 0 3px var(--accent-dim)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--border-default)";
            e.target.style.boxShadow = "none";
          }}
        />
      </div>

      {isStreaming ? (
        <button
          onClick={onStopStreaming}
          className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-all duration-150"
          style={{
            background: "var(--error-dim)",
            color: "var(--error)",
            border: "1px solid var(--border-subtle)",
          }}
          title="Stop generating"
        >
          <Square size={14} />
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: input.trim() ? "var(--accent)" : "var(--surface-raised)",
            color: input.trim() ? "#fff" : "var(--text-muted)",
            border: "1px solid var(--border-subtle)",
          }}
          title="Send message"
        >
          <Send size={15} />
        </button>
      )}
    </div>
  );
}

