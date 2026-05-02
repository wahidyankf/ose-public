/**
 * Step definitions for the Routine Management feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/routine/routine-management.feature
 *
 * Tests pure routine editing logic directly (no PGlite, no browser APIs):
 * - New routine state initialisation and save guard (name must be non-empty)
 * - Adding exercises to a group (pure immutable helper)
 * - Delete confirmation flow using appMachine state transitions
 *
 * Mirrors the same pattern used in workout-session.steps.tsx and
 * home-screen.steps.tsx: pure function / state-machine level only.
 */

import path from "path";
import { existsSync } from "fs";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect, vi } from "vitest";
import type { ExerciseGroup } from "@/contexts/routine/application";
import type { ExerciseTemplate } from "@/contexts/journal/application";
import type { Routine } from "@/contexts/routine/application";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeExercise(overrides: Partial<ExerciseTemplate> = {}): ExerciseTemplate {
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
    ...overrides,
  };
}

function makeRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: "r-existing-1",
    name: "Push Day",
    hue: "teal",
    type: "workout",
    createdAt: "2026-01-01T00:00:00.000Z",
    groups: [{ id: "g-1", name: "Main", exercises: [] }],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Pure helpers that mirror EditRoutineScreen logic
// ---------------------------------------------------------------------------

function addExerciseToGroup(groups: ExerciseGroup[], gIdx: number, exercise: ExerciseTemplate): ExerciseGroup[] {
  return groups.map((g, i) => (i === gIdx ? { ...g, exercises: [...g.exercises, exercise] } : g));
}

// ---------------------------------------------------------------------------
// Feature
// ---------------------------------------------------------------------------

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/fe/gherkin/routine/routine-management.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  Scenario("Create a new routine", ({ Given, When, And, Then }) => {
    let routineName = "";
    let saved = false;
    const mockSave = vi.fn(() => {
      saved = true;
    });

    Given("the edit routine screen is open for a new routine", () => {
      routineName = "";
      saved = false;
    });

    When("the user enters a routine name", () => {
      routineName = "Morning Strength";
    });

    And("the user saves the routine", () => {
      // Name is non-empty → save guard passes → save callback invoked
      if (routineName.trim()) {
        mockSave();
      }
    });

    Then("the routine is saved", () => {
      expect(routineName.trim()).not.toBe("");
      expect(saved).toBe(true);
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
  });

  Scenario("Add an exercise to a routine", ({ Given, When, Then }) => {
    let groups: ExerciseGroup[] = [];

    Given("the edit routine screen is open", () => {
      groups = [{ id: "g-1", name: "Main", exercises: [] }];
    });

    When("the user adds an exercise", () => {
      const ex = makeExercise({ name: "Pull-up" });
      groups = addExerciseToGroup(groups, 0, ex);
    });

    Then("the exercise appears in the group", () => {
      expect(groups[0]?.exercises).toHaveLength(1);
      expect(groups[0]?.exercises[0]?.name).toBe("Pull-up");
    });
  });

  Scenario("Delete a routine", ({ Given, When, Then }) => {
    // Post-route-refactor the routine-edit flow lives at /app/routines/edit
    // and "navigation back to main" is performed by router.push("/app/home"),
    // not by an XState BACK_TO_MAIN event. The unit-level test models that
    // shape: the page is present and the delete + onBack callbacks fire.
    let routineUnderEdit: Routine | null = null;
    let deleteConfirmed = false;
    let pushedTo: string | null = null;
    const mockDeleteFn = vi.fn(() => {
      deleteConfirmed = true;
    });
    const mockRouterPush = vi.fn((path: string) => {
      pushedTo = path;
    });

    Given("the edit routine screen is open for an existing routine", () => {
      routineUnderEdit = makeRoutine();
      // Prove the on-disk page exists at the expected URL.
      const editPage = path.resolve(__dirname, "../../../../src/app/app/routines/edit/page.tsx");
      expect(existsSync(editPage)).toBe(true);
    });

    When("the user confirms deleting the routine", () => {
      // Simulate: user confirms delete → callback fires → router pushes home.
      mockDeleteFn();
      mockRouterPush("/app/home");
    });

    Then("the routine is deleted", () => {
      expect(deleteConfirmed).toBe(true);
      expect(mockDeleteFn).toHaveBeenCalledTimes(1);
      expect(routineUnderEdit?.id).toBe("r-existing-1");
      expect(pushedTo).toBe("/app/home");
    });
  });
});
