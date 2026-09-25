"use client";

import { useEffect, useState } from "react";
import { apiAuthMe } from "@/lib/auth";

export function useAuthMe() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    apiAuthMe()
      .then((me) => setLoggedIn(me.loggedIn))
      .finally(() => setLoading(false));
  }, []);

  return { loading, loggedIn };
}

