"use client";

import { useState, useEffect } from "react";
import type { JournalRuntime } from "@/contexts/journal/infrastructure/runtime";
import { getExerciseProgress, getLast7Days } from "@/lib/journal/stats";
import type { ExerciseProgress, DayEntry } from "@/lib/journal/stats";
import { InfoTip } from "@open-sharia-enterprise/ts-ui";
import { ExerciseProgressCard } from "./exercise-progress-card";

// ---------------------------------------------------------------------------
// Module definitions
// ---------------------------------------------------------------------------

type ModuleId = "workout" | "reading" | "learning" | "meal" | "focus";

const PROGRESS_MODULES: ReadonlyArray<{ id: ModuleId; label: string }> = [
  { id: "workout", label: "Workout" },
  { id: "reading", label: "Reading" },
  { id: "learning", label: "Learning" },
  { id: "meal", label: "Meal" },
  { id: "focus", label: "Focus" },
];

const HISTORY_RANGES: ReadonlyArray<{ label: string; days: number }> = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "3m", days: 90 },
  { label: "6m", days: 180 },
  { label: "1y", days: 365 },
];

const HUE_BY_MODULE: Record<ModuleId, string> = {
  workout: "teal",
  reading: "plum",
  learning: "honey",
  meal: "terracotta",
  focus: "sky",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProgressScreenProps {
  runtime: JournalRuntime;
  refreshKey?: number;
}

// ---------------------------------------------------------------------------
// ActivityBars — 7-day bar chart for non-workout modules
// ---------------------------------------------------------------------------

interface ActivityBarsProps {
  days: ReadonlyArray<DayEntry>;
  moduleId: ModuleId;
  totalCount: number;
}

function ActivityBars({ days, moduleId, totalCount }: ActivityBarsProps) {
  const hue = HUE_BY_MODULE[moduleId];
  const maxSessions = Math.max(...days.map((d) => d.sessions), 1);

  return (
    <div
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        padding: "14px 14px 10px",
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
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: ".06em",
          }}
        >
          Last 7 days
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: `var(--hue-${hue}-ink)`,
          }}
        >
          {totalCount} total
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
        {days.map((d, i) => {
          const barHeight = d.sessions > 0 ? Math.max(4, Math.round((d.sessions / maxSessions) * 52)) : 0;
          const isToday = new Date().toDateString() === d.date.toDateString();

          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  height: 52,
                }}
              >
                <div
                  style={{
                    width: "70%",
                    height: `${d.sessions > 0 ? barHeight : 3}px`,
                    borderRadius: 4,
                    background:
                      d.sessions > 0 ? (isToday ? `var(--hue-${hue})` : `var(--hue-${hue}-wash)`) : "var(--warm-100)",
                    border: d.sessions > 0 ? "none" : "1px solid var(--warm-200)",
                    transition: "height 400ms ease-out",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: isToday ? 800 : 500,
                  color: isToday ? `var(--hue-${hue}-ink)` : "var(--color-muted-foreground)",
                }}
              >
                {d.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

function EmptyState({ message, sub }: { message: string; sub: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 20px",
        color: "var(--color-muted-foreground)",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700 }}>{message}</div>
      <div style={{ fontSize: 13, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProgressScreen
// ---------------------------------------------------------------------------

export function ProgressScreen({ runtime, refreshKey }: ProgressScreenProps) {
  const [activeModule, setActiveModule] = useState<ModuleId>("workout");
  const [rangeIdx, setRangeIdx] = useState(1);
  const [groupBy, setGroupBy] = useState<"exercise" | "routine">("exercise");

  const [exerciseProgress, setExerciseProgress] = useState<Record<string, ExerciseProgress>>({});
  const [last7Days, setLast7Days] = useState<ReadonlyArray<DayEntry>>([]);

  const range = HISTORY_RANGES[rangeIdx] ?? HISTORY_RANGES[1]!;

  // Load workout progress whenever module, range, or refreshKey changes
  useEffect(() => {
    if (activeModule !== "workout") return;

    runtime
      .runPromise(getExerciseProgress(range.days))
      .then((result) => setExerciseProgress(result))
      .catch(() => setExerciseProgress({}));
  }, [activeModule, range.days, refreshKey, runtime]);

  // Load last-7-days for non-workout modules
  useEffect(() => {
    if (activeModule === "workout") return;

    runtime
      .runPromise(getLast7Days())
      .then((result) => setLast7Days(result))
      .catch(() => setLast7Days([]));
  }, [activeModule, refreshKey, runtime]);

  // Derived workout data
  const exercises = Object.entries(exerciseProgress).filter(([, d]) => d.points.length >= 1);

  const byRoutine: Record<string, Array<[string, ExerciseProgress]>> = {};
  exercises.forEach(([name, data]) => {
    const rn = data.routineName ?? "Quick workout";
    if (!byRoutine[rn]) byRoutine[rn] = [];
    byRoutine[rn].push([name, data]);
  });

  // Derived non-workout data
  const totalCount = last7Days.reduce((n, d) => n + d.sessions, 0);

  const activeModuleConfig = PROGRESS_MODULES.find((m) => m.id === activeModule) ?? PROGRESS_MODULES[0]!;
  const activeHue = HUE_BY_MODULE[activeModule];

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 20px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "-0.015em",
                color: "var(--color-foreground)",
              }}
            >
              Analytics
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--color-muted-foreground)",
                marginTop: 2,
              }}
            >
              Patterns &amp; progress over time
            </div>
          </div>
          <InfoTip
            title="Analytics"
            text="Tracks your performance per entry type over the selected time range. Tap an exercise card to expand charts. ★ marks a personal record. 1RM estimated via Brzycki formula (valid 1–10 reps)."
          />
        </div>
      </div>

      {/* Module pill tabs */}
      <div style={{ padding: "14px 20px 0" }}>
        <div
          style={{
            display: "flex",
            gap: 7,
            overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
          }}
        >
          {PROGRESS_MODULES.map((m) => {
            const active = activeModule === m.id;
            const hue = HUE_BY_MODULE[m.id];
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveModule(m.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                  padding: "7px 13px",
                  borderRadius: 20,
                  border: "1px solid",
                  borderColor: active ? `var(--hue-${hue})` : "var(--color-border)",
                  background: active ? `var(--hue-${hue}-wash)` : "var(--color-card)",
                  color: active ? `var(--hue-${hue}-ink)` : "var(--color-muted-foreground)",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 150ms",
                  WebkitTapHighlightColor: "transparent",
                }}
                aria-pressed={active}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Range picker + group-by toggle */}
      <div style={{ padding: "14px 20px 0" }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 5, flex: 1 }}>
            {HISTORY_RANGES.map((r, i) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setRangeIdx(i)}
                style={{
                  flex: 1,
                  minHeight: 32,
                  borderRadius: 8,
                  border: "1px solid",
                  borderColor: rangeIdx === i ? `var(--hue-${activeHue})` : "var(--color-border)",
                  background: rangeIdx === i ? `var(--hue-${activeHue})` : "transparent",
                  color: rangeIdx === i ? "#fff" : "var(--color-muted-foreground)",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 150ms",
                }}
                aria-pressed={rangeIdx === i}
              >
                {r.label}
              </button>
            ))}
          </div>

          {activeModule === "workout" && (
            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
              {(["exercise", "routine"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroupBy(g)}
                  style={{
                    minHeight: 32,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1px solid",
                    borderColor: groupBy === g ? "var(--hue-plum)" : "var(--color-border)",
                    background: groupBy === g ? "var(--hue-plum-wash)" : "transparent",
                    color: groupBy === g ? "var(--hue-plum-ink)" : "var(--color-muted-foreground)",
                    fontFamily: "inherit",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 150ms",
                    textTransform: "capitalize",
                  }}
                  aria-pressed={groupBy === g}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div
        style={{
          padding: "14px 20px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Workout module */}
        {activeModule === "workout" && (
          <>
            {exercises.length === 0 ? (
              <EmptyState message="No workout data yet" sub="Log a workout to see progress here." />
            ) : groupBy === "exercise" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {exercises.map(([name, data]) => (
                  <ExerciseProgressCard key={name} name={name} progress={data} />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {Object.entries(byRoutine).map(([routineName, exs]) => (
                  <div key={routineName}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        color: "var(--color-muted-foreground)",
                        marginBottom: 8,
                        padding: "0 2px",
                      }}
                    >
                      {routineName}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {exs.map(([name, data]) => (
                        <ExerciseProgressCard key={name} name={name} progress={data} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Non-workout modules */}
        {activeModule !== "workout" && (
          <>
            {totalCount === 0 ? (
              <EmptyState
                message={`No ${activeModuleConfig.label.toLowerCase()} sessions yet`}
                sub={`Log a ${activeModuleConfig.label.toLowerCase()} session to see your patterns here.`}
              />
            ) : (
              <ActivityBars days={last7Days} moduleId={activeModule} totalCount={totalCount} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
