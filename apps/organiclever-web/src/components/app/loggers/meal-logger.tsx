"use client";

import { useState } from "react";
import { Schema } from "effect";
import { Input, Textarea } from "@open-sharia-enterprise/ts-ui";
import { appendEntries } from "@/contexts/journal/application";
import { EntryName, IsoTimestamp } from "@/contexts/journal/application";
import type { JournalRuntime } from "@/contexts/journal/application";
import { LoggerShell } from "./logger-shell";

export interface MealLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  runtime: JournalRuntime;
}

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
type MealType = (typeof MEAL_TYPES)[number];

const ENERGY_LEVELS: Array<{ emoji: string; value: number }> = [
  { emoji: "😩", value: 1 },
  { emoji: "😐", value: 2 },
  { emoji: "🙂", value: 3 },
  { emoji: "😊", value: 4 },
  { emoji: "⚡", value: 5 },
];

/**
 * Logger for meal / food entries.
 *
 * Required field: name (what was eaten). All other fields are optional.
 */
export function MealLogger({ isOpen, onClose, onSaved, runtime }: MealLoggerProps) {
  const [name, setName] = useState("");
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  function reset() {
    setName("");
    setMealType(null);
    setEnergyLevel(null);
    setNotes("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSave() {
    if (!name.trim()) return;
    const now = Schema.decodeUnknownSync(IsoTimestamp)(new Date().toISOString());
    runtime
      .runPromise(
        appendEntries([
          {
            name: Schema.decodeUnknownSync(EntryName)("meal"),
            startedAt: now,
            finishedAt: now,
            labels: ["meal", ...(mealType ? [mealType] : []), name.trim()],
            payload: {
              name: name.trim(),
              mealType: mealType ?? null,
              energyLevel,
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
      hue="terracotta"
      icon="clock"
      title="Log meal"
      onClose={handleClose}
      onSave={handleSave}
      saveDisabled={!name.trim()}
    >
      {/* Meal name */}
      <div className="flex flex-col gap-1.5">
        <label className="font-semibold" style={{ fontSize: 13 }}>
          What did you eat?
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Oatmeal with berries, Green tea"
        />
      </div>

      {/* Meal type chips */}
      <div>
        <div className="font-semibold" style={{ fontSize: 13, marginBottom: 8 }}>
          Meal type
        </div>
        <div className="flex flex-wrap gap-2">
          {MEAL_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setMealType(mealType === t ? null : t)}
              className="cursor-pointer rounded-[10px] font-bold transition-all"
              style={{
                minHeight: 34,
                padding: "0 12px",
                fontSize: 13,
                border: "1px solid",
                borderColor: mealType === t ? "var(--hue-terracotta)" : "var(--color-border)",
                background: mealType === t ? "var(--hue-terracotta-wash)" : "transparent",
                color: mealType === t ? "var(--hue-terracotta-ink)" : "var(--color-muted-foreground)",
                fontFamily: "inherit",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Energy level */}
      <div>
        <div className="font-semibold" style={{ fontSize: 13, marginBottom: 8 }}>
          Energy after
        </div>
        <div className="flex gap-2">
          {ENERGY_LEVELS.map(({ emoji, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setEnergyLevel(energyLevel === value ? null : value)}
              className="flex-1 cursor-pointer rounded-[10px] transition-all"
              aria-label={`Energy ${value}`}
              style={{
                minHeight: 40,
                border: "1px solid",
                borderColor: energyLevel === value ? "var(--hue-terracotta)" : "var(--color-border)",
                background: energyLevel === value ? "var(--hue-terracotta-wash)" : "transparent",
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
