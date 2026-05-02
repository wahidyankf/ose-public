"use client";

import { Icon } from "@open-sharia-enterprise/ts-ui";
import type { ActiveLoggerKind } from "@/lib/app/app-machine";
import { ENTRY_MODULES } from "./home/kind-hue";

export interface AddEntrySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEntry: (kind: string) => void;
}

/**
 * Bottom sheet shown when the FAB is pressed.
 *
 * Lists all built-in entry kinds (including workout) as clickable rows,
 * plus a "New custom type" row at the bottom.
 *
 * Calls `onSelectEntry(kind)` for every row including 'workout'. The parent
 * (the OverlayTree under the app/ layout) decides how to handle each kind
 * (e.g. router.push to /app/workout vs open a logger overlay).
 */
export function AddEntrySheet({ isOpen, onClose, onSelectEntry }: AddEntrySheetProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "oklch(14% 0.01 60 / 0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full overflow-y-auto"
        style={{
          maxWidth: 480,
          background: "var(--color-card)",
          borderRadius: "24px 24px 0 0",
          padding: "20px 20px calc(20px + env(safe-area-inset-bottom, 0px))",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <div className="font-extrabold" style={{ fontSize: 18, letterSpacing: "-0.015em" }}>
            Log an entry
          </div>
          <button
            onClick={onClose}
            className="flex cursor-pointer items-center justify-center rounded-[10px]"
            style={{
              width: 36,
              height: 36,
              border: 0,
              background: "var(--color-secondary)",
              color: "var(--color-muted-foreground)",
            }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div
          style={{
            fontSize: 13,
            color: "var(--color-muted-foreground)",
            marginBottom: 14,
          }}
        >
          Pick a type to log.
        </div>

        {/* Built-in entry types */}
        <div className="flex flex-col gap-2">
          {ENTRY_MODULES.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                onSelectEntry(m.id);
              }}
              className="font-inherit flex w-full cursor-pointer items-center gap-3 rounded-2xl text-left transition-all"
              style={{
                padding: "12px 16px",
                border: "1px solid var(--color-border)",
                background: `var(--hue-${m.hue}-wash)`,
                fontFamily: "inherit",
              }}
            >
              <div
                className="flex shrink-0 items-center justify-center rounded-[13px]"
                style={{
                  width: 44,
                  height: 44,
                  background: `var(--hue-${m.hue})`,
                  color: "#fff",
                }}
              >
                <Icon name={m.icon} size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="font-extrabold"
                  style={{
                    fontSize: 15,
                    color: `var(--hue-${m.hue}-ink)`,
                  }}
                >
                  {m.label}
                </div>
              </div>
              <span style={{ color: `var(--hue-${m.hue}-ink)`, opacity: 0.5 }}>
                <Icon name="chevron-right" size={18} />
              </span>
            </button>
          ))}

          {/* New custom type row */}
          <button
            onClick={() => {
              onSelectEntry("custom");
            }}
            className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-2xl text-left transition-all"
            style={{
              padding: "12px 16px",
              border: "2px dashed var(--color-border)",
              background: "transparent",
              fontFamily: "inherit",
            }}
          >
            <div
              className="flex shrink-0 items-center justify-center rounded-[13px]"
              style={{
                width: 44,
                height: 44,
                background: "var(--color-secondary)",
              }}
            >
              <span style={{ color: "var(--color-muted-foreground)" }}>
                <Icon name="plus" size={22} />
              </span>
            </div>
            <div>
              <div className="font-extrabold" style={{ fontSize: 15 }}>
                New custom type
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--color-muted-foreground)",
                  marginTop: 2,
                }}
              >
                Define your own entry type
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// Re-export the kind type for convenience
export type { ActiveLoggerKind };
