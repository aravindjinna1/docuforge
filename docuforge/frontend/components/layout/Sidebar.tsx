"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus2,
  BookOpen,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  PenLine,
  Brain,
  BrainCircuit,
  
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobileSidebarToggle } from "@/components/layout/MobileSidebarToggleContext";

const NAV = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/aiDocHandler", icon: BrainCircuit, label:" Doc Handler"},
  { href: "/generate", icon: FilePlus2, label: "Generate" },
  { href: "/editor", icon: PenLine, label: "Manual Editor" },
  { href: "/templates", icon: BookOpen, label: "Templates" },
  { href: "/history", icon: Clock, label: "History" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { open, close } = useMobileSidebarToggle();

  // Close on navigation (so overlay disappears after user clicks a menu item)
  useEffect(() => {
    if (open) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const width = collapsed ? 64 : 220;

  const SidebarContent = (
    <aside
      className="flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out"
      style={{
        width,
        background: "var(--surface-card)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center h-14 px-4 shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #7C6FFF 0%, #5B50DB 100%)" }}
        >
          <Zap size={15} className="text-white" />
        </div>

        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <span
              className="font-semibold text-sm leading-none block whitespace-nowrap"
              style={{ color: "var(--text-primary)" }}
            >
              DocuCraft
            </span>
            <span
              className="text-[10px] leading-none block mt-0.5 whitespace-nowrap"
              style={{ color: "var(--text-muted)" }}
            >
              AI Document Studio
            </span>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-hidden">
        {NAV.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              onClick={() => close()}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                "hover:bg-[var(--surface-hover)]"
              )}
              style={{
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                background: isActive ? "var(--surface-active)" : "transparent",
              }}
            >
              <Icon
                size={17}
                className="shrink-0 transition-colors"
                style={{
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                }}
              />

              {!collapsed && <span className="truncate">{label}</span>}

              {isActive && !collapsed && (
                <div
                  className="ml-auto w-1 h-4 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle (desktop only; on mobile keep it simple) */}
      <div
        className="shrink-0 p-2 hidden lg:block"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="w-full flex items-center justify-center h-9 rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
          style={{ color: "var(--text-muted)" }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile overlay sidebar (default / mobile-first) */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => close()}
        />

        {/* Panel */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 transition-transform duration-300 ease-in-out",
            open ? "translate-x-0" : "-translate-x-full"
          )}
          style={{ width }}
        >
          {SidebarContent}
        </div>
      </div>

      {/* Desktop sidebar: persistent */}
      <div className="hidden lg:block h-full">
        {SidebarContent}
      </div>
    </>
  );
}

