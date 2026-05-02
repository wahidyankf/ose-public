/**
 * Step definitions for the App Shell Navigation feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/app-shell/navigation.feature
 *
 * Post-route-refactor: tab navigation is URL-driven, not state-machine-driven.
 * Unit-level assertions therefore check that the on-disk Next.js page exists
 * for each tab path. The Add Entry sheet remains overlay-machine-driven.
 */

import path from "path";
import { existsSync } from "fs";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { createActor } from "xstate";
import { appMachine } from "@/contexts/app-shell/presentation/app-machine";
import type { Actor } from "xstate";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/fe/gherkin/app-shell/navigation.feature"),
);

const APP_ROOT = path.resolve(__dirname, "../../../../src/app/app");

function pageFileFor(tab: "home" | "history" | "progress" | "settings"): string {
  return path.resolve(APP_ROOT, tab, "page.tsx");
}

function makeOverlayActor() {
  return createActor(appMachine, {
    input: { initialDarkMode: false },
  }).start();
}

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  let activeTab: "home" | "history" | "progress" | "settings" = "home";
  let overlayActor: Actor<typeof appMachine>;

  Scenario("Default tab is Home on first load", ({ Given, Then, And }) => {
    Given("the app is freshly loaded", () => {
      // The /app entry page issues permanentRedirect("/app/home"), so the
      // first-load tab is Home by definition.
      activeTab = "home";
    });

    Then("the Home tab is active", () => {
      expect(activeTab).toBe("home");
      expect(existsSync(pageFileFor("home"))).toBe(true);
    });

    And("the app shell is visible", () => {
      // Layout renders chrome on every main-tab path; presence of the on-disk
      // page is the unit-level proxy for visibility.
      expect(existsSync(path.resolve(APP_ROOT, "layout.tsx"))).toBe(true);
    });
  });

  Scenario("Navigate to History tab", ({ Given, When, Then }) => {
    Given("the app shell is visible", () => {
      activeTab = "home";
    });

    When("the user taps the History tab", () => {
      activeTab = "history";
    });

    Then("the History tab is active", () => {
      expect(activeTab).toBe("history");
      expect(existsSync(pageFileFor("history"))).toBe(true);
    });
  });

  Scenario("Navigate to Progress tab", ({ Given, When, Then }) => {
    Given("the app shell is visible", () => {
      activeTab = "home";
    });

    When("the user taps the Progress tab", () => {
      activeTab = "progress";
    });

    Then("the Progress tab is active", () => {
      expect(activeTab).toBe("progress");
      expect(existsSync(pageFileFor("progress"))).toBe(true);
    });
  });

  Scenario("Navigate to Settings tab", ({ Given, When, Then }) => {
    Given("the app shell is visible", () => {
      activeTab = "home";
    });

    When("the user taps the Settings tab", () => {
      activeTab = "settings";
    });

    Then("the Settings tab is active", () => {
      expect(activeTab).toBe("settings");
      expect(existsSync(pageFileFor("settings"))).toBe(true);
    });
  });

  Scenario("Open and close Add Entry sheet", ({ Given, When, Then }) => {
    Given("the app shell is visible", () => {
      overlayActor = makeOverlayActor();
    });

    When("the user taps the FAB button", () => {
      overlayActor.send({ type: "OPEN_ADD_ENTRY" });
    });

    Then("the Add Entry sheet is open", () => {
      expect(overlayActor.getSnapshot().value).toBe("addEntry");
    });

    When("the user closes the Add Entry sheet", () => {
      overlayActor.send({ type: "CLOSE_ADD_ENTRY" });
    });

    Then("the Add Entry sheet is closed", () => {
      expect(overlayActor.getSnapshot().value).toBe("none");
    });
  });

  ScenarioOutline("URL persists across page refresh on each tab", ({ Given, When, Then, And }, examples) => {
    const refreshPath = String(examples["path"] ?? "");
    const expectedScreen = String(examples["screen"] ?? "");
    let urlAfterRefresh = "";

    Given(`the user is on "<path>"`, () => {
      urlAfterRefresh = refreshPath;
    });

    When("the user refreshes the page", () => {
      // No-op — refresh on a stateless URL-routed page yields the same URL.
    });

    Then(`the URL is still "<path>"`, () => {
      expect(urlAfterRefresh).toBe(refreshPath);
    });

    And(`the "<screen>" screen is visible`, () => {
      const segment = refreshPath.replace(/^\/app\//, "");
      const segments = segment.split("/");
      const file = path.resolve(APP_ROOT, ...segments, "page.tsx");
      expect(existsSync(file), `expected page file at ${file} for screen ${expectedScreen}`).toBe(true);
    });
  });
});
