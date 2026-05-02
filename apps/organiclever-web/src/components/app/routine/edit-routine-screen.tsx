"use client";

import { useState } from "react";
import { AppHeader, Button, HuePicker, Icon, Input } from "@open-sharia-enterprise/ts-ui";
import type { HueName } from "@open-sharia-enterprise/ts-ui";
import type { Routine, ExerciseGroup } from "@/lib/journal/routine-store";
import type { JournalRuntime } from "@/contexts/journal/infrastructure/runtime";
import type { ExerciseTemplate } from "@/contexts/journal/domain/typed-payloads";
import { saveRoutine, deleteRoutine } from "@/lib/journal/routine-store";
import { ExerciseEditorRow } from "./exercise-editor-row";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EditRoutineScreenProps {
  routine: Routine | null; // null = create new
  runtime: JournalRuntime;
  onSave: () => void;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function newExercise(): ExerciseTemplate {
  return {
    id: crypto.randomUUID(),
    name: "",
    type: "reps",
    targetSets: 3,
    targetReps: 10,
    targetWeight: null,
    targetDuration: null,
    timerMode: "countdown",
    bilateral: false,
    dayStreak: 0,
    restSeconds: null,
  };
}

function newRoutine(): Routine {
  return {
    id: crypto.randomUUID(),
    name: "",
    hue: "teal",
    type: "workout",
    createdAt: new Date().toISOString(),
    groups: [{ id: crypto.randomUUID(), name: "Main", exercises: [] }],
  };
}

function cloneGroups(groups: ExerciseGroup[]): ExerciseGroup[] {
  return JSON.parse(JSON.stringify(groups)) as ExerciseGroup[];
}

// ---------------------------------------------------------------------------
// EditRoutineScreen
// ---------------------------------------------------------------------------

export function EditRoutineScreen({ routine: initialRoutine, runtime, onSave, onBack }: EditRoutineScreenProps) {
  const isNew = initialRoutine === null;

  const [name, setName] = useState(initialRoutine?.name ?? "");
  const [hue, setHue] = useState<HueName>((initialRoutine?.hue as HueName) ?? "teal");
  const [groups, setGroups] = useState<ExerciseGroup[]>(() =>
    isNew ? newRoutine().groups : cloneGroups(initialRoutine?.groups ?? []),
  );
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // -- Group helpers ---------------------------------------------------------

  const updateGroupName = (gIdx: number, groupName: string) =>
    setGroups((gs) => gs.map((g, i) => (i === gIdx ? { ...g, name: groupName } : g)));

  const deleteGroup = (gIdx: number) => setGroups((gs) => gs.filter((_, i) => i !== gIdx));

  const addGroup = () => setGroups((gs) => [...gs, { id: crypto.randomUUID(), name: "Circuit A", exercises: [] }]);

  const toggleGroupCollapse = (groupId: string) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });

  // -- Exercise helpers ------------------------------------------------------

  const addExercise = (gIdx: number) =>
    setGroups((gs) => gs.map((g, i) => (i === gIdx ? { ...g, exercises: [...g.exercises, newExercise()] } : g)));

  const updateExercise = (gIdx: number, eIdx: number, updated: ExerciseTemplate) =>
    setGroups((gs) =>
      gs.map((g, i) => (i !== gIdx ? g : { ...g, exercises: g.exercises.map((e, j) => (j === eIdx ? updated : e)) })),
    );

  const deleteExercise = (gIdx: number, eIdx: number) =>
    setGroups((gs) =>
      gs.map((g, i) => (i !== gIdx ? g : { ...g, exercises: g.exercises.filter((_, j) => j !== eIdx) })),
    );

  // -- Save / Delete ---------------------------------------------------------

  const handleSave = () => {
    if (!name.trim()) return;
    const routine: Routine = {
      ...(initialRoutine ?? {}),
      id: initialRoutine?.id ?? crypto.randomUUID(),
      name: name.trim(),
      hue,
      type: "workout",
      createdAt: initialRoutine?.createdAt ?? new Date().toISOString(),
      groups,
    };
    runtime
      .runPromise(saveRoutine(routine))
      .then(onSave)
      .catch(() => {});
  };

  const handleDelete = () => {
    if (!initialRoutine?.id) return;
    runtime
      .runPromise(deleteRoutine(initialRoutine.id))
      .then(onBack)
      .catch(() => {});
  };

  const totalEx = groups.reduce((n, g) => n + (g.exercises?.length ?? 0), 0);

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <AppHeader
        title={isNew ? "New routine" : "Edit routine"}
        subtitle={`${totalEx} exercise${totalEx !== 1 ? "s" : ""} across ${groups.length} group${groups.length !== 1 ? "s" : ""}`}
        onBack={onBack}
        trailing={
          <Button variant="teal" size="sm" disabled={!name.trim()} onClick={handleSave}>
            <Icon name="save" size={16} />
            Save
          </Button>
        }
      />

      <div style={{ padding: "0 20px 40px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Basic info card */}
        <div
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 20,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 5 }} htmlFor="routine-name">
              Routine name
            </label>
            <Input
              id="routine-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kettlebell day"
            />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Color</div>
            <HuePicker value={hue} onChange={setHue} />
          </div>
        </div>

        {/* Groups */}
        {groups.map((group, gIdx) => {
          const isCollapsed = collapsedGroups.has(group.id);
          return (
            <div key={group.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Group header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  aria-label={`Group ${gIdx + 1} name`}
                  value={group.name}
                  onChange={(e) => updateGroupName(gIdx, e.target.value)}
                  placeholder="e.g. Circuit A, Round 1, Warmup…"
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 10,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    padding: "0 10px",
                    fontFamily: "var(--font-sans)",
                    fontWeight: 800,
                    fontSize: 13,
                    letterSpacing: ".06em",
                    textTransform: "uppercase",
                    color: "var(--color-muted-foreground)",
                    outline: "none",
                  }}
                />
                {/* Collapse chevron */}
                <button
                  type="button"
                  aria-label={isCollapsed ? "Expand group" : "Collapse group"}
                  onClick={() => toggleGroupCollapse(group.id)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: 0,
                    background: "var(--color-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-muted-foreground)",
                  }}
                >
                  <Icon name={isCollapsed ? "chevron-down" : "chevron-up"} size={16} />
                </button>
                {/* Delete group (only when multiple groups exist) */}
                {groups.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Delete group ${group.name}`}
                    onClick={() => deleteGroup(gIdx)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      border: 0,
                      background: "var(--hue-terracotta-wash)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--hue-terracotta-ink)",
                    }}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                )}
              </div>

              {/* Exercises (hidden when group collapsed) */}
              {!isCollapsed && (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {group.exercises.map((ex, eIdx) => (
                      <ExerciseEditorRow
                        key={ex.id}
                        exercise={ex}
                        isFirst={eIdx === 0}
                        isLast={eIdx === group.exercises.length - 1}
                        onChange={(updated) => updateExercise(gIdx, eIdx, updated)}
                        onDelete={() => deleteExercise(gIdx, eIdx)}
                      />
                    ))}
                  </div>

                  <Button variant="outline" size="sm" onClick={() => addExercise(gIdx)} className="w-full">
                    <Icon name="plus" size={15} />
                    Add exercise to {group.name}
                  </Button>
                </>
              )}
            </div>
          );
        })}

        {/* Add group */}
        <Button variant="secondary" size="default" onClick={addGroup} className="w-full">
          <Icon name="plus-circle" size={18} />
          Add group
        </Button>

        {/* Delete routine (edit mode only) */}
        {!isNew && (
          <div style={{ marginTop: 8, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                size="default"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full"
                style={{ borderColor: "var(--color-destructive)", color: "var(--color-destructive)" }}
              >
                <Icon name="trash" size={16} />
                Delete routine
              </Button>
            ) : (
              <div
                style={{
                  background: "var(--hue-terracotta-wash)",
                  borderRadius: 14,
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--hue-terracotta-ink)" }}>
                  Delete &quot;{name}&quot;? This cannot be undone.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDelete} className="flex-1">
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
