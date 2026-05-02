"use client";

import { useState, useEffect } from "react";
import { StatCard, Icon } from "@open-sharia-enterprise/ts-ui";
import { getVolume } from "@/lib/journal/stats";
import type { WeeklyStats } from "@/lib/journal/stats";
import type { JournalRuntime } from "@/contexts/journal/infrastructure/runtime";
import type { Routine } from "@/lib/journal/routine-store";
import { RoutineCard } from "./routine-card";

interface WorkoutModuleViewProps {
  stats: WeeklyStats;
  routines: Routine[];
  onStartWorkout: (routine?: Routine) => void;
  onEditRoutine: (routine?: Routine) => void;
  runtime: JournalRuntime;
}

const VOLUME_RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "3m", days: 90 },
  { label: "6m", days: 180 },
  { label: "1y", days: 365 },
] as const;

function fmtMins(m: number): string {
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}`;
  return String(Math.round(m));
}

function fmtKg(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k`;
  return String(Math.round(kg));
}

/**
 * Workout-specific module view showing stats, volume card, and routine list.
 */
export function WorkoutModuleView({ stats, routines, onStartWorkout, onEditRoutine, runtime }: WorkoutModuleViewProps) {
  const [volRange, setVolRange] = useState<number>(30);
  const [volumeKg, setVolumeKg] = useState<number>(0);

  useEffect(() => {
    runtime
      .runPromise(getVolume(volRange))
      .then(setVolumeKg)
      .catch(() => {});
  }, [volRange, runtime]);

  return (
    <>
      {/* Stats grid */}
      <div style={{ padding: "8px 20px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <StatCard
          label="Sessions"
          value={stats.workoutsThisWeek}
          unit="/ 7d"
          hue="teal"
          icon="dumbbell"
          info="Workout sessions logged in the last 7 rolling days."
        />
        <StatCard
          label="Streak"
          value={stats.streak}
          unit="wks"
          hue="terracotta"
          icon="flame"
          info="Consecutive weeks with 2+ workout sessions."
        />
        <StatCard
          label="Time moved"
          value={fmtMins(stats.totalMins)}
          unit="min"
          hue="honey"
          icon="clock"
          info="Total workout time in the last 7 days."
        />
        <StatCard
          label="Sets done"
          value={stats.totalSets}
          unit="sets"
          hue="sage"
          icon="zap"
          info="Total sets in the last 7 days."
        />
      </div>

      {/* Volume card */}
      <div style={{ padding: "8px 20px 0" }}>
        <div
          style={{
            background: "var(--color-card)",
            borderRadius: 18,
            padding: 12,
            border: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "var(--hue-plum)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="trend" size={17} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    letterSpacing: "-0.015em",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {fmtKg(volumeKg)}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      marginLeft: 4,
                      fontFamily: "var(--font-sans)",
                      color: "var(--color-muted-foreground)",
                    }}
                  >
                    kg
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", fontWeight: 600 }}>
                  Volume · {VOLUME_RANGES.find((r) => r.days === volRange)?.label}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {VOLUME_RANGES.map((r) => (
                <button
                  key={r.days}
                  onClick={() => setVolRange(r.days)}
                  style={{
                    minHeight: 26,
                    padding: "0 8px",
                    borderRadius: 7,
                    border: "1px solid",
                    borderColor: volRange === r.days ? "var(--hue-plum)" : "var(--color-border)",
                    background: volRange === r.days ? "var(--hue-plum)" : "transparent",
                    color: volRange === r.days ? "#fff" : "var(--color-muted-foreground)",
                    fontFamily: "inherit",
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Workout templates header */}
      <div
        style={{
          padding: "12px 20px 4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800 }}>Workout templates</div>
        <button
          onClick={() => onEditRoutine(undefined)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "5px 10px",
            borderRadius: 8,
            border: "1px solid var(--color-border)",
            background: "transparent",
            fontFamily: "inherit",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
            color: "var(--color-foreground)",
          }}
        >
          <Icon name="plus" size={13} />
          New
        </button>
      </div>

      {/* Routine list */}
      <div style={{ padding: "4px 20px 28px", display: "flex", flexDirection: "column", gap: 8 }}>
        {routines.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "24px 0",
              color: "var(--color-muted-foreground)",
              fontSize: 14,
            }}
          >
            No templates yet. Tap &ldquo;New&rdquo; to create one.
          </div>
        ) : (
          routines.map((r) => (
            <RoutineCard key={r.id} routine={r} onStart={() => onStartWorkout(r)} onEdit={() => onEditRoutine(r)} />
          ))
        )}
      </div>
    </>
  );
}
