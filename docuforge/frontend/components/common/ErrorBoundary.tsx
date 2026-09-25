"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ fontWeight: 700, color: "var(--error)" }}>App crashed</div>
          <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)" }}>
            {this.state.error?.message ?? "Unknown error"}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
            Open the browser console for stack trace.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

