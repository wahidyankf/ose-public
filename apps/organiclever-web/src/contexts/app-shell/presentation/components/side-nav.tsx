"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, Button } from "@open-sharia-enterprise/ts-ui";

interface SideNavProps {
  onLogEntry: () => void;
}

interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { id: "home", href: "/app/home", label: "Home", icon: "home" },
  { id: "history", href: "/app/history", label: "History", icon: "history" },
  { id: "progress", href: "/app/progress", label: "Progress", icon: "trend" },
  { id: "settings", href: "/app/settings", label: "Settings", icon: "settings" },
];

/**
 * Desktop SideNav — 220px wide, shown at md+ breakpoints.
 * Logo section, "Log entry" FAB button, and 4 nav items.
 * Active state is derived from `usePathname()`; navigation uses next/link.
 */
export function SideNav({ onLogEntry }: SideNavProps) {
  const pathname = usePathname();

  return (
    <div
      className="flex flex-shrink-0 flex-col gap-[2px] border-r"
      style={{
        width: 220,
        padding: "20px 12px",
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
      }}
    >
      <div style={{ padding: "4px 12px 20px" }}>
        <Link
          href="/app/home"
          prefetch={false}
          className="flex w-full cursor-pointer items-center gap-[10px] border-0 bg-transparent text-left font-[inherit] no-underline"
          style={{ padding: "6px 0", color: "inherit" }}
        >
          <div
            className="flex flex-shrink-0 items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "var(--hue-teal)",
              color: "#fff",
            }}
          >
            <Icon name="zap" size={18} />
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: "-0.015em",
                color: "var(--color-foreground)",
                lineHeight: 1,
              }}
            >
              OrganicLever
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--color-muted-foreground)",
                marginTop: 2,
              }}
            >
              Life journal
            </div>
          </div>
        </Link>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Button
          onClick={onLogEntry}
          className="w-full"
          style={
            {
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 12,
              background: "var(--hue-teal)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              boxShadow: "var(--shadow-xs)",
              width: "100%",
              justifyContent: "flex-start",
            } as React.CSSProperties
          }
        >
          <Icon name="plus" size={20} />
          Log entry
        </Button>
      </div>

      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.id}
            href={item.href}
            prefetch={false}
            className="flex cursor-pointer items-center gap-[12px] border-0 text-left font-[inherit] no-underline transition-all duration-150"
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              background: active ? "var(--hue-teal-wash)" : "transparent",
              color: active ? "var(--hue-teal-ink)" : "var(--color-foreground)",
              fontSize: 15,
              fontWeight: active ? 700 : 500,
            }}
            aria-current={active ? "page" : undefined}
          >
            <Icon name={item.icon} size={20} filled={active} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
