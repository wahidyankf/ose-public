"use client";

import { useState } from "react";
import { Button, Badge, Icon, Toggle } from "@open-sharia-enterprise/ts-ui";
import { Input } from "@open-sharia-enterprise/ts-ui";
import type { ExerciseTemplate } from "@/contexts/journal/domain/typed-payloads";
import { fmtTime } from "@/lib/utils/fmt";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ExerciseEditorRowProps {
  exercise: ExerciseTemplate;
  onChange: (updated: ExerciseTemplate) => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}

// ---------------------------------------------------------------------------
// Type chip row
// ---------------------------------------------------------------------------

type ExerciseTypeOption = { value: ExerciseTemplate["type"]; label: string };

const TYPE_OPTIONS: ExerciseTypeOption[] = [
  { value: "reps", label: "Reps" },
  { value: "duration", label: "Duration" },
  { value: "oneoff", label: "One-off" },
];

// ---------------------------------------------------------------------------
// Rest chip options
// ---------------------------------------------------------------------------

type RestOption = { label: string; value: number | null };

const REST_OPTIONS: RestOption[] = [
  { label: "No rest", value: 0 },
  { label: "App default", value: null },
  { label: "30s", value: 30 },
  { label: "60s", value: 60 },
  { label: "90s", value: 90 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSummary(ex: ExerciseTemplate): string {
  if (ex.type === "oneoff") return "1 set";
  if (ex.type === "duration") {
    return `${ex.targetSets}× ${ex.targetDuration ? fmtTime(ex.targetDuration) : "—"} (${ex.timerMode})`;
  }
  // reps
  const weight = ex.targetWeight ? ` @ ${ex.targetWeight} kg` : "";
  const lr = ex.bilateral ? " LR" : "";
  const rest = ex.restSeconds ? ` · ${ex.restSeconds}s rest` : "";
  return `${ex.targetSets}×${ex.targetReps}${lr}${weight}${rest}`;
}

// ---------------------------------------------------------------------------
// ExerciseEditorRow
// ---------------------------------------------------------------------------

export function ExerciseEditorRow({ exercise, onChange, onDelete, isFirst, isLast }: ExerciseEditorRowProps) {
  const [expanded, setExpanded] = useState(false);

  const patch = (partial: Partial<ExerciseTemplate>) => onChange({ ...exercise, ...partial });

  const isDuration = exercise.type === "duration";
  const isReps = exercise.type === "reps";

  return (
    <div
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 14,
        overflow: "hidden",
        transition: "box-shadow 150ms",
      }}
    >
      {/* Collapsed header */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", cursor: "pointer" }}
        onClick={() => setExpanded((e) => !e)}
      >
        <span style={{ color: "var(--color-muted-foreground)", flexShrink: 0, display: "flex" }}>
          <Icon name="grip" size={16} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {exercise.name || <span style={{ opacity: 0.4 }}>Unnamed exercise</span>}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--color-muted-foreground)",
              fontFamily: "var(--font-mono)",
              marginTop: 1,
            }}
          >
            {buildSummary(exercise)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
          {exercise.dayStreak > 0 && (
            <Badge hue="honey" variant="outline" size="sm">
              {exercise.dayStreak}d
            </Badge>
          )}
          {!isFirst && (
            <button
              type="button"
              aria-label="Move exercise up"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ ...exercise });
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: 0,
                background: "var(--color-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-muted-foreground)",
              }}
            >
              <Icon name="arrow-up" size={14} />
            </button>
          )}
          {!isLast && (
            <button
              type="button"
              aria-label="Move exercise down"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ ...exercise });
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: 0,
                background: "var(--color-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-muted-foreground)",
              }}
            >
              <Icon name="arrow-down" size={14} />
            </button>
          )}
          <button
            type="button"
            aria-label="Delete exercise"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: 0,
              background: "var(--hue-terracotta-wash)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--hue-terracotta-ink)",
            }}
          >
            <Icon name="trash" size={14} />
          </button>
          <button
            type="button"
            aria-label={expanded ? "Collapse exercise" : "Expand exercise"}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: 0,
              background: "var(--color-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-muted-foreground)",
            }}
          >
            <Icon name={expanded ? "chevron-up" : "chevron-down"} size={14} />
          </button>
        </div>
      </div>

      {/* Expanded fields */}
      {expanded && (
        <div
          style={{
            padding: "0 12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            borderTop: "1px solid var(--color-border)",
          }}
        >
          {/* Name */}
          <div style={{ marginTop: 10 }}>
            <label
              style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 5 }}
              htmlFor={`ex-name-${exercise.id}`}
            >
              Exercise name
            </label>
            <Input
              id={`ex-name-${exercise.id}`}
              value={exercise.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="e.g. Push-up"
            />
          </div>

          {/* Type chip row */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Type</div>
            <div style={{ display: "flex", gap: 6 }}>
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => patch({ type: opt.value })}
                  style={{
                    flex: 1,
                    minHeight: 36,
                    borderRadius: 10,
                    fontFamily: "inherit",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor: exercise.type === opt.value ? "var(--hue-teal)" : "var(--color-border)",
                    background: exercise.type === opt.value ? "var(--hue-teal-wash)" : "var(--color-card)",
                    color: exercise.type === opt.value ? "var(--hue-teal-ink)" : "var(--color-foreground)",
                    transition: "all 150ms",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reps-specific fields */}
          {isReps && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div>
                  <label
                    style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 5 }}
                    htmlFor={`ex-sets-${exercise.id}`}
                  >
                    Sets
                  </label>
                  <Input
                    id={`ex-sets-${exercise.id}`}
                    type="number"
                    min={1}
                    value={exercise.targetSets}
                    onChange={(e) => patch({ targetSets: Number(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <label
                    style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 5 }}
                    htmlFor={`ex-reps-${exercise.id}`}
                  >
                    Reps
                  </label>
                  <Input
                    id={`ex-reps-${exercise.id}`}
                    type="number"
                    min={1}
                    value={exercise.targetReps}
                    onChange={(e) => patch({ targetReps: Number(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <label
                    style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 5 }}
                    htmlFor={`ex-weight-${exercise.id}`}
                  >
                    Weight (kg)
                  </label>
                  <Input
                    id={`ex-weight-${exercise.id}`}
                    type="text"
                    value={exercise.targetWeight ?? ""}
                    onChange={(e) => patch({ targetWeight: e.target.value || null })}
                    placeholder="e.g. 8"
                  />
                </div>
              </div>
              <Toggle value={exercise.bilateral} onChange={(v) => patch({ bilateral: v })} label="Bilateral (LR)" />
            </div>
          )}

          {/* Duration-specific fields */}
          {isDuration && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label
                    style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 5 }}
                    htmlFor={`ex-dur-sets-${exercise.id}`}
                  >
                    Sets
                  </label>
                  <Input
                    id={`ex-dur-sets-${exercise.id}`}
                    type="number"
                    min={1}
                    value={exercise.targetSets}
                    onChange={(e) => patch({ targetSets: Number(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <label
                    style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 5 }}
                    htmlFor={`ex-duration-${exercise.id}`}
                  >
                    Target duration (sec)
                  </label>
                  <Input
                    id={`ex-duration-${exercise.id}`}
                    type="number"
                    min={1}
                    value={exercise.targetDuration ?? ""}
                    onChange={(e) => patch({ targetDuration: e.target.value ? Number(e.target.value) : null })}
                    placeholder="e.g. 30"
                  />
                </div>
              </div>
              {/* Timer mode chips */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Timer mode</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {(
                    [
                      { value: "countdown", label: "Countdown" },
                      { value: "countup", label: "Count up" },
                    ] as { value: ExerciseTemplate["timerMode"]; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => patch({ timerMode: opt.value })}
                      style={{
                        flex: 1,
                        minHeight: 36,
                        borderRadius: 10,
                        fontFamily: "inherit",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        border: "1px solid",
                        borderColor: exercise.timerMode === opt.value ? "var(--hue-teal)" : "var(--color-border)",
                        background: exercise.timerMode === opt.value ? "var(--hue-teal-wash)" : "var(--color-card)",
                        color: exercise.timerMode === opt.value ? "var(--hue-teal-ink)" : "var(--color-foreground)",
                        transition: "all 150ms",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rest override chips (all types) */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Rest override</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {REST_OPTIONS.map((opt) => {
                const isActive = exercise.restSeconds === opt.value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => patch({ restSeconds: opt.value })}
                    style={{
                      minHeight: 30,
                      padding: "0 10px",
                      borderRadius: 8,
                      border: "1px solid",
                      borderColor: isActive ? "var(--hue-teal)" : "var(--color-border)",
                      background: isActive ? "var(--hue-teal-wash)" : "var(--color-card)",
                      color: isActive ? "var(--hue-teal-ink)" : "var(--color-muted-foreground)",
                      fontFamily: "inherit",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                      transition: "all 150ms",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day streak badge (only shown when > 0) */}
          {exercise.dayStreak > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Day streak</div>
              <Badge hue="honey" variant="outline" size="md">
                {exercise.dayStreak} {exercise.dayStreak === 1 ? "day" : "days"}
              </Badge>
              <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", fontStyle: "italic" }}>(auto)</span>
            </div>
          )}

          {/* Delete button */}
          <div style={{ paddingTop: 4 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              style={{ color: "var(--hue-terracotta-ink)", borderColor: "var(--hue-terracotta)" }}
            >
              <Icon name="trash" size={14} />
              Remove exercise
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
