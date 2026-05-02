"use client";

import { Button } from "@open-sharia-enterprise/ts-ui";
import { ProgressRing } from "@open-sharia-enterprise/ts-ui";
import { fmtTime } from "@/shared/utils/fmt";

export interface RestTimerProps {
  /** Seconds remaining from machine context. Updated by TICK events from WorkoutScreen. */
  restSecsLeft: number;
  /** Original total rest duration — used to compute progress ring fill. */
  totalRest: number;
  onSkip: () => void;
}

/**
 * Sticky bottom banner displayed while workoutSessionMachine is in active.resting.
 *
 * This component is display-only. It does NOT run its own setInterval — the
 * TICK event is sent by WorkoutScreen via a useRef interval, decrementing
 * restSecsLeft in the machine context.
 */
export function RestTimer({ restSecsLeft, totalRest, onSkip }: RestTimerProps) {
  const isOver = restSecsLeft <= 0;
  const progress = isOver ? 0 : totalRest > 0 ? restSecsLeft / totalRest : 0;
  const ringColor = isOver ? "var(--hue-honey)" : "var(--hue-teal)";

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "var(--color-card)",
        borderTop: "1px solid var(--color-border)",
        padding: "14px 16px calc(14px + env(safe-area-inset-bottom,0))",
        boxShadow: "0 -4px 16px oklch(20% 0.02 60 / 0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Progress ring with countdown text */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <ProgressRing size={64} stroke={5} progress={progress} color={ringColor} bg="var(--warm-100)" />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              fontSize: 13,
              color: isOver ? "var(--hue-honey-ink)" : "var(--hue-teal-ink)",
            }}
          >
            {isOver ? `+${fmtTime(Math.abs(restSecsLeft))}` : fmtTime(restSecsLeft)}
          </div>
        </div>

        {/* Status text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {isOver ? "Rest over — whenever you're ready" : "Resting…"}
          </div>
          <div style={{ fontSize: 13, color: "var(--color-muted-foreground)", marginTop: 2 }}>
            {isOver ? `+${fmtTime(Math.abs(restSecsLeft))} over target` : `${fmtTime(restSecsLeft)} remaining`}
          </div>
        </div>

        {/* Skip button */}
        <div style={{ flexShrink: 0 }}>
          <Button
            size="sm"
            variant="ghost"
            onClick={onSkip}
            style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
