"use client";

import { Icon, Button } from "@open-sharia-enterprise/ts-ui";
import type { Tab } from "@/lib/app/app-machine";

interface SideNavProps {
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
  onLogEntry: () => void;
}

const NAV_ITEMS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "home", label: "Home", icon: "home" },
  { id: "history", label: "History", icon: "history" },
  { id: "progress", label: "Progress", icon: "trend" },
  { id: "settings", label: "Settings", icon: "settings" },
];

/**
 * Desktop SideNav — 220px wide, shown at md+ breakpoints.
 * Logo section, "Log entry" FAB button, and 4 nav items.
 * Active item: teal-wash background + teal-ink text.
 */
export function SideNav({ activeTab, onNavigate, onLogEntry }: SideNavProps) {
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
      {/* Logo section */}
      <div style={{ padding: "4px 12px 20px" }}>
        <button
          onClick={() => onNavigate("home")}
          className="flex w-full cursor-pointer items-center gap-[10px] border-0 bg-transparent text-left font-[inherit]"
          style={{ padding: "6px 0" }}
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
        </button>
      </div>

      {/* Log entry button */}
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

      {/* Nav items */}
      {NAV_ITEMS.map((item) => {
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="flex cursor-pointer items-center gap-[12px] border-0 text-left font-[inherit] transition-all duration-150"
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
          </button>
        );
      })}
    </div>
  );
}
