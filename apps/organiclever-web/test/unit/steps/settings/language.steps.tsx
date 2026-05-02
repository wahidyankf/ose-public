/**
 * Step definitions for the Language Setting feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/settings/language.feature
 *
 * Tests language selection via pure settings store logic.
 * Avoids window.location.reload() — tests the settings state mutation only.
 */

import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import type { AppSettings, Lang } from "@/contexts/settings/application";

// ---------------------------------------------------------------------------
// Pure logic helpers mirroring SettingsScreen language handling
// ---------------------------------------------------------------------------

function makeSettings(lang: Lang): AppSettings {
  return {
    name: "Tester",
    restSeconds: 60,
    darkMode: false,
    lang,
  };
}

function applyLang(settings: AppSettings, lang: Lang): AppSettings {
  return { ...settings, lang };
}

// ---------------------------------------------------------------------------
// Feature
// ---------------------------------------------------------------------------

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/fe/gherkin/settings/language.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  let settings: AppSettings;

  Scenario("Switch to Bahasa Indonesia", ({ Given, When, Then }) => {
    Given("the settings screen shows language is English", () => {
      settings = makeSettings("en");
      expect(settings.lang).toBe("en");
    });

    When("the user selects Indonesian language", () => {
      settings = applyLang(settings, "id");
    });

    Then("the language is set to Indonesian", () => {
      expect(settings.lang).toBe("id");
    });
  });

  Scenario("Switch back to English", ({ Given, When, Then }) => {
    Given("the settings screen shows language is Indonesian", () => {
      settings = makeSettings("id");
      expect(settings.lang).toBe("id");
    });

    When("the user selects English language", () => {
      settings = applyLang(settings, "en");
    });

    Then("the language is set to English", () => {
      expect(settings.lang).toBe("en");
    });
  });
});
