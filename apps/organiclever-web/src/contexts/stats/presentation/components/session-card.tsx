"use client";

import { useState } from "react";
import { Icon, Badge } from "@open-sharia-enterprise/ts-ui";
import type { JournalEntry } from "@/contexts/journal/application";
import { kindToHue, kindToIcon } from "@/contexts/app-shell/presentation/components/home/kind-hue";

interface SessionCardProps {
  entry: JournalEntry;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function durationMinsFromEntry(entry: JournalEntry): number {
  const p = entry.payload as Record<string, unknown>;
  if (typeof p["durationMins"] === "number") return Math.round(p["durationMins"]);
  if (typeof p["durationSecs"] === "number") return Math.round((p["durationSecs"] as number) / 60);
  return 0;
}

function totalSetsFromEntry(entry: JournalEntry): number {
  if (String(entry.name) !== "workout") return 0;
  const exercises = (entry.payload as Record<string, unknown>)["exercises"];
  if (!Array.isArray(exercises)) return 0;
  return exercises.reduce((acc: number, ex: unknown) => {
    const sets = (ex as Record<string, unknown>)["sets"];
    return acc + (Array.isArray(sets) ? sets.length : 0);
  }, 0);
}

function getDisplayTitle(entry: JournalEntry): string {
  const name = String(entry.name);
  const p = entry.payload as Record<string, unknown>;
  if (name === "reading") return String(p["title"] ?? "Reading session");
  if (name === "learning") return String(p["subject"] ?? "Learning session");
  if (name === "meal") return String(p["name"] ?? "Meal");
  if (name === "focus") return String(p["task"] ?? "Focus session");
  if (name.startsWith("custom-")) return String(p["name"] ?? "Custom entry");
  // workout
  return String(p["routineName"] ?? "Quick workout");
}

// ---------------------------------------------------------------------------
// Expanded detail sections
// ---------------------------------------------------------------------------

interface DetailProps {
  entry: JournalEntry;
}

function WorkoutDetail({ entry }: DetailProps) {
  const exercises = ((entry.payload as Record<string, unknown>)["exercises"] as unknown[] | undefined) ?? [];

  if (exercises.length === 0) {
    return <div style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>No exercises recorded.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {exercises.map((ex, i) => {
        const exObj = ex as Record<string, unknown>;
        const exName = String(exObj["name"] ?? "Exercise");
        const sets = Array.isArray(exObj["sets"]) ? (exObj["sets"] as Record<string, unknown>[]) : [];
        const targetSets = typeof exObj["targetSets"] === "number" ? exObj["targetSets"] : 0;

        return (
          <div key={i}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700 }}>{exName}</span>
              {targetSets > 0 && (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: sets.length >= targetSets ? "var(--hue-sage-ink)" : "var(--color-muted-foreground)",
                  }}
                >
                  {sets.length}/{targetSets} sets
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {sets.map((s, si) => {
                const duration = s["duration"] != null ? Number(s["duration"]) : null;
                const label =
                  duration != null
                    ? `${Math.floor(duration / 60) > 0 ? `${Math.floor(duration / 60)}m ` : ""}${duration % 60}s`
                    : [s["reps"] != null ? `${s["reps"]} reps` : null, s["weight"] ? `@ ${s["weight"]}` : null]
                        .filter(Boolean)
                        .join(" ");
                return (
                  <span
                    key={si}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: "var(--hue-teal-wash)",
                      color: "var(--hue-teal-ink)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {label}
                    {s["restSeconds"] ? ` · ${s["restSeconds"]}s rest` : ""}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReadingDetail({ entry }: DetailProps) {
  const p = entry.payload as Record<string, unknown>;
  const completionPct = p["completionPct"] != null ? Number(p["completionPct"]) : null;
  const pages = p["pages"] != null ? Number(p["pages"]) : null;
  const author = p["author"] != null ? String(p["author"]) : null;
  const durationMins = durationMinsFromEntry(entry);
  const notes = p["notes"] != null ? String(p["notes"]) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {completionPct != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              flex: 1,
              height: 6,
              background: "var(--warm-100)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${completionPct}%`,
                height: "100%",
                background: "var(--hue-plum)",
                borderRadius: 3,
              }}
            />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--hue-plum-ink)" }}>{completionPct}%</span>
        </div>
      )}
      {(pages != null || author != null) && (
        <div style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>
          {[pages != null ? `${pages} pages` : null, author].filter(Boolean).join(" · ")}
        </div>
      )}
      {durationMins > 0 && (
        <div style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>{durationMins} min</div>
      )}
      {notes && <NotesRow notes={notes} />}
    </div>
  );
}

function LearningDetail({ entry }: DetailProps) {
  const p = entry.payload as Record<string, unknown>;
  const quality = p["rating"] != null ? Number(p["rating"]) : null;
  const source = p["source"] != null ? String(p["source"]) : null;
  const durationMins = durationMinsFromEntry(entry);
  const notes = p["notes"] != null ? String(p["notes"]) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {quality != null && <div style={{ fontSize: 13 }}>Quality: {"⭐".repeat(Math.min(Math.max(quality, 0), 5))}</div>}
      {source && <div style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>Source: {source}</div>}
      {durationMins > 0 && (
        <div style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>{durationMins} min</div>
      )}
      {notes && <NotesRow notes={notes} />}
    </div>
  );
}

function MealDetail({ entry }: DetailProps) {
  const p = entry.payload as Record<string, unknown>;
  const mealType = p["mealType"] != null ? String(p["mealType"]) : null;
  const energyLevel = p["energyLevel"] != null ? Number(p["energyLevel"]) : null;
  const notes = p["notes"] != null ? String(p["notes"]) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {mealType && <div style={{ fontSize: 13, fontWeight: 600, color: "var(--hue-terracotta-ink)" }}>{mealType}</div>}
      {energyLevel != null && (
        <div style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>
          Energy after: {"⚡".repeat(Math.min(Math.max(energyLevel, 0), 5))}
        </div>
      )}
      {notes && <NotesRow notes={notes} />}
    </div>
  );
}

function FocusDetail({ entry }: DetailProps) {
  const p = entry.payload as Record<string, unknown>;
  const task = p["task"] != null ? String(p["task"]) : null;
  const durationMins = durationMinsFromEntry(entry);
  const quality = p["quality"] != null ? Number(p["quality"]) : null;
  const notes = p["notes"] != null ? String(p["notes"]) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {task && <div style={{ fontSize: 13, fontWeight: 600 }}>{task}</div>}
      {durationMins > 0 && (
        <div style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>{durationMins} min</div>
      )}
      {quality != null && (
        <div style={{ fontSize: 13 }}>Focus quality: {"🧠".repeat(Math.min(Math.max(quality, 0), 5))}</div>
      )}
      {notes && <NotesRow notes={notes} />}
    </div>
  );
}

function CustomDetail({ entry }: DetailProps) {
  const p = entry.payload as Record<string, unknown>;
  const hue = p["hue"] != null ? String(p["hue"]) : "sage";
  const icon = p["icon"] != null ? String(p["icon"]) : "plus-circle";
  const durationMins = durationMinsFromEntry(entry);
  const notes = p["notes"] != null ? String(p["notes"]) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: `var(--hue-${hue})`,
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon name={icon} size={13} />
        </span>
        <span style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>{hue}</span>
      </div>
      {durationMins > 0 && (
        <div style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>{durationMins} min</div>
      )}
      {notes && <NotesRow notes={notes} />}
    </div>
  );
}

function NotesRow({ notes }: { notes: string }) {
  return (
    <div
      style={{
        fontSize: 13,
        color: "var(--color-muted-foreground)",
        lineHeight: 1.5,
        padding: "6px 0",
        borderTop: "1px solid var(--color-border)",
        marginTop: 2,
      }}
    >
      {notes}
    </div>
  );
}

function ExpandedDetail({ entry }: { entry: JournalEntry }) {
  const name = String(entry.name);
  if (name === "workout") return <WorkoutDetail entry={entry} />;
  if (name === "reading") return <ReadingDetail entry={entry} />;
  if (name === "learning") return <LearningDetail entry={entry} />;
  if (name === "meal") return <MealDetail entry={entry} />;
  if (name === "focus") return <FocusDetail entry={entry} />;
  return <CustomDetail entry={entry} />;
}

// ---------------------------------------------------------------------------
// SessionCard
// ---------------------------------------------------------------------------

/**
 * Collapsible card for a single journal entry in the History screen.
 *
 * Collapsed view: icon chip, display title, date/time meta, duration/sets
 * summary, kind badge, and a chevron toggle.
 *
 * Expanded view: kind-specific detail section rendered below the header row.
 */
export function SessionCard({ entry }: SessionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const name = String(entry.name);
  const hue = kindToHue(name);
  const icon = kindToIcon(name);
  const displayTitle = getDisplayTitle(entry);
  const dateStr = formatDate(entry.startedAt);
  const timeStr = formatTime(entry.startedAt);
  const durationMins = durationMinsFromEntry(entry);
  const totalSets = totalSetsFromEntry(entry);

  // Capitalised kind label for the badge
  const kindLabel = name.startsWith("custom-")
    ? name.slice(7) || "custom"
    : name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <div
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Header row — tap to expand/collapse */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 12,
          padding: 14,
          border: 0,
          background: "transparent",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          color: "var(--color-foreground)",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div>
          {/* Title row with icon + name */}
          <div
            style={{
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: `var(--hue-${hue})`,
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name={icon} size={13} />
            </span>
            {displayTitle}
          </div>

          {/* Meta row: date/time, duration, sets, kind badge */}
          <div
            style={{
              fontSize: 12,
              color: "var(--color-muted-foreground)",
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span>
              {dateStr} · {timeStr}
            </span>
            {durationMins > 0 && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--warm-300)" }} />
                <span>{durationMins} min</span>
              </>
            )}
            {totalSets > 0 && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--warm-300)" }} />
                <span>{totalSets} sets</span>
              </>
            )}
            <Badge variant="outline" hue={hue} size="sm">
              {kindLabel}
            </Badge>
          </div>
        </div>

        <span style={{ color: "var(--color-muted-foreground)", marginTop: 2, flexShrink: 0 }}>
          <Icon name={expanded ? "chevron-up" : "chevron-down"} size={18} />
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            padding: "10px 14px 14px",
          }}
        >
          <ExpandedDetail entry={entry} />
        </div>
      )}
    </div>
  );
}
