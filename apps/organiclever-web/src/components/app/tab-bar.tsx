"use client";

import { useState } from "react";
import { Icon } from "@open-sharia-enterprise/ts-ui";
import type { Tab } from "@/lib/app/app-machine";

interface TabBarProps {
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
  onFabPress: () => void;
}

interface TabButtonProps {
  id: Tab;
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ id, label, icon, active, onClick }: TabButtonProps) {
  return (
    <button
      key={id}
      onClick={onClick}
      className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-[3px] border-0 bg-transparent font-[inherit] transition-colors duration-150 [-webkit-tap-highlight-color:transparent]"
      style={{
        color: active ? "var(--hue-teal)" : "var(--color-muted-foreground)",
        fontSize: 10,
        fontWeight: active ? 700 : 500,
      }}
      aria-current={active ? "page" : undefined}
    >
      <Icon name={icon} size={22} filled={active} />
      {label}
    </button>
  );
}

/**
 * Custom 64px mobile TabBar with 5 slots:
 * Home | Progress | FAB(+) | History | Settings
 *
 * Uses custom styles rather than the ts-ui TabBar — the FAB centre slot
 * and 5-item layout are app-specific and not supported by the generic component.
 */
export function TabBar({ activeTab, onNavigate, onFabPress }: TabBarProps) {
  const [fabPressed, setFabPressed] = useState(false);

  const leftTabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: "home", label: "Home", icon: "home" },
    { id: "progress", label: "Progress", icon: "trend" },
  ];

  const rightTabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: "history", label: "History", icon: "history" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  return (
    <div
      className="flex flex-shrink-0 items-stretch border-t"
      style={{
        height: 64,
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        paddingBottom: "env(safe-area-inset-bottom, 0)",
      }}
    >
      {/* Left tabs: Home + Progress */}
      {leftTabs.map((tab) => (
        <TabButton
          key={tab.id}
          id={tab.id}
          label={tab.label}
          icon={tab.icon}
          active={activeTab === tab.id}
          onClick={() => onNavigate(tab.id)}
        />
      ))}

      {/* Centre FAB */}
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

      {/* Right tabs: History + Settings */}
      {rightTabs.map((tab) => (
        <TabButton
          key={tab.id}
          id={tab.id}
          label={tab.label}
          icon={tab.icon}
          active={activeTab === tab.id}
          onClick={() => onNavigate(tab.id)}
        />
      ))}
    </div>
  );
}
