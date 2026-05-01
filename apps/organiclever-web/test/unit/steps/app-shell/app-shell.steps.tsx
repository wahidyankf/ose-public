/**
 * Step definitions for the App Shell Navigation feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/app-shell/navigation.feature
 *
 * Tests appMachine directly via XState v5 createActor to avoid browser
 * dependencies (window, localStorage) that make rendering AppRoot in jsdom
 * unreliable. The machine is the source of truth for navigation state.
 */

import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { createActor } from "xstate";
import { appMachine } from "@/lib/app/app-machine";
import type { Actor } from "xstate";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/fe/gherkin/app-shell/navigation.feature"),
);

function makeActor() {
  return createActor(appMachine, {
    input: { initialDarkMode: false, initialTab: "home" },
  }).start();
}

describeFeature(feature, ({ Scenario }) => {
  // actor shared across steps within a scenario via closure
  let actor: Actor<typeof appMachine>;

  Scenario("Default tab is Home on first load", ({ Given, Then, And }) => {
    Given("the app is freshly loaded", () => {
      actor = makeActor();
    });

    Then("the Home tab is active", () => {
      expect(actor.getSnapshot().context.tab).toBe("home");
    });

    And("the app shell is visible", () => {
      expect(actor.getSnapshot().matches({ navigation: "main" })).toBe(true);
    });
  });

  Scenario("Navigate to History tab", ({ Given, When, Then }) => {
    Given("the app shell is visible", () => {
      actor = makeActor();
    });

    When("the user taps the History tab", () => {
      actor.send({ type: "NAVIGATE_TAB", tab: "history" });
    });

    Then("the History tab is active", () => {
      expect(actor.getSnapshot().context.tab).toBe("history");
    });
  });

  Scenario("Navigate to Progress tab", ({ Given, When, Then }) => {
    Given("the app shell is visible", () => {
      actor = makeActor();
    });

    When("the user taps the Progress tab", () => {
      actor.send({ type: "NAVIGATE_TAB", tab: "progress" });
    });

    Then("the Progress tab is active", () => {
      expect(actor.getSnapshot().context.tab).toBe("progress");
    });
  });

  Scenario("Navigate to Settings tab", ({ Given, When, Then }) => {
    Given("the app shell is visible", () => {
      actor = makeActor();
    });

    When("the user taps the Settings tab", () => {
      actor.send({ type: "NAVIGATE_TAB", tab: "settings" });
    });

    Then("the Settings tab is active", () => {
      expect(actor.getSnapshot().context.tab).toBe("settings");
    });
  });

  Scenario("Open and close Add Entry sheet", ({ Given, When, Then }) => {
    Given("the app shell is visible", () => {
      actor = makeActor();
    });

    When("the user taps the FAB button", () => {
      actor.send({ type: "OPEN_ADD_ENTRY" });
    });

    Then("the Add Entry sheet is open", () => {
      expect(actor.getSnapshot().matches({ overlay: "addEntry" })).toBe(true);
    });

    When("the user closes the Add Entry sheet", () => {
      actor.send({ type: "CLOSE_ADD_ENTRY" });
    });

    Then("the Add Entry sheet is closed", () => {
      expect(actor.getSnapshot().matches({ overlay: "none" })).toBe(true);
    });
  });
});
