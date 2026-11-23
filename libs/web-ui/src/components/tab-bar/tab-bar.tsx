"use client";

export interface TabItem {
  id: string;
  label: string;
  icon: string;
}

export interface TabBarProps {
  tabs: TabItem[];
  current: string;
  onChange: (id: string) => void;
}

import { Icon, type IconName } from "../icon/icon";
import { cn } from "../../utils/cn";

export function TabBar({ tabs, current, onChange }: TabBarProps) {
  return (
    <div
      role="tablist"
      className="flex h-[60px] flex-row border-t bg-card"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={current === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex min-h-[48px] flex-1 flex-col items-center justify-center gap-[3px]",
            current === tab.id ? "font-bold text-[var(--hue-teal)]" : "font-medium text-muted-foreground",
          )}
        >
          <Icon name={tab.icon as IconName} size={20} />
          <span className="text-[10px]">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
