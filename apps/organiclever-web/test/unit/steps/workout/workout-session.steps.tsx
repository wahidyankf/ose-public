/**
 * Step definitions for the Workout Session feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/workout/workout-session.feature
 *
 * Tests workoutSessionMachine directly (no browser APIs, no PGlite).
 */

import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect, vi } from "vitest";
import { createActor } from "xstate";
import { workoutSessionMachine } from "@/lib/workout/workout-machine";
import type { AppSettings } from "@/contexts/settings/application";
import type { Routine } from "@/lib/journal/routine-store";
import type { JournalRuntime } from "@/contexts/journal/application";
import type { Actor } from "xstate";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const mockSettings: AppSettings = {
  name: "Tester",
  restSeconds: 60,
  darkMode: false,
  lang: "en",
};

const mockRuntime = {
  runPromise: vi.fn().mockResolvedValue([]),
} as unknown as JournalRuntime;

const routineWithRest: Routine = {
  id: "r-1",
  name: "Test Routine",
  hue: "teal",
  type: "workout",
  createdAt: "2026-01-01T00:00:00.000Z",
  groups: [
    {
      id: "g-1",
      name: "Main",
      exercises: [
        {
          id: "ex-1",
          name: "Push-up",
          type: "reps",
          targetSets: 3,
          targetReps: 10,
          targetWeight: null,
          targetDuration: null,
          timerMode: "countdown",
          bilateral: false,
          dayStreak: 0,
          restSeconds: 30,
        },
      ],
    },
  ],
};

function makeActor(routine: Routine | null, settings = mockSettings) {
  return createActor(workoutSessionMachine, {
    input: { routine, settings, runtime: mockRuntime },
  });
}

// ---------------------------------------------------------------------------
// Feature
// ---------------------------------------------------------------------------

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/fe/gherkin/workout/workout-session.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  // Shared actor reference across scenarios
  let actor: Actor<typeof workoutSessionMachine>;

  Scenario("Start a blank workout", ({ Given, When, Then }) => {
    Given("the workout screen is open with no routine", () => {
      actor = makeActor(null);
      actor.start();
    });

    When("the user starts the workout", () => {
      actor.send({ type: "START" });
    });

    Then("the workout is in active exercising state", () => {
      expect(actor.getSnapshot().matches("active.exercising")).toBe(true);
      actor.stop();
    });
  });

  Scenario("Log a set triggers rest timer", ({ Given, When, Then }) => {
    Given("an active workout with one exercise with rest", () => {
      actor = makeActor(routineWithRest);
      actor.start();
      actor.send({ type: "START" });
      expect(actor.getSnapshot().matches("active.exercising")).toBe(true);
    });

    When("the user logs a set", () => {
      actor.send({
        type: "LOG_SET",
        exerciseIdx: 0,
        setData: { reps: 10, weight: null, duration: null, restTaken: null },
      });
    });

    Then("the rest timer is visible", () => {
      expect(actor.getSnapshot().matches("active.resting")).toBe(true);
      expect(actor.getSnapshot().context.restSecsLeft).toBeGreaterThan(0);
      actor.stop();
    });
  });

  Scenario("Skip rest returns to exercising", ({ Given, When, Then }) => {
    Given("the rest timer is active", () => {
      actor = makeActor(routineWithRest);
      actor.start();
      actor.send({ type: "START" });
      actor.send({
        type: "LOG_SET",
        exerciseIdx: 0,
        setData: { reps: 10, weight: null, duration: null, restTaken: null },
      });
      expect(actor.getSnapshot().matches("active.resting")).toBe(true);
    });

    When("the user skips rest", () => {
      actor.send({ type: "SKIP_REST" });
    });

    Then("the workout returns to exercising state", () => {
      expect(actor.getSnapshot().matches("active.exercising")).toBe(true);
      actor.stop();
    });
  });

  Scenario("End workout shows confirmation sheet", ({ Given, When, Then }) => {
    Given("an active workout", () => {
      actor = makeActor(null);
      actor.start();
      actor.send({ type: "START" });
    });

    When("the user ends the workout", () => {
      actor.send({ type: "END_WORKOUT" });
    });

    Then("the confirmation sheet is shown", () => {
      expect(actor.getSnapshot().matches("active.confirming")).toBe(true);
      actor.stop();
    });
  });

  Scenario("Discard workout returns to idle", ({ Given, When, Then }) => {
    Given("the confirmation sheet is shown", () => {
      actor = makeActor(null);
      actor.start();
      actor.send({ type: "START" });
      actor.send({ type: "END_WORKOUT" });
      expect(actor.getSnapshot().matches("active.confirming")).toBe(true);
    });

    When("the user discards the workout", () => {
      actor.send({ type: "DISCARD" });
    });

    Then("the workout is in idle state", () => {
      expect(actor.getSnapshot().value).toBe("idle");
      actor.stop();
    });
  });

  Scenario("Keep going continues exercising", ({ Given, When, Then }) => {
    Given("the confirmation sheet is shown", () => {
      actor = makeActor(null);
      actor.start();
      actor.send({ type: "START" });
      actor.send({ type: "END_WORKOUT" });
      expect(actor.getSnapshot().matches("active.confirming")).toBe(true);
    });

    When("the user keeps going", () => {
      actor.send({ type: "KEEP_GOING" });
    });

    Then("the workout returns to exercising state", () => {
      expect(actor.getSnapshot().matches("active.exercising")).toBe(true);
      actor.stop();
    });
  });
});
