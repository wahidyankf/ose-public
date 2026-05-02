"use client";

import type { DayEntry } from "@/lib/journal/stats";
import type { JournalEntry } from "@/contexts/journal/application";
import { kindToHue } from "./kind-hue";

interface WeekRhythmStripProps {
  last7Days: ReadonlyArray<DayEntry>;
  recentEntries?: ReadonlyArray<JournalEntry>;
}

/**
 * 7-column flex bar chart showing the past 7 days of activity.
 * Each column has a colored height-proportional bar and a day label.
 */
export function WeekRhythmStrip({ last7Days, recentEntries = [] }: WeekRhythmStripProps) {
  const today = new Date().toDateString();

  // Build a map from dateString → most common kind that day
  const dayKindMap: Record<string, Record<string, number>> = {};
  for (const entry of Array.from(recentEntries)) {
    const d = new Date(entry.startedAt).toDateString();
    if (!dayKindMap[d]) dayKindMap[d] = {};
    const kind = String(entry.name);
    dayKindMap[d][kind] = (dayKindMap[d][kind] ?? 0) + 1;
  }

  const maxDuration = Math.max(...last7Days.map((d) => d.durationMins), 1);
  const BAR_MAX_PX = 60;
  const BAR_MIN_PX = 6;

  return (
    <div style={{ display: "flex", gap: 5, alignItems: "flex-end" }}>
      {last7Days.map((dayEntry, i) => {
        const dateStr = dayEntry.date.toDateString();
        const isToday = dateStr === today;
        const opacity = isToday ? 1 : 0.7;

        // Determine dominant kind for color
        const kindsForDay = dayKindMap[dateStr] ?? {};
        const dominantKind = Object.entries(kindsForDay).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "workout";
        const hue = kindToHue(dominantKind);

        const barHeight =
          dayEntry.durationMins > 0
            ? Math.max(BAR_MIN_PX, Math.round((dayEntry.durationMins / maxDuration) * BAR_MAX_PX))
            : 0;

        return (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 3,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                height: BAR_MAX_PX,
              }}
            >
              {barHeight > 0 ? (
                <div
                  style={{
                    height: barHeight,
                    borderRadius: 3,
                    background: `var(--hue-${hue})`,
                    opacity,
                    minHeight: BAR_MIN_PX,
                  }}
                />
              ) : (
                <div
                  style={{
                    height: 4,
                    borderRadius: 2,
                    background: "var(--warm-100)",
                    border: "1px solid var(--warm-200)",
                  }}
                />
              )}
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: isToday ? 800 : 500,
                color: isToday ? "var(--hue-teal-ink)" : "var(--color-muted-foreground)",
              }}
            >
              {isToday ? "Today" : dayEntry.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
