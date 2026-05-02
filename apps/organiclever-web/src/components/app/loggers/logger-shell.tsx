"use client";

import { Icon } from "@open-sharia-enterprise/ts-ui";
import { Button } from "@open-sharia-enterprise/ts-ui";
import type { Hue } from "@/contexts/journal/application";

export interface LoggerShellProps {
  isOpen: boolean;
  hue: Hue;
  icon: string;
  title: string;
  onClose: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
  children: React.ReactNode;
}

/**
 * Reusable bottom-sheet wrapper for all entry loggers.
 *
 * Renders a slide-up panel with a drag handle, header (icon + title + close),
 * scrollable content area, and sticky footer with Cancel / Save actions.
 */
export function LoggerShell({
  isOpen,
  hue,
  icon,
  title,
  onClose,
  onSave,
  saveDisabled = false,
  children,
}: LoggerShellProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "oklch(14% 0.01 60 / 0.50)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex w-full flex-col"
        style={{
          maxWidth: 480,
          background: "var(--color-card)",
          borderRadius: "24px 24px 0 0",
          maxHeight: "85vh",
        }}
      >
        {/* Drag handle */}
        <div className="flex shrink-0 justify-center pt-3 pb-1">
          <div
            className="rounded-full"
            style={{
              width: 24,
              height: 4,
              background: "var(--warm-200, oklch(88% 0.02 60))",
            }}
          />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-5 pt-2 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex shrink-0 items-center justify-center rounded-[13px]"
              style={{
                width: 44,
                height: 44,
                background: `var(--hue-${hue})`,
                color: "#fff",
              }}
            >
              <Icon name={icon} size={22} />
            </div>
            <div className="font-extrabold" style={{ fontSize: 18, letterSpacing: "-0.015em" }}>
              {title}
            </div>
          </div>
          <Button variant="secondary" size="icon-sm" onClick={onClose}>
            <Icon name="x" size={18} />
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5" style={{ paddingBottom: 8 }}>
          <div className="flex flex-col gap-4">{children}</div>
        </div>

        {/* Sticky footer */}
        <div
          className="flex shrink-0 gap-3 px-5 pt-4 pb-6"
          style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}
        >
          <Button variant="ghost" size="lg" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="teal" size="lg" className="flex-1" disabled={saveDisabled} onClick={onSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
