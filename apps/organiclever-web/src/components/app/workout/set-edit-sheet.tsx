"use client";

import { useState } from "react";
import { Button, Input, Label, Sheet } from "@open-sharia-enterprise/ts-ui";

export interface SetEditSheetProps {
  isOpen: boolean;
  setIndex: number;
  exerciseName: string;
  defaultReps?: number;
  defaultWeight?: string;
  onSave: (data: { reps: number; weight: string }) => void;
  onClose: () => void;
}

/**
 * Bottom sheet for editing an individual set's reps and weight.
 * Shown when tapping a completed set button to correct the logged values.
 */
export function SetEditSheet({
  isOpen,
  setIndex,
  exerciseName,
  defaultReps = 0,
  defaultWeight = "",
  onSave,
  onClose,
}: SetEditSheetProps) {
  const [reps, setReps] = useState(String(defaultReps));
  const [weight, setWeight] = useState(defaultWeight);

  if (!isOpen) return null;

  function handleSave() {
    const parsedReps = Number(reps) || 0;
    onSave({ reps: parsedReps, weight: weight.trim() });
    onClose();
  }

  return (
    <Sheet title={`${exerciseName} — set ${setIndex + 1}`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Actual reps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Label htmlFor="set-edit-reps">Actual reps</Label>
          <Input id="set-edit-reps" type="number" min="0" value={reps} onChange={(e) => setReps(e.target.value)} />
        </div>

        {/* Actual weight */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Label htmlFor="set-edit-weight">Actual weight</Label>
          <Input
            id="set-edit-weight"
            type="text"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 8 or 4+4"
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="outline" size="default" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button variant="teal" size="default" onClick={handleSave} style={{ flex: 2 }}>
            Save set
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
