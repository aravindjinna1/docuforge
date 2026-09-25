"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export function useMobileSidebar() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    const onPop = () => setOpen(false);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return useMemo(
    () => ({
      open,
      setOpen,
      close,
      toggle,
    }),
    [open, close, toggle]
  );
}

