"use client";

import type { HueName } from "../hue-picker/hue-picker";
import type { TabItem } from "../tab-bar/tab-bar";
import { Icon, type IconName } from "../icon/icon";
import { cn } from "../../utils/cn";

export interface SideNavBrand {
  name: string;
  icon: string;
  hue: HueName;
}

export interface SideNavProps {
  brand: SideNavBrand;
  tabs: TabItem[];
  current: string;
  onChange: (id: string) => void;
}

export function SideNav({ brand, tabs, current, onChange }: SideNavProps) {
  return (
    <nav role="navigation" aria-label={brand.name} className="flex w-[220px] flex-col gap-0.5 border-r bg-card p-5">
      <button type="button" onClick={() => onChange("home")} className="mb-4 flex items-center gap-3 text-left">
        <div
          style={{ backgroundColor: `var(--hue-${brand.hue})` }}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-white"
        >
          <Icon name={brand.icon as IconName} size={16} />
        </div>
        <span className="text-sm font-bold">{brand.name}</span>
      </button>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-current={current === tab.id ? "page" : undefined}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm",
            current === tab.id
              ? "bg-[var(--hue-teal-wash)] font-bold text-[var(--hue-teal-ink)]"
              : "bg-transparent font-medium text-foreground",
          )}
        >
          <Icon name={tab.icon as IconName} size={18} />
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
