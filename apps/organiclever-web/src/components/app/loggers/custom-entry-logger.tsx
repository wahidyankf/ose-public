"use client";

import { useState } from "react";
import { Schema } from "effect";
import { Input, Textarea, HuePicker, Icon } from "@open-sharia-enterprise/ts-ui";
import type { HueName } from "@open-sharia-enterprise/ts-ui";
import { appendEntries } from "@/contexts/journal/application";
import { EntryName, IsoTimestamp } from "@/contexts/journal/application";
import type { JournalRuntime } from "@/contexts/journal/application";
import { LoggerShell } from "./logger-shell";
import type { IconName } from "@open-sharia-enterprise/ts-ui";

export interface CustomEntryLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  runtime: JournalRuntime;
  /** Pre-filled name for editing an existing custom type */
  initialName?: string;
}

const ICON_OPTIONS: IconName[] = [
  "zap",
  "clock",
  "flame",
  "trend",
  "calendar",
  "user",
  "dumbbell",
  "timer",
  "check-circle",
  "plus-circle",
  "save",
  "moon",
];

/**
 * Logger for custom (user-defined) entry types.
 *
 * If `initialName` is provided, the name field is pre-filled and treated as
 * an existing custom type. Otherwise the user defines a new name, hue, and icon.
 *
 * The resulting entry name uses the pattern `custom-<slug>`.
 */
export function CustomEntryLogger({ isOpen, onClose, onSaved, runtime, initialName }: CustomEntryLoggerProps) {
  const [customName, setCustomName] = useState(initialName ?? "");
  const [hue, setHue] = useState<HueName>("sage");
  const [selectedIcon, setSelectedIcon] = useState<IconName>("zap");
  const [durationMins, setDurationMins] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setCustomName(initialName ?? "");
    setHue("sage");
    setSelectedIcon("zap");
    setDurationMins("");
    setNotes("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  const slug = customName.trim().toLowerCase().replace(/\s+/g, "-");
  const entryNameRaw = slug ? `custom-${slug}` : "";

  function handleSave() {
    if (!customName.trim()) return;

    let validatedName: EntryName;
    try {
      validatedName = Schema.decodeUnknownSync(EntryName)(entryNameRaw);
    } catch {
      return;
    }

    const now = Schema.decodeUnknownSync(IsoTimestamp)(new Date().toISOString());
    runtime
      .runPromise(
        appendEntries([
          {
            name: validatedName,
            startedAt: now,
            finishedAt: now,
            labels: ["custom", customName.trim()],
            payload: {
              name: customName.trim(),
              hue,
              icon: selectedIcon,
              durationMins: durationMins ? Number(durationMins) : null,
              notes: notes.trim() || null,
            },
          },
        ]),
      )
      .catch(() => {});
    reset();
    onSaved();
  }

  const isNew = !initialName;

  return (
    <LoggerShell
      isOpen={isOpen}
      hue={hue}
      icon={selectedIcon}
      title={isNew ? "New custom entry" : `Log: ${initialName}`}
      onClose={handleClose}
      onSave={handleSave}
      saveDisabled={!customName.trim()}
    >
      {/* Name (only editable for new types) */}
      {isNew && (
        <div className="flex flex-col gap-1.5">
          <label className="font-semibold" style={{ fontSize: 13 }}>
            Entry name
          </label>
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Evening walk, Cold shower, Meditation"
          />
        </div>
      )}

      {/* Color picker (only for new) */}
      {isNew && (
        <div>
          <div className="font-semibold" style={{ fontSize: 13, marginBottom: 8 }}>
            Color
          </div>
          <HuePicker value={hue} onChange={setHue} />
        </div>
      )}

      {/* Icon picker (only for new) */}
      {isNew && (
        <div>
          <div className="font-semibold" style={{ fontSize: 13, marginBottom: 8 }}>
            Icon
          </div>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setSelectedIcon(ic)}
                className="flex cursor-pointer items-center justify-center rounded-[10px] transition-all"
                aria-label={ic}
                aria-pressed={selectedIcon === ic}
                style={{
                  width: 40,
                  height: 40,
                  border: "1px solid",
                  borderColor: selectedIcon === ic ? `var(--hue-${hue})` : "var(--color-border)",
                  background: selectedIcon === ic ? `var(--hue-${hue}-wash)` : "var(--color-card)",
                  color: selectedIcon === ic ? `var(--hue-${hue}-ink)` : "var(--color-muted-foreground)",
                }}
              >
                <Icon name={ic} size={18} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Duration */}
      <div className="flex flex-col gap-1.5">
        <label className="font-semibold" style={{ fontSize: 13 }}>
          Duration (minutes, optional)
        </label>
        <Input
          type="number"
          value={durationMins}
          onChange={(e) => setDurationMins(e.target.value)}
          placeholder="e.g. 30"
          min={1}
        />
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="font-semibold" style={{ fontSize: 13 }}>
          Notes (optional)
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it go? Anything worth noting..."
          rows={3}
        />
      </div>
    </LoggerShell>
  );
}
