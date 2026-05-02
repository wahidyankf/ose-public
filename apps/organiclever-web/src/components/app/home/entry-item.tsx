"use client";

import { Icon } from "@open-sharia-enterprise/ts-ui";
import { Badge } from "@open-sharia-enterprise/ts-ui";
import type { JournalEntry } from "@/contexts/journal/domain/schema";
import { kindToHue, kindToIcon } from "./kind-hue";

interface EntryItemProps {
  entry: JournalEntry;
  onClick?: () => void;
}

function getDurationMins(entry: JournalEntry): number | null {
  const p = entry.payload as Record<string, unknown>;
  if (typeof p["durationMins"] === "number" && p["durationMins"] > 0) {
    return p["durationMins"] as number;
  }
  if (typeof p["durationSecs"] === "number" && p["durationSecs"] > 0) {
    return Math.round((p["durationSecs"] as number) / 60);
  }
  return null;
}

/**
 * Single-row entry item with icon, name, time/duration sub-row, and kind badge.
 */
export function EntryItem({ entry, onClick }: EntryItemProps) {
  const name = String(entry.name);
  const hue = kindToHue(name);
  const icon = kindToIcon(name);
  const mins = getDurationMins(entry);

  const timeStr = new Date(entry.startedAt).toLocaleTimeString("en", {
    hour: "numeric",
    minute: "2-digit",
  });

  // Display label: use payload title/subject/name if available
  const p = entry.payload as Record<string, unknown>;
  const displayLabel =
    (typeof p["routineName"] === "string" && p["routineName"]) ||
    (typeof p["title"] === "string" && p["title"]) ||
    (typeof p["subject"] === "string" && p["subject"]) ||
    (typeof p["name"] === "string" && p["name"]) ||
    name;

  // Kind label for the badge — strip "custom-" prefix for display
  const kindLabel = name.startsWith("custom-") ? name.slice(7) : name;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid var(--color-border)",
        cursor: onClick ? "pointer" : "default",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: `var(--hue-${hue})`,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={17} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayLabel}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--color-muted-foreground)",
            marginTop: 1,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <span>{timeStr}</span>
          {mins != null && mins > 0 && (
            <>
              <span
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "var(--warm-300)",
                  flexShrink: 0,
                }}
              />
              <span>{mins} min</span>
            </>
          )}
        </div>
      </div>
      <Badge variant="default" size="sm" hue={hue} style={{ flexShrink: 0 }}>
        {kindLabel}
      </Badge>
    </div>
  );
}
