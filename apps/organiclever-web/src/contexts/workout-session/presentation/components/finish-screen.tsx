"use client";

import { AppHeader, Button, Icon, StatCard } from "@open-sharia-enterprise/ts-ui";
import type { CompletedSession } from "@/contexts/app-shell/presentation/app-machine";
import { fmtTime } from "@/shared/utils/fmt";

export interface FinishScreenProps {
  completedSession: CompletedSession;
  onBack: () => void;
}

/**
 * Post-workout summary screen shown after a workout is saved.
 *
 * Shows:
 * - "Nice work." heading + "Workout complete" subtitle
 * - 3 mono summary stat cards: Duration, Sets Done, Exercises
 * - Per-exercise breakdown list with progress bars
 * - "Back to home" teal button
 */
export function FinishScreen({ completedSession, onBack }: FinishScreenProps) {
  const { durationSecs, exercises, routineName } = completedSession;
  const totalSets = exercises.reduce((n, e) => n + e.sets, 0);

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        padding: "0 20px 32px",
      }}
    >
      <AppHeader title="Nice work." subtitle="Workout complete" onBack={onBack} />

      {/* Hero card */}
      <div
        style={{
          background: "linear-gradient(160deg, var(--hue-teal-wash), var(--color-card))",
          borderRadius: 24,
          padding: 24,
          textAlign: "center",
          border: "1px solid var(--color-border)",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            background: "var(--hue-teal)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
            boxShadow: "0 8px 24px oklch(68% 0.10 195 / 0.3)",
          }}
        >
          <Icon name="check" size={38} />
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.015em",
            marginTop: 14,
          }}
        >
          {routineName ?? "Quick workout"}
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <StatCard label="Duration" value={fmtTime(durationSecs)} unit="" hue="honey" icon="clock" />
        <StatCard label="Sets done" value={String(totalSets)} unit="sets" hue="teal" icon="dumbbell" />
        <StatCard label="Exercises" value={String(exercises.length)} unit="done" hue="sage" icon="zap" />
      </div>

      {/* Exercise breakdown */}
      {exercises.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              marginBottom: 10,
            }}
          >
            Exercise breakdown
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {exercises.map((ex, i) => (
              <div
                key={i}
                style={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 14,
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{ex.name}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--hue-sage-ink)",
                      fontWeight: 700,
                    }}
                  >
                    {ex.sets} sets
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back button */}
      <div style={{ marginTop: "auto" }}>
        <Button variant="teal" size="xl" style={{ width: "100%" }} onClick={onBack}>
          Back to home
        </Button>
      </div>
    </div>
  );
}
