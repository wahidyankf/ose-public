"use client";

import { Badge, Icon } from "@open-sharia-enterprise/ts-ui";
import type { ActiveExercise, CompletedSet } from "@/lib/journal/typed-payloads";
import type { CompletedSession } from "@/lib/app/app-machine";
import { fmtSpec, fmtTime } from "@/lib/utils/fmt";

// Re-export so other components can reference without importing typed-payloads
export type { CompletedSet };

export interface ActiveExerciseRowProps {
  exercise: ActiveExercise;
  /** When true, applies teal ring styling to indicate this is the "next up" exercise. */
  isActive: boolean;
  onLogSet: (setData: CompletedSet) => void;
  onEditSet?: (setIndex: number) => void;
  onStartTimer?: (setIndex: number) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

// Suppress the unused import warning — CompletedSession is used transitively
// (the type is needed by workout-screen.tsx which imports from this file).
// Keep the import to avoid re-exporting from a different location.
void (null as CompletedSession | null);

/**
 * Single exercise row inside the active workout scrollable list.
 *
 * Shows:
 * - Exercise name + day streak badge (honey outline)
 * - Spec line (fmtSpec) with timer icon for duration exercises
 * - Set buttons: pending = teal-wash, done = sage
 * - Move up / down arrow buttons
 * - Edit / timer actions per set type (via onEditSet / onStartTimer)
 */
export function ActiveExerciseRow({
  exercise,
  isActive,
  onLogSet,
  onEditSet,
  onStartTimer,
  onMoveUp,
  onMoveDown,
}: ActiveExerciseRowProps) {
  const { name, targetSets, targetReps, dayStreak, sets, type } = exercise;
  const isDuration = type === "duration";
  const isOneOff = type === "oneoff";
  const doneSets = sets.length;

  function handleCompleteRepsSet(idx: number) {
    const existing = sets[idx];
    if (existing) {
      // Tap on done set → open edit sheet
      onEditSet?.(idx);
    } else {
      // Tap on pending set → log with defaults
      onLogSet({
        reps: targetReps,
        weight: exercise.targetWeight,
        duration: null,
        restTaken: null,
      });
    }
  }

  function handleOneOff() {
    if (doneSets > 0) {
      onEditSet?.(0);
    } else {
      onLogSet({ reps: null, weight: null, duration: null, restTaken: null });
    }
  }

  return (
    <div
      style={{
        background: "var(--color-card)",
        border: `1px solid ${isActive ? "var(--hue-teal)" : "var(--color-border)"}`,
        borderRadius: 16,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxShadow: isActive ? "0 0 0 3px oklch(68% 0.10 195 / 0.12)" : "none",
        transition: "border-color 300ms, box-shadow 300ms",
      }}
    >
      {/* Name row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
            flex: 1,
          }}
        >
          <span
            style={{
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: "-0.01em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </span>
          {dayStreak > 0 && (
            <Badge hue="honey" variant="outline" size="sm" style={{ flexShrink: 0 }}>
              Day {dayStreak}
            </Badge>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              fontWeight: 700,
              color: doneSets >= targetSets ? "var(--hue-sage-ink)" : "var(--color-muted-foreground)",
            }}
          >
            {doneSets}/{targetSets}
          </span>
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              title="Move up"
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                border: 0,
                background: "var(--color-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-muted-foreground)",
                flexShrink: 0,
              }}
            >
              <Icon name="arrow-up" size={13} />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              title="Move down"
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                border: 0,
                background: "var(--color-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-muted-foreground)",
                flexShrink: 0,
              }}
            >
              <Icon name="arrow-down" size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Spec line */}
      <div
        style={{
          fontSize: 13,
          color: "var(--color-muted-foreground)",
          fontFamily: "var(--font-mono)",
          marginTop: -6,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {isDuration && (
          <span style={{ flexShrink: 0, display: "inline-flex" }}>
            <Icon name="timer" size={13} />
          </span>
        )}
        {fmtSpec(exercise)}
      </div>

      {/* Set buttons */}
      <div style={{ display: "flex", gap: 6 }}>
        {isOneOff ? (
          <button
            type="button"
            onClick={handleOneOff}
            style={{
              flex: 1,
              minHeight: 52,
              borderRadius: 12,
              border: "1px solid",
              borderColor: doneSets > 0 ? "transparent" : "var(--hue-teal)",
              background: doneSets > 0 ? "var(--hue-sage)" : "var(--hue-teal-wash)",
              color: doneSets > 0 ? "#fff" : "var(--hue-teal-ink)",
              fontFamily: "inherit",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 150ms",
            }}
          >
            {doneSets > 0 ? (
              <>
                <Icon name="check" size={18} /> Done
              </>
            ) : (
              <>Tap to log</>
            )}
          </button>
        ) : (
          Array.from({ length: targetSets }).map((_, i) => {
            const set = sets[i];
            const done = !!set;

            if (isDuration) {
              const logged = done && set.duration != null ? fmtTime(set.duration) : null;
              const isNext = i === doneSets;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => (done ? onEditSet?.(i) : onStartTimer?.(i))}
                  style={{
                    flex: 1,
                    minHeight: 52,
                    borderRadius: 12,
                    border: "1px solid",
                    borderColor: done ? "transparent" : isNext ? "var(--hue-teal)" : "var(--color-border)",
                    background: done ? "var(--hue-sage)" : isNext ? "var(--hue-teal-wash)" : "var(--color-card)",
                    color: done ? "#fff" : isNext ? "var(--hue-teal-ink)" : "var(--color-muted-foreground)",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    transition: "all 150ms",
                  }}
                >
                  {done ? (
                    <>
                      <Icon name="check" size={16} />
                      <span style={{ fontSize: 10, opacity: 0.85 }}>{logged}</span>
                    </>
                  ) : (
                    <>
                      <Icon name="play" size={16} />
                      <span style={{ fontSize: 10 }}>{i + 1}</span>
                    </>
                  )}
                </button>
              );
            }

            // Reps set button
            const isCurrentSet = i === doneSets;
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleCompleteRepsSet(i)}
                style={{
                  flex: isCurrentSet ? 2 : 1,
                  minHeight: 52,
                  borderRadius: 12,
                  border: "1px solid",
                  borderColor: done ? "transparent" : isCurrentSet ? "var(--hue-teal)" : "var(--color-border)",
                  background: done ? "var(--hue-sage)" : isCurrentSet ? "var(--hue-teal)" : "var(--color-card)",
                  color: done ? "#fff" : isCurrentSet ? "#fff" : "var(--color-muted-foreground)",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  transition: "all 150ms",
                }}
              >
                {done ? (
                  <>
                    <Icon name="check" size={16} />
                    <span
                      style={{
                        fontSize: 10,
                        opacity: 0.85,
                        fontFamily: "var(--font-mono)",
                        textAlign: "center",
                        lineHeight: 1.3,
                      }}
                    >
                      {set?.reps}
                      {set?.weight ? ` · ${set.weight}` : ""}
                    </span>
                  </>
                ) : isCurrentSet ? (
                  <>
                    <Icon name="check" size={18} />
                    <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "-0.01em" }}>Set {i + 1}</span>
                  </>
                ) : (
                  <span style={{ fontSize: 15, fontFamily: "var(--font-mono)" }}>{i + 1}</span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Progress bar for partially done sets */}
      {doneSets > 0 && doneSets < targetSets && (
        <div
          style={{
            height: 4,
            background: "var(--warm-100)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(doneSets / targetSets) * 100}%`,
              height: "100%",
              background: "var(--hue-teal)",
              borderRadius: 2,
              transition: "width 300ms",
            }}
          />
        </div>
      )}

      {/* "Next up" hint */}
      {isActive && doneSets === 0 && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--hue-teal-ink)",
            display: "flex",
            alignItems: "center",
            gap: 5,
            opacity: 0.8,
          }}
        >
          <Icon name="chevron-right" size={13} /> Tap the teal button to log a set
        </div>
      )}
    </div>
  );
}
