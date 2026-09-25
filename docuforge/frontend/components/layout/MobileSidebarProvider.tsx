"use client";

import React from "react";
import { MobileSidebarToggleProvider } from "@/components/layout/MobileSidebarToggleContext";
import { useMobileSidebar } from "@/components/layout/mobileSidebarState";

export function MobileSidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const mobile = useMobileSidebar();
  return (
    <MobileSidebarToggleProvider value={mobile}>
      {children}
    </MobileSidebarToggleProvider>
  );
}

