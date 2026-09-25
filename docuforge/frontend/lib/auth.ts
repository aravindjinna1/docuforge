export async function apiAuthMe(): Promise<{ loggedIn: false } | { loggedIn: true; user: { userId: string; email?: string } }> {
  const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${BASE}/api/auth/me`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal: controller.signal,
    });

    if (!res.ok) {
      // helps diagnose infinite loading
      if (process.env.NODE_ENV !== "production") {
        console.warn("/api/auth/me failed:", res.status);
      }
      return { loggedIn: false };
    }

    const json = (await res.json()) as {
      success: true;
      user: { userId: string; email?: string };
    };

    if (!json?.success) return { loggedIn: false };
    return { loggedIn: true, user: json.user };
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("/api/auth/me error:", e);
    }
    return { loggedIn: false };
  } finally {
    clearTimeout(timeout);
  }
}


