"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@open-sharia-enterprise/ts-ui";

interface TabBarProps {
  onFabPress: () => void;
}

interface TabConfig {
  id: string;
  href: string;
  label: string;
  icon: string;
}

const LEFT_TABS: ReadonlyArray<TabConfig> = [
  { id: "home", href: "/app/home", label: "Home", icon: "home" },
  { id: "progress", href: "/app/progress", label: "Progress", icon: "trend" },
];

const RIGHT_TABS: ReadonlyArray<TabConfig> = [
  { id: "history", href: "/app/history", label: "History", icon: "history" },
  { id: "settings", href: "/app/settings", label: "Settings", icon: "settings" },
];

interface TabLinkProps {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}

function TabLink({ href, label, icon, active }: TabLinkProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-[3px] border-0 bg-transparent font-[inherit] no-underline transition-colors duration-150 [-webkit-tap-highlight-color:transparent]"
      style={{
        color: active ? "var(--hue-teal)" : "var(--color-muted-foreground)",
        fontSize: 10,
        fontWeight: active ? 700 : 500,
      }}
      aria-current={active ? "page" : undefined}
    >
      <Icon name={icon} size={22} filled={active} />
      {label}
    </Link>
  );
}

/**
 * Custom 64px mobile TabBar with 5 slots:
 * Home | Progress | FAB(+) | History | Settings
 *
 * Uses Next.js Link for navigation; active state derives from usePathname().
 */
export function TabBar({ onFabPress }: TabBarProps) {
  const pathname = usePathname();
  const [fabPressed, setFabPressed] = useState(false);

  return (
    <div
      className="flex items-stretch border-t"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        paddingBottom: "env(safe-area-inset-bottom, 0)",
        zIndex: 40,
      }}
    >
      {LEFT_TABS.map((tab) => (
        <TabLink key={tab.id} href={tab.href} label={tab.label} icon={tab.icon} active={pathname === tab.href} />
      ))}

      <div className="flex flex-1 items-center justify-center">
        <button
          onClick={onFabPress}
          onMouseDown={() => setFabPressed(true)}
          onMouseUp={() => setFabPressed(false)}
          onMouseLeave={() => setFabPressed(false)}
          onTouchStart={() => setFabPressed(true)}
          onTouchEnd={() => setFabPressed(false)}
          className="flex cursor-pointer items-center justify-center border-0 transition-transform duration-150 [-webkit-tap-highlight-color:transparent]"
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: "var(--hue-teal)",
            color: "#fff",
            boxShadow: "0 4px 16px oklch(68% 0.10 195 / 0.35)",
            marginBottom: 6,
            transform: fabPressed ? "scale(0.90)" : "none",
          }}
          aria-label="Log entry"
        >
          <Icon name="plus" size={26} />
        </button>
      </div>

      {RIGHT_TABS.map((tab) => (
        <TabLink key={tab.id} href={tab.href} label={tab.label} icon={tab.icon} active={pathname === tab.href} />
      ))}
    </div>
  );
}
