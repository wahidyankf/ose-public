"use client";

import { Button, Sheet } from "@open-sharia-enterprise/ts-ui";
import { fmtTime } from "@/lib/utils/fmt";

export interface EndWorkoutSheetProps {
  isOpen: boolean;
  elapsedSecs: number;
  onConfirm: () => void;
  onKeepGoing: () => void;
  onDiscard: () => void;
}

/**
 * Bottom sheet shown when the user taps "End" during an active workout.
 * Provides three options: save & finish, keep going, or discard session.
 */
export function EndWorkoutSheet({ isOpen, elapsedSecs, onConfirm, onKeepGoing, onDiscard }: EndWorkoutSheetProps) {
  if (!isOpen) return null;

  return (
    <Sheet title="End workout?" onClose={onKeepGoing}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1.5,
            color: "var(--color-muted-foreground)",
            margin: 0,
          }}
        >
          Do you want to save this session to your history?
        </p>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--color-muted-foreground)",
            margin: 0,
          }}
        >
          Elapsed: {fmtTime(elapsedSecs)}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button variant="teal" size="lg" style={{ width: "100%" }} onClick={onConfirm}>
            Save &amp; finish
          </Button>
          <Button variant="outline" size="lg" style={{ width: "100%" }} onClick={onKeepGoing}>
            Keep going
          </Button>
          <button
            type="button"
            onClick={onDiscard}
            style={{
              border: "1px solid var(--hue-terracotta)",
              background: "transparent",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--hue-terracotta-ink)",
              padding: "10px 0",
              borderRadius: 12,
              width: "100%",
              transition: "all 150ms",
            }}
          >
            Discard session
          </button>
        </div>
      </div>
    </Sheet>
  );
}
