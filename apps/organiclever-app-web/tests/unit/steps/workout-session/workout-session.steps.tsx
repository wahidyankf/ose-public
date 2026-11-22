/**
 * Step definitions for the Workout Session feature.
 *
 * Covers: specs/apps/organiclever/app-web/behaviours/workout-session/workout-session.feature
 *
 * Tests workoutSessionMachine directly (no browser APIs, no PGlite).
 */

import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect, vi } from "vitest";
import { createActor } from "xstate";
import { workoutSessionMachine } from "@/contexts/workout-session/application";
import type { AppSettings } from "@/contexts/settings/application";
import type { Routine } from "@/contexts/routine/application";
import type { JournalRuntime } from "@/contexts/journal/application";
import type { Actor } from "xstate";
import { cleanup, render, screen } from "@testing-library/react";
import FinishPage from "@/app/app/workout/finish/page";

// The finish page is a React route; its router and runtime context are stood in here.
const finishPageDouble = vi.hoisted(() => ({
  replace: vi.fn<(...args: unknown[]) => unknown>(),
  completedSession: null as unknown,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: finishPageDouble.replace,
    push: vi.fn<(...args: unknown[]) => unknown>(),
    back: vi.fn<(...args: unknown[]) => unknown>(),
  }),
}));

vi.mock("@/contexts/app-shell/presentation/app-runtime-context", () => ({
  useAppRuntime: () => ({
    completedSession: finishPageDouble.completedSession,
    setCompletedSession: vi.fn<(...args: unknown[]) => unknown>(),
  }),
}));

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
  runPromise: vi.fn<(...args: unknown[]) => unknown>().mockResolvedValue([]),
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
  path.resolve(
    __dirname,
    "../../../../../../specs/apps/organiclever/app-web/behaviours/workout-session/workout-session.feature",
  ),
);

describeFeature(feature, ({ Scenario }) => {
  // Shared actor reference across scenarios
  let actor: Actor<typeof workoutSessionMachine>;

  // @scenario specs/apps/organiclever/app-web/behaviours/workout-session/workout-session.feature: Starting a blank workout lets the user begin logging sets
  Scenario("Starting a blank workout lets the user begin logging sets", ({ Given, When, Then }) => {
    Given("the app shell has no selected routine", () => {
      actor = makeActor(null);
    });

    When("the user opens a blank workout", () => {
      actor.start();
      actor.send({ type: "START" });
    });

    Then("the user can log sets", () => {
      expect(actor.getSnapshot().matches("active.exercising")).toBe(true);
      actor.stop();
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/workout-session/workout-session.feature: Log a set triggers rest timer
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

  // @scenario specs/apps/organiclever/app-web/behaviours/workout-session/workout-session.feature: Skipping rest hides the rest timer
  Scenario("Skipping rest hides the rest timer", ({ Given, When, Then }) => {
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

    Then("the rest timer is hidden", () => {
      expect(actor.getSnapshot().matches("active.exercising")).toBe(true);
      actor.stop();
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/workout-session/workout-session.feature: End workout shows confirmation sheet
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

  // @scenario specs/apps/organiclever/app-web/behaviours/workout-session/workout-session.feature: Discarding the workout ends it
  Scenario("Discarding the workout ends it", ({ Given, When, Then }) => {
    Given("the user has opened the confirmation sheet", () => {
      actor = makeActor(null);
      actor.start();
      actor.send({ type: "START" });
      actor.send({ type: "END_WORKOUT" });
      expect(actor.getSnapshot().matches("active.confirming")).toBe(true);
    });

    When("the user discards the workout", () => {
      actor.send({ type: "DISCARD" });
    });

    Then("no workout is in progress", () => {
      expect(actor.getSnapshot().value).toBe("idle");
      actor.stop();
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/workout-session/workout-session.feature: Keep going closes the confirmation sheet and the workout continues
  Scenario("Keep going closes the confirmation sheet and the workout continues", ({ Given, When, Then }) => {
    Given("the user has opened the confirmation sheet", () => {
      actor = makeActor(null);
      actor.start();
      actor.send({ type: "START" });
      actor.send({ type: "END_WORKOUT" });
      expect(actor.getSnapshot().matches("active.confirming")).toBe(true);
    });

    When("the user keeps going", () => {
      actor.send({ type: "KEEP_GOING" });
    });

    Then("the workout continues", () => {
      expect(actor.getSnapshot().matches("active.exercising")).toBe(true);
      actor.stop();
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/workout-session/workout-session.feature: Opening /app/workout/finish without a finished workout returns to /app/home
  Scenario("Opening /app/workout/finish without a finished workout returns to /app/home", ({ Given, When, Then }) => {
    Given("no workout has been finished", () => {
      finishPageDouble.completedSession = null;
      finishPageDouble.replace.mockReset();
    });

    When("the user opens the workout finish page", () => {
      render(<FinishPage />);
    });

    Then("the Home screen is visible", () => {
      expect(finishPageDouble.replace).toHaveBeenCalledWith("/app/home");
      cleanup();
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/workout-session/workout-session.feature: Finishing a workout shows the workout summary
  Scenario("Finishing a workout shows the workout summary", ({ Given, When, Then }) => {
    Given("the user has finished a workout with one logged set", () => {
      finishPageDouble.completedSession = {
        durationSecs: 1800,
        exercises: [{ name: "Push-up", sets: 1 }],
        routineName: null,
      };
      finishPageDouble.replace.mockReset();
    });

    When("the user saves and finishes the workout", () => {
      render(<FinishPage />);
    });

    Then("the workout summary is shown", () => {
      expect(screen.getByText("Nice work.")).toBeTruthy();
      expect(screen.getByText("Workout complete")).toBeTruthy();
      expect(screen.getByText("Quick workout")).toBeTruthy();
      expect(screen.getByText("Exercise breakdown")).toBeTruthy();
      expect(finishPageDouble.replace).not.toHaveBeenCalled();
      cleanup();
    });
  });
});
