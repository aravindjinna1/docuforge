"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, UserPlus, Mail, Lock } from "lucide-react";
import Link from "next/link";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, email, password }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const err = (json?.error as string) ?? "Registration failed";
        const details = json?.details;
        const detailsText = Array.isArray(details)
          ? details.map((d: any) => d.msg ?? JSON.stringify(d)).join("; ")
          : typeof details === "string"
            ? details
            : null;

        setError(detailsText ? `${err}: ${detailsText}` : err);
        return;
      }

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-0">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Create account
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Register to save your document history and preferences.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-xl p-4 sm:p-6"
        style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              className="form-input"
              style={{ height: 40 }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Email
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="form-input pl-9"
                style={{ height: 40 }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Password
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                type="password"
                className="form-input pl-9"
                style={{ height: 40 }}
              />
            </div>
          </div>

          {error && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--error)" }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)", opacity: loading ? 0.8 : 1 }}
          >
            {loading ? "Creating…" : (
              <>
                <UserPlus size={15} />
                Register
                <ArrowRight size={14} />
              </>
            )}
          </button>

          <div className="text-center text-xs px-2" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--accent)" }}>
              Login
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

