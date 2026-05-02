"use client";

import { Icon } from "@open-sharia-enterprise/ts-ui";
import { Badge } from "@open-sharia-enterprise/ts-ui";
import type { JournalEntry } from "@/contexts/journal/domain/schema";
import { kindToHue, kindToIcon } from "./kind-hue";

interface EntryDetailSheetProps {
  entry: JournalEntry | null;
  onClose: () => void;
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

type StatField = [string, string | number];

function buildStatFields(entry: JournalEntry): StatField[] {
  const p = entry.payload as Record<string, unknown>;
  const name = String(entry.name);
  const fields: StatField[] = [];

  if (name === "reading") {
    if (typeof p["author"] === "string") fields.push(["Author", p["author"]]);
    if (typeof p["pages"] === "number") fields.push(["Pages read", p["pages"]]);
    if (typeof p["completionPct"] === "number") fields.push(["Progress", `${p["completionPct"]}%`]);
  }
  if (name === "learning") {
    if (typeof p["source"] === "string") fields.push(["Source", p["source"]]);
    if (typeof p["rating"] === "number") fields.push(["Quality", "⭐".repeat(p["rating"] as number)]);
  }
  if (name === "meal") {
    if (typeof p["mealType"] === "string") fields.push(["Meal type", p["mealType"]]);
    if (typeof p["energyLevel"] === "number") fields.push(["Energy after", "⚡".repeat(p["energyLevel"] as number)]);
  }
  if (name === "focus") {
    if (typeof p["quality"] === "number") fields.push(["Focus quality", "🧠".repeat(p["quality"] as number)]);
  }
  if (name === "workout") {
    const exercises = Array.isArray(p["exercises"]) ? (p["exercises"] as Array<Record<string, unknown>>) : [];
    const sets = exercises.reduce((n, ex) => n + (Array.isArray(ex["sets"]) ? ex["sets"].length : 0), 0);
    if (sets > 0) fields.push(["Sets done", sets]);
  }

  const mins = getDurationMins(entry);
  if (mins != null) fields.push(["Duration", `${mins} min`]);

  return fields;
}

/**
 * Bottom sheet overlay showing full detail of a journal entry.
 * Slides up from the bottom; backdrop click dismisses.
 */
export function EntryDetailSheet({ entry, onClose }: EntryDetailSheetProps) {
  if (!entry) return null;

  const name = String(entry.name);
  const hue = kindToHue(name);
  const icon = kindToIcon(name);

  const p = entry.payload as Record<string, unknown>;
  const displayTitle =
    (typeof p["routineName"] === "string" && p["routineName"]) ||
    (typeof p["title"] === "string" && p["title"]) ||
    (typeof p["subject"] === "string" && p["subject"]) ||
    (typeof p["name"] === "string" && p["name"]) ||
    name;

  const dateStr = new Date(entry.startedAt).toLocaleDateString("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeStr = new Date(entry.startedAt).toLocaleTimeString("en", {
    hour: "numeric",
    minute: "2-digit",
  });

  const fields = buildStatFields(entry);
  const notes = typeof p["notes"] === "string" ? p["notes"] : null;
  const kindLabel = name.startsWith("custom-") ? name.slice(7) : name;
  const filteredLabels = (Array.isArray(entry.labels) ? entry.labels : []).filter((l) => l !== name);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 400,
        background: "oklch(14% 0.01 60 / 0.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--color-card)",
          borderRadius: "24px 24px 0 0",
          padding: "20px 20px calc(24px + env(safe-area-inset-bottom, 0))",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                background: `var(--hue-${hue})`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name={icon} size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.01em" }}>{displayTitle}</div>
              <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 2 }}>
                {dateStr} · {timeStr}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: 0,
              background: "var(--color-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-muted-foreground)",
            }}
            aria-label="Close"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Stat grid */}
        {fields.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {fields.map(([label, value]) => (
              <div
                key={label}
                style={{
                  background: "var(--color-secondary)",
                  borderRadius: 12,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--color-muted-foreground)",
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                    marginBottom: 3,
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {notes && (
          <div
            style={{
              background: "var(--color-secondary)",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 13,
              lineHeight: 1.6,
              color: "var(--color-foreground)",
            }}
          >
            {notes}
          </div>
        )}

        {/* Label chips */}
        {filteredLabels.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {filteredLabels.map((l) => (
              <Badge key={l} variant="outline" size="sm" hue={hue}>
                {l}
              </Badge>
            ))}
          </div>
        )}

        {/* Kind badge at bottom */}
        <div>
          <Badge variant="outline" size="sm" hue={hue}>
            {kindLabel}
          </Badge>
        </div>
      </div>
    </div>
  );
}
