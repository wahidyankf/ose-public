/**
 * Step definitions for the Dark Mode feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/settings/dark-mode.feature
 *
 * Tests dark mode toggle via appMachine (XState) directly.
 * The machine is the source of truth for darkMode state; SettingsScreen
 * calls onToggleDarkMode which dispatches TOGGLE_DARK_MODE to the machine.
 */

import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { createActor } from "xstate";
import { appMachine } from "@/lib/app/app-machine";
import type { Actor } from "xstate";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeActor(initialDarkMode: boolean) {
  return createActor(appMachine, {
    input: { initialDarkMode, initialTab: "settings" },
  }).start();
}

// ---------------------------------------------------------------------------
// Feature
// ---------------------------------------------------------------------------

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/fe/gherkin/settings/dark-mode.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  let actor: Actor<typeof appMachine>;

  Scenario("Toggle dark mode on", ({ Given, When, Then }) => {
    Given("the settings screen shows dark mode is off", () => {
      actor = makeActor(false);
      expect(actor.getSnapshot().context.darkMode).toBe(false);
    });

    When("the user toggles dark mode", () => {
      actor.send({ type: "TOGGLE_DARK_MODE" });
    });

    Then("dark mode is enabled", () => {
      expect(actor.getSnapshot().context.darkMode).toBe(true);
      actor.stop();
    });
  });

  Scenario("Toggle dark mode off", ({ Given, When, Then }) => {
    Given("dark mode is enabled", () => {
      actor = makeActor(true);
      expect(actor.getSnapshot().context.darkMode).toBe(true);
    });

    When("the user toggles dark mode", () => {
      actor.send({ type: "TOGGLE_DARK_MODE" });
    });

    Then("dark mode is disabled", () => {
      expect(actor.getSnapshot().context.darkMode).toBe(false);
      actor.stop();
    });
  });
});
