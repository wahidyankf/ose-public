"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@open-sharia-enterprise/ts-ui";
import { getLast7Days, getWeeklyStats } from "@/lib/journal/stats";
import { listEntries } from "@/contexts/journal/application";
import { listRoutines } from "@/contexts/routine/application";
import type { JournalRuntime, JournalEntry } from "@/contexts/journal/application";
import type { DayEntry, WeeklyStats } from "@/lib/journal/stats";
import type { Routine } from "@/contexts/routine/application";
import { ENTRY_MODULES } from "./kind-hue";
import { WeekRhythmStrip } from "./week-rhythm-strip";
import { EntryItem } from "./entry-item";
import { EntryDetailSheet } from "./entry-detail-sheet";
import { WorkoutModuleView } from "./workout-module-view";

interface HomeScreenProps {
  runtime: JournalRuntime;
  onStartWorkout: (routine?: Routine) => void;
  onEditRoutine: (routine?: Routine) => void;
}

/**
 * Main home screen: week rhythm, filter chips, module views, and paginated entry list.
 */
export function HomeScreen({ runtime, onStartWorkout, onEditRoutine }: HomeScreenProps) {
  const [last7Days, setLast7Days] = useState<ReadonlyArray<DayEntry>>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    workoutsThisWeek: 0,
    streak: 0,
    totalMins: 0,
    totalSets: 0,
  });
  const [entries, setEntries] = useState<ReadonlyArray<JournalEntry>>([]);
  const [routines, setRoutines] = useState<ReadonlyArray<Routine>>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Load all data on mount
  useEffect(() => {
    runtime
      .runPromise(getLast7Days())
      .then(setLast7Days)
      .catch(() => {});
    runtime
      .runPromise(getWeeklyStats())
      .then(setWeeklyStats)
      .catch(() => {});
    runtime
      .runPromise(listEntries())
      .then(setEntries)
      .catch(() => {});
    runtime
      .runPromise(listRoutines())
      .then(setRoutines)
      .catch(() => {});
  }, [runtime]);

  // Infinite scroll
  useEffect(() => {
    const sentinel = loaderRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((n) => n + 10);
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [entries.length]);

  const dayName = new Date().toLocaleDateString("en", { weekday: "long" });
  const dateStr = new Date().toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Filter entries by active kind
  const filteredEntries =
    activeFilter == null
      ? entries
      : entries.filter((e) => String(e.name) === activeFilter || String(e.name).startsWith(`custom-`));

  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEntries.length;

  // Group visible entries by date
  const entriesByDate: Record<string, JournalEntry[]> = {};
  for (const entry of visibleEntries) {
    const d = new Date(entry.startedAt).toLocaleDateString("en", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (!entriesByDate[d]) entriesByDate[d] = [];
    entriesByDate[d].push(entry);
  }

  const totalWeek = entries.filter((e) => new Date(e.startedAt).getTime() >= Date.now() - 7 * 86400000).length;

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          padding: "20px 20px 0",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--color-muted-foreground)",
              marginBottom: 4,
            }}
          >
            {dayName} · {dateStr}
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
            }}
          >
            Good morning
          </div>
        </div>
      </div>

      {/* Week rhythm card */}
      <div
        style={{
          margin: "14px 20px 0",
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 18,
          padding: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: "var(--color-muted-foreground)",
              }}
            >
              Last 7 days
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 3 }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                {totalWeek}
              </span>
              <span style={{ fontSize: 13, color: "var(--color-muted-foreground)", fontWeight: 600 }}>
                entr{totalWeek !== 1 ? "ies" : "y"} logged
              </span>
            </div>
          </div>
        </div>
        <WeekRhythmStrip last7Days={last7Days} recentEntries={entries} />
      </div>

      {/* Filter chips */}
      <div style={{ padding: "14px 20px 0" }}>
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
          }}
        >
          <button
            onClick={() => {
              setActiveFilter(null);
              setVisibleCount(10);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              flexShrink: 0,
              padding: "6px 12px",
              borderRadius: 20,
              border: "1px solid",
              borderColor: activeFilter == null ? "var(--color-foreground)" : "var(--color-border)",
              background: activeFilter == null ? "var(--color-foreground)" : "var(--color-card)",
              color: activeFilter == null ? "var(--color-background)" : "var(--color-muted-foreground)",
              fontFamily: "inherit",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            All
          </button>
          {ENTRY_MODULES.map((m) => {
            const active = activeFilter === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveFilter(active ? null : m.id);
                  setVisibleCount(10);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  flexShrink: 0,
                  padding: "6px 12px",
                  borderRadius: 20,
                  border: "1px solid",
                  borderColor: active ? `var(--hue-${m.hue})` : "var(--color-border)",
                  background: active ? `var(--hue-${m.hue}-wash)` : "var(--color-card)",
                  color: active ? `var(--hue-${m.hue}-ink)` : "var(--color-muted-foreground)",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                <Icon name={m.icon} size={13} />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Workout module view */}
      {(activeFilter === "workout" || activeFilter == null) && (
        <WorkoutModuleView
          stats={weeklyStats}
          routines={routines as Routine[]}
          onStartWorkout={onStartWorkout}
          onEditRoutine={onEditRoutine}
          runtime={runtime}
        />
      )}

      {/* Entry list (shown when not workout-only filter) */}
      {activeFilter !== "workout" && (
        <div style={{ margin: "12px 20px 32px" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              color: "var(--color-muted-foreground)",
              marginBottom: 10,
            }}
          >
            {activeFilter == null ? "Recent entries" : `${activeFilter} entries`}
          </div>
          {filteredEntries.length === 0 ? (
            <div
              style={{
                padding: "32px 0",
                textAlign: "center",
                color: "var(--color-muted-foreground)",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>No entries yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Tap + to log your first entry</div>
            </div>
          ) : (
            <div
              style={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 16,
                padding: "0 14px",
              }}
            >
              {Object.entries(entriesByDate).map(([date, dateEntries]) => (
                <div key={date}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      color: "var(--color-muted-foreground)",
                      padding: "10px 0 4px",
                    }}
                  >
                    {date}
                  </div>
                  {dateEntries.map((entry) => (
                    <EntryItem key={entry.id} entry={entry} onClick={() => setSelectedEntry(entry)} />
                  ))}
                </div>
              ))}
              {hasMore && (
                <div
                  ref={loaderRef}
                  style={{
                    padding: "12px 0",
                    textAlign: "center",
                    fontSize: 13,
                    color: "var(--color-muted-foreground)",
                    fontWeight: 500,
                  }}
                >
                  Loading more…
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Entry detail sheet */}
      <EntryDetailSheet entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </div>
  );
}
