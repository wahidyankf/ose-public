"use client";

import { useState } from "react";
import { Schema } from "effect";
import { Input, Textarea } from "@open-sharia-enterprise/ts-ui";
import { appendEntries } from "@/contexts/journal/application";
import { EntryName, IsoTimestamp } from "@/contexts/journal/application";
import type { JournalRuntime } from "@/contexts/journal/application";
import { LoggerShell } from "./logger-shell";

export interface FocusLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  runtime: JournalRuntime;
}

const DURATION_PRESETS = [25, 45, 60, 90] as const;

const QUALITY_OPTIONS: Array<{ emoji: string; value: number }> = [
  { emoji: "😵", value: 1 },
  { emoji: "😐", value: 2 },
  { emoji: "🙂", value: 3 },
  { emoji: "😊", value: 4 },
  { emoji: "🧠", value: 5 },
];

/**
 * Logger for deep focus / Pomodoro sessions.
 *
 * Save is enabled when either task or duration is filled.
 */
export function FocusLogger({ isOpen, onClose, onSaved, runtime }: FocusLoggerProps) {
  const [task, setTask] = useState("");
  const [durationMins, setDurationMins] = useState("");
  const [quality, setQuality] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  function reset() {
    setTask("");
    setDurationMins("");
    setQuality(null);
    setNotes("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  const saveDisabled = !task.trim() && !durationMins;

  function handleSave() {
    if (saveDisabled) return;
    const now = Schema.decodeUnknownSync(IsoTimestamp)(new Date().toISOString());
    runtime
      .runPromise(
        appendEntries([
          {
            name: Schema.decodeUnknownSync(EntryName)("focus"),
            startedAt: now,
            finishedAt: now,
            labels: ["focus", ...(task.trim() ? [task.trim()] : [])],
            payload: {
              task: task.trim() || null,
              durationMins: durationMins ? Number(durationMins) : null,
              quality,
              notes: notes.trim() || null,
            },
          },
        ]),
      )
      .catch(() => {});
    reset();
    onSaved();
  }

  return (
    <LoggerShell
      isOpen={isOpen}
      hue="sky"
      icon="timer"
      title="Log focus session"
      onClose={handleClose}
      onSave={handleSave}
      saveDisabled={saveDisabled}
    >
      {/* Task */}
      <div className="flex flex-col gap-1.5">
        <label className="font-semibold" style={{ fontSize: 13 }}>
          What did you work on? (optional)
        </label>
        <Input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="e.g. Feature design, Writing, Tax returns"
        />
      </div>

      {/* Duration presets */}
      <div>
        <div className="font-semibold" style={{ fontSize: 13, marginBottom: 8 }}>
          Duration (min)
        </div>
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 8 }}>
          {DURATION_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDurationMins(durationMins === String(p) ? "" : String(p))}
              className="cursor-pointer rounded-[10px] font-bold transition-all"
              style={{
                minHeight: 34,
                padding: "0 12px",
                fontSize: 13,
                border: "1px solid",
                borderColor: durationMins === String(p) ? "var(--hue-sky)" : "var(--color-border)",
                background: durationMins === String(p) ? "var(--hue-sky-wash)" : "transparent",
                color: durationMins === String(p) ? "var(--hue-sky-ink)" : "var(--color-muted-foreground)",
                fontFamily: "inherit",
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <Input
          type="number"
          value={durationMins}
          onChange={(e) => setDurationMins(e.target.value)}
          placeholder="or enter custom minutes"
          min={1}
        />
      </div>

      {/* Quality rating */}
      <div>
        <div className="font-semibold" style={{ fontSize: 13, marginBottom: 8 }}>
          Focus quality
        </div>
        <div className="flex gap-2">
          {QUALITY_OPTIONS.map(({ emoji, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setQuality(quality === value ? null : value)}
              className="flex-1 cursor-pointer rounded-[10px] transition-all"
              aria-label={`Quality ${value}`}
              style={{
                minHeight: 40,
                border: "1px solid",
                borderColor: quality === value ? "var(--hue-sky)" : "var(--color-border)",
                background: quality === value ? "var(--hue-sky-wash)" : "transparent",
                fontSize: 20,
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="font-semibold" style={{ fontSize: 13 }}>
          Notes (optional)
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any thoughts worth capturing..."
          rows={3}
        />
      </div>
    </LoggerShell>
  );
}
