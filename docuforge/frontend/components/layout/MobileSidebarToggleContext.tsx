"use client";

import React, { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";

type Ctx = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  close: () => void;
  toggle: () => void;
};

const MobileSidebarToggleContext = createContext<Ctx | null>(null);

export function MobileSidebarToggleProvider({
  value,
  children,
}: {
  value: Ctx;
  children: React.ReactNode;
}) {
  return (
    <MobileSidebarToggleContext.Provider value={value}>
      {children}
    </MobileSidebarToggleContext.Provider>
  );
}

export function useMobileSidebarToggle() {
  const ctx = useContext(MobileSidebarToggleContext);
  if (!ctx) {
    throw new Error(
      "useMobileSidebarToggle must be used within MobileSidebarToggleProvider"
    );
  }
  return ctx;
}

