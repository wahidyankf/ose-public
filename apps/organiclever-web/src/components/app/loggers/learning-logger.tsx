"use client";

import { useState } from "react";
import { Schema } from "effect";
import { Input, Textarea } from "@open-sharia-enterprise/ts-ui";
import { appendEntries } from "@/lib/journal/journal-store";
import { EntryName, IsoTimestamp } from "@/contexts/journal/domain/schema";
import type { JournalRuntime } from "@/lib/journal/runtime";
import { LoggerShell } from "./logger-shell";

export interface LearningLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  runtime: JournalRuntime;
}

const DURATION_PRESETS = [15, 30, 45, 60] as const;

const QUALITY_OPTIONS: Array<{ emoji: string; value: number }> = [
  { emoji: "😴", value: 1 },
  { emoji: "😐", value: 2 },
  { emoji: "🙂", value: 3 },
  { emoji: "😊", value: 4 },
  { emoji: "🔥", value: 5 },
];

/**
 * Logger for learning / skill-building sessions.
 *
 * Required field: subject. All other fields are optional.
 */
export function LearningLogger({ isOpen, onClose, onSaved, runtime }: LearningLoggerProps) {
  const [subject, setSubject] = useState("");
  const [source, setSource] = useState("");
  const [durationMins, setDurationMins] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  function reset() {
    setSubject("");
    setSource("");
    setDurationMins("");
    setRating(null);
    setNotes("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSave() {
    if (!subject.trim()) return;
    const now = Schema.decodeUnknownSync(IsoTimestamp)(new Date().toISOString());
    runtime
      .runPromise(
        appendEntries([
          {
            name: Schema.decodeUnknownSync(EntryName)("learning"),
            startedAt: now,
            finishedAt: now,
            labels: ["learning", subject.trim()],
            payload: {
              subject: subject.trim(),
              source: source.trim() || null,
              durationMins: durationMins ? Number(durationMins) : null,
              rating,
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
      hue="honey"
      icon="zap"
      title="Log learning"
      onClose={handleClose}
      onSave={handleSave}
      saveDisabled={!subject.trim()}
    >
      {/* Subject */}
      <div className="flex flex-col gap-1.5">
        <label className="font-semibold" style={{ fontSize: 13 }}>
          What did you learn?
        </label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. React hooks, Spanish vocab, Piano scales"
        />
      </div>

      {/* Source */}
      <div className="flex flex-col gap-1.5">
        <label className="font-semibold" style={{ fontSize: 13 }}>
          Source (optional)
        </label>
        <Input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="e.g. YouTube, Udemy, Book, Practice"
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
                borderColor: durationMins === String(p) ? "var(--hue-honey)" : "var(--color-border)",
                background: durationMins === String(p) ? "var(--hue-honey-wash)" : "transparent",
                color: durationMins === String(p) ? "var(--hue-honey-ink)" : "var(--color-muted-foreground)",
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
          Session quality
        </div>
        <div className="flex gap-2">
          {QUALITY_OPTIONS.map(({ emoji, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(rating === value ? null : value)}
              className="flex-1 cursor-pointer rounded-[10px] transition-all"
              aria-label={`Quality ${value}`}
              style={{
                minHeight: 40,
                border: "1px solid",
                borderColor: rating === value ? "var(--hue-honey)" : "var(--color-border)",
                background: rating === value ? "var(--hue-honey-wash)" : "transparent",
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
