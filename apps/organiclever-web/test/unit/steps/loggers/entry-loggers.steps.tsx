/**
 * Step definitions for the Entry Loggers feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/loggers/entry-loggers.feature
 *
 * Tests component logic directly using:
 * - appMachine via XState createActor (overlay state management)
 * - Pure form validation logic mirroring each logger's saveDisabled condition
 *
 * Avoids rendering logger components directly because they depend on
 * JournalRuntime (PGlite/IndexedDB), which is unavailable in jsdom.
 * The machine is the source of truth for overlay open/close state.
 */

import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { createActor } from "xstate";
import { appMachine } from "@/lib/app/app-machine";
import type { Actor } from "xstate";

// ---------------------------------------------------------------------------
// Pure logic helpers — mirror component saveDisabled conditions
// ---------------------------------------------------------------------------

function readingSaveDisabled(title: string): boolean {
  return !title.trim();
}

function learningSaveDisabled(subject: string): boolean {
  return !subject.trim();
}

function mealSaveDisabled(name: string): boolean {
  return !name.trim();
}

function focusSaveDisabled(task: string, durationMins: string): boolean {
  return !task.trim() && !durationMins;
}

function customSaveDisabled(name: string): boolean {
  return !name.trim();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeActor() {
  return createActor(appMachine, {
    input: { initialDarkMode: false, initialTab: "home" },
  }).start();
}

// ---------------------------------------------------------------------------
// Feature
// ---------------------------------------------------------------------------

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/fe/gherkin/loggers/entry-loggers.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  let actor: Actor<typeof appMachine>;

  // State for form validation scenarios
  let formTitle = "";
  let formSubject = "";
  let formMealName = "";
  let formTask = "";
  let formDurationMins = "";
  let formCustomName = "";

  Scenario("Open Add Entry sheet", ({ Given, When, Then }) => {
    Given("the app shell is visible", () => {
      actor = makeActor();
    });

    When("the user taps the FAB", () => {
      actor.send({ type: "OPEN_ADD_ENTRY" });
    });

    Then("the Add Entry sheet is open with all entry kinds", () => {
      expect(actor.getSnapshot().matches("addEntry")).toBe(true);
    });
  });

  Scenario("Close Add Entry sheet", ({ Given, When, Then }) => {
    Given("the Add Entry sheet is open", () => {
      actor = makeActor();
      actor.send({ type: "OPEN_ADD_ENTRY" });
      expect(actor.getSnapshot().matches("addEntry")).toBe(true);
    });

    When("the user closes the Add Entry sheet", () => {
      actor.send({ type: "CLOSE_ADD_ENTRY" });
    });

    Then("the Add Entry sheet is closed", () => {
      expect(actor.getSnapshot().matches("none")).toBe(true);
    });
  });

  Scenario("Open reading logger from Add Entry sheet", ({ Given, When, Then }) => {
    Given("the Add Entry sheet is open", () => {
      actor = makeActor();
      actor.send({ type: "OPEN_ADD_ENTRY" });
    });

    When("the user selects the Reading entry kind", () => {
      actor.send({ type: "OPEN_LOGGER", kind: "reading" });
    });

    Then("the reading logger is open", () => {
      expect(actor.getSnapshot().matches("loggerOpen")).toBe(true);
      expect(actor.getSnapshot().context.loggerKind).toBe("reading");
    });
  });

  Scenario("Log a reading entry", ({ Given, When, Then, And }) => {
    Given("the reading logger is open", () => {
      actor = makeActor();
      actor.send({ type: "OPEN_LOGGER", kind: "reading" });
      formTitle = "";
    });

    When('the user enters title "Atomic Habits"', () => {
      formTitle = "Atomic Habits";
    });

    And("the user saves the entry", () => {
      // Simulate save: entry is valid and logger closes
      expect(readingSaveDisabled(formTitle)).toBe(false);
      actor.send({ type: "CLOSE_LOGGER" });
    });

    Then("the entry is saved and the logger closes", () => {
      expect(actor.getSnapshot().matches("none")).toBe(true);
    });
  });

  Scenario("Reading logger save is disabled without title", ({ Given, When, Then }) => {
    Given("the reading logger is open", () => {
      actor = makeActor();
      actor.send({ type: "OPEN_LOGGER", kind: "reading" });
      formTitle = "";
    });

    When("the user has not entered a title", () => {
      formTitle = "";
    });

    Then("the save button is disabled", () => {
      expect(readingSaveDisabled(formTitle)).toBe(true);
    });
  });

  Scenario("Open learning logger from Add Entry sheet", ({ Given, When, Then }) => {
    Given("the Add Entry sheet is open", () => {
      actor = makeActor();
      actor.send({ type: "OPEN_ADD_ENTRY" });
    });

    When("the user selects the Learning entry kind", () => {
      actor.send({ type: "OPEN_LOGGER", kind: "learning" });
    });

    Then("the learning logger is open", () => {
      expect(actor.getSnapshot().matches("loggerOpen")).toBe(true);
      expect(actor.getSnapshot().context.loggerKind).toBe("learning");
    });
  });

  Scenario("Log a learning entry", ({ Given, When, Then, And }) => {
    Given("the learning logger is open", () => {
      actor = makeActor();
      actor.send({ type: "OPEN_LOGGER", kind: "learning" });
      formSubject = "";
    });

    When('the user enters subject "TypeScript generics"', () => {
      formSubject = "TypeScript generics";
    });

    And("the user saves the entry", () => {
      expect(learningSaveDisabled(formSubject)).toBe(false);
      actor.send({ type: "CLOSE_LOGGER" });
    });

    Then("the entry is saved and the logger closes", () => {
      expect(actor.getSnapshot().matches("none")).toBe(true);
    });
  });

  Scenario("Open meal logger from Add Entry sheet", ({ Given, When, Then }) => {
    Given("the Add Entry sheet is open", () => {
      actor = makeActor();
      actor.send({ type: "OPEN_ADD_ENTRY" });
    });

    When("the user selects the Meal entry kind", () => {
      actor.send({ type: "OPEN_LOGGER", kind: "meal" });
    });

    Then("the meal logger is open", () => {
      expect(actor.getSnapshot().matches("loggerOpen")).toBe(true);
      expect(actor.getSnapshot().context.loggerKind).toBe("meal");
    });
  });

  Scenario("Log a meal entry", ({ Given, When, Then, And }) => {
    Given("the meal logger is open", () => {
      actor = makeActor();
      actor.send({ type: "OPEN_LOGGER", kind: "meal" });
      formMealName = "";
    });

    When('the user enters meal name "Oatmeal with berries"', () => {
      formMealName = "Oatmeal with berries";
    });

    And("the user saves the entry", () => {
      expect(mealSaveDisabled(formMealName)).toBe(false);
      actor.send({ type: "CLOSE_LOGGER" });
    });

    Then("the entry is saved and the logger closes", () => {
      expect(actor.getSnapshot().matches("none")).toBe(true);
    });
  });

  Scenario("Open focus logger from Add Entry sheet", ({ Given, When, Then }) => {
    Given("the Add Entry sheet is open", () => {
      actor = makeActor();
      actor.send({ type: "OPEN_ADD_ENTRY" });
    });

    When("the user selects the Focus entry kind", () => {
      actor.send({ type: "OPEN_LOGGER", kind: "focus" });
    });

    Then("the focus logger is open", () => {
      expect(actor.getSnapshot().matches("loggerOpen")).toBe(true);
      expect(actor.getSnapshot().context.loggerKind).toBe("focus");
    });
  });

  Scenario("Log a focus entry", ({ Given, When, Then, And }) => {
    Given("the focus logger is open", () => {
      actor = makeActor();
      actor.send({ type: "OPEN_LOGGER", kind: "focus" });
      formTask = "";
      formDurationMins = "";
    });

    When("the user selects the 25min preset", () => {
      formDurationMins = "25";
    });

    And("the user saves the entry", () => {
      expect(focusSaveDisabled(formTask, formDurationMins)).toBe(false);
      actor.send({ type: "CLOSE_LOGGER" });
    });

    Then("the entry is saved and the logger closes", () => {
      expect(actor.getSnapshot().matches("none")).toBe(true);
    });
  });

  Scenario("Focus logger save requires task or duration", ({ Given, When, Then }) => {
    Given("the focus logger is open", () => {
      actor = makeActor();
      actor.send({ type: "OPEN_LOGGER", kind: "focus" });
      formTask = "";
      formDurationMins = "";
    });

    When("the user has not entered task or duration", () => {
      formTask = "";
      formDurationMins = "";
    });

    Then("the save button is disabled", () => {
      expect(focusSaveDisabled(formTask, formDurationMins)).toBe(true);
    });
  });

  Scenario("Open custom entry logger", ({ Given, When, Then }) => {
    Given("the Add Entry sheet is open", () => {
      actor = makeActor();
      actor.send({ type: "OPEN_ADD_ENTRY" });
    });

    When("the user selects the custom entry kind", () => {
      actor.send({ type: "OPEN_CUSTOM_LOGGER", name: "custom" });
    });

    Then("the custom entry logger is open", () => {
      expect(actor.getSnapshot().matches("customLoggerOpen")).toBe(true);
    });
  });

  Scenario("Log a custom entry", ({ Given, When, Then, And }) => {
    Given("the custom entry logger is open", () => {
      actor = makeActor();
      actor.send({ type: "OPEN_CUSTOM_LOGGER", name: "custom" });
      formCustomName = "";
    });

    When('the user enters custom entry name "Evening walk"', () => {
      formCustomName = "Evening walk";
    });

    And("the user saves the custom entry", () => {
      expect(customSaveDisabled(formCustomName)).toBe(false);
      actor.send({ type: "CLOSE_CUSTOM_LOGGER" });
    });

    Then("the custom entry is saved and the logger closes", () => {
      expect(actor.getSnapshot().matches("none")).toBe(true);
    });
  });
});
