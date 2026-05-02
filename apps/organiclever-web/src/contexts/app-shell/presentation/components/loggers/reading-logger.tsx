"use client";

import { useState } from "react";
import { Schema } from "effect";
import { Input, Textarea } from "@open-sharia-enterprise/ts-ui";
import { appendEntries } from "@/contexts/journal/application";
import { EntryName, IsoTimestamp } from "@/contexts/journal/application";
import type { JournalRuntime } from "@/contexts/journal/application";
import { LoggerShell } from "./logger-shell";

export interface ReadingLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  runtime: JournalRuntime;
}

const COMPLETION_PCTS = [25, 50, 75, 100] as const;

/**
 * Logger for reading sessions (books, articles, etc.).
 *
 * Required field: title. All other fields are optional.
 */
export function ReadingLogger({ isOpen, onClose, onSaved, runtime }: ReadingLoggerProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState("");
  const [durationMins, setDurationMins] = useState("");
  const [completionPct, setCompletionPct] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  function reset() {
    setTitle("");
    setAuthor("");
    setPages("");
    setDurationMins("");
    setCompletionPct(null);
    setNotes("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSave() {
    if (!title.trim()) return;
    const now = Schema.decodeUnknownSync(IsoTimestamp)(new Date().toISOString());
    runtime
      .runPromise(
        appendEntries([
          {
            name: Schema.decodeUnknownSync(EntryName)("reading"),
            startedAt: now,
            finishedAt: now,
            labels: ["reading", title.trim()],
            payload: {
              title: title.trim(),
              author: author.trim() || null,
              pages: pages ? Number(pages) : null,
              durationMins: durationMins ? Number(durationMins) : null,
              completionPct,
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
      hue="plum"
      icon="calendar"
      title="Log reading"
      onClose={handleClose}
      onSave={handleSave}
      saveDisabled={!title.trim()}
    >
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="font-semibold" style={{ fontSize: 13 }}>
          Book / article title
        </label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Thinking Fast and Slow" />
      </div>

      {/* Author */}
      <div className="flex flex-col gap-1.5">
        <label className="font-semibold" style={{ fontSize: 13 }}>
          Author (optional)
        </label>
        <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Daniel Kahneman" />
      </div>

      {/* Pages + Duration */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="flex flex-col gap-1.5">
          <label className="font-semibold" style={{ fontSize: 13 }}>
            Pages read
          </label>
          <Input type="number" value={pages} onChange={(e) => setPages(e.target.value)} placeholder="e.g. 30" min={1} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-semibold" style={{ fontSize: 13 }}>
            Duration (min)
          </label>
          <Input
            type="number"
            value={durationMins}
            onChange={(e) => setDurationMins(e.target.value)}
            placeholder="e.g. 45"
            min={1}
          />
        </div>
      </div>

      {/* Completion % */}
      <div>
        <div className="font-semibold" style={{ fontSize: 13, marginBottom: 8 }}>
          Completion %
        </div>
        <div className="flex flex-wrap gap-2">
          {COMPLETION_PCTS.map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setCompletionPct(completionPct === pct ? null : pct)}
              className="cursor-pointer rounded-[10px] font-bold transition-all"
              style={{
                minHeight: 36,
                padding: "0 12px",
                fontSize: 13,
                border: "1px solid",
                borderColor: completionPct === pct ? "var(--hue-plum)" : "var(--color-border)",
                background: completionPct === pct ? "var(--hue-plum)" : "transparent",
                color: completionPct === pct ? "#fff" : "var(--color-muted-foreground)",
                fontFamily: "inherit",
              }}
            >
              {pct}%
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
