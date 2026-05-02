"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Icon, ProgressRing } from "@open-sharia-enterprise/ts-ui";
import { fmtTime } from "@/shared/utils/fmt";

export interface SetTimerSheetProps {
  /** 1-based set index for the header. */
  setIndex: number;
  /** Total number of sets in this exercise. */
  totalSets: number;
  exerciseName: string;
  /** Target duration in seconds for countdown mode. null = count-up. */
  targetDuration: number | null;
  timerMode: "countdown" | "countup";
  onComplete: (data: { duration: number }) => void;
  onClose: () => void;
}

/**
 * Full-screen overlay for timing a duration-based exercise set.
 *
 * - Countdown mode: counts down from targetDuration; marks "Target reached!" when done.
 * - Count-up mode: counts upward indefinitely until user taps Done.
 * Uses local useState + useRef for its own interval — separate from the
 * workoutSessionMachine's TICK interval in WorkoutScreen.
 */
export function SetTimerSheet({
  setIndex,
  totalSets,
  exerciseName,
  targetDuration,
  timerMode,
  onComplete,
  onClose,
}: SetTimerSheetProps) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isCountdown = timerMode === "countdown" && targetDuration != null;

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (isCountdown && targetDuration != null && next >= targetDuration) {
          setRunning(false);
          setFinished(true);
          return targetDuration;
        }
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [running, isCountdown, targetDuration]);

  const displayTime = isCountdown && targetDuration != null ? Math.max(0, targetDuration - elapsed) : elapsed;
  const progress =
    targetDuration != null && targetDuration > 0
      ? isCountdown
        ? 1 - elapsed / targetDuration
        : Math.min(elapsed / targetDuration, 1)
      : null;
  const ringColor = finished
    ? "var(--hue-sage)"
    : isCountdown && elapsed > (targetDuration ?? 0) * 0.8
      ? "var(--hue-honey)"
      : "var(--hue-teal)";

  function handleDone() {
    setRunning(false);
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    onComplete({ duration: elapsed });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 250,
        background: "var(--color-background)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              color: "var(--color-muted-foreground)",
              fontWeight: 500,
            }}
          >
            Set {setIndex} of {totalSets}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.015em" }}>{exerciseName}</div>
        </div>
        <button
          type="button"
          aria-label="Close timer"
          onClick={onClose}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: 0,
            background: "var(--color-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-muted-foreground)",
          }}
        >
          <Icon name="x" size={20} />
        </button>
      </div>

      {/* Timer display */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: 32,
        }}
      >
        <div style={{ position: "relative" }}>
          {progress !== null && (
            <ProgressRing size={200} stroke={10} progress={progress} color={ringColor} bg="var(--warm-100)" />
          )}
          <div
            style={{
              position: progress !== null ? "absolute" : "relative",
              inset: progress !== null ? 0 : "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: progress !== null ? 48 : 64,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: finished ? "var(--hue-sage-ink)" : "var(--color-foreground)",
              }}
            >
              {fmtTime(displayTime)}
            </div>
            {targetDuration != null && !finished && (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--color-muted-foreground)",
                  fontWeight: 500,
                }}
              >
                {isCountdown ? `target: ${fmtTime(targetDuration)}` : `goal: ${fmtTime(targetDuration)}`}
              </div>
            )}
            {finished && (
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--hue-sage-ink)",
                  marginTop: 4,
                }}
              >
                Target reached!
              </div>
            )}
          </div>
        </div>

        {/* Mode label */}
        <div
          style={{
            fontSize: 13,
            color: "var(--color-muted-foreground)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="timer" size={15} />
          {isCountdown ? "Counting down" : "Counting up"}
          {!running && elapsed === 0 && " — tap Start to begin"}
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          padding: "0 20px calc(32px + env(safe-area-inset-bottom,0))",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {!finished ? (
          <>
            <Button variant="teal" size="xl" style={{ width: "100%" }} onClick={() => setRunning((r) => !r)}>
              <Icon name={running ? "timer" : "play"} size={20} />
              {running ? "Pause" : elapsed > 0 ? "Resume" : "Start"}
            </Button>
            {elapsed > 0 && (
              <Button variant="outline" size="lg" style={{ width: "100%" }} onClick={handleDone}>
                Done — log {fmtTime(elapsed)}
              </Button>
            )}
          </>
        ) : (
          <Button variant="sage" size="xl" style={{ width: "100%" }} onClick={handleDone}>
            <Icon name="check" size={20} />
            Log {fmtTime(elapsed)} and continue
          </Button>
        )}
        {elapsed === 0 && (
          <Button
            variant="ghost"
            size="default"
            style={{ width: "100%", color: "var(--color-muted-foreground)" }}
            onClick={onClose}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
