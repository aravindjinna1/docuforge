"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiAuthMe } from "@/lib/auth";

export function useAuthGuard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await apiAuthMe();
        if (!mounted) return;
        setLoggedIn(me.loggedIn);
        if (!me.loggedIn) router.push("/login");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading, loggedIn };
}

