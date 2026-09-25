"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, UserPlus, LogOut } from "lucide-react";
import { apiAuthMe } from "@/lib/auth";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function AuthButtons() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    apiAuthMe()
      .then((me) => setLoggedIn(me.loggedIn))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl p-6" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
        Loading…
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="flex gap-3">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--accent)" }}
        >
          <UserPlus size={15} />
          Register
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
        >
          <LogIn size={15} />
          Login
        </Link>
      </div>
    );
  }

  const onLogout = async () => {
    await fetch(`${BASE}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => null);
    window.location.href = "/";
  };

  return (
    <button
      onClick={onLogout}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
      style={{ background: "var(--surface-raised)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
    >
      <LogOut size={15} />
      Logout
    </button>
  );
}

