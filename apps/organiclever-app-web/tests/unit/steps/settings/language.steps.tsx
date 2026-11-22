import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, fireEvent, render, screen, waitFor, type RenderResult } from "@testing-library/react";
import { expect, vi } from "vitest";
import type { AppRuntime } from "@/shared/runtime";
import type { AppSettings, Lang } from "@/contexts/settings/application";

const languageHarness = vi.hoisted(() => ({
  settings: { name: "Tester", restSeconds: 60, darkMode: false, lang: "en" } as AppSettings,
  runPromise: vi.fn<(...args: unknown[]) => unknown>(),
}));

vi.mock("@/contexts/settings/presentation/use-settings", () => ({
  useSettings: () => ({
    state: { status: "ready", settings: languageHarness.settings },
    update: vi.fn<(...args: unknown[]) => unknown>().mockResolvedValue(undefined),
  }),
}));

import { SettingsScreen } from "@/contexts/settings/presentation/components/settings-screen";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/app-web/behaviours/settings/language.feature"),
);

let rendered: RenderResult;
languageHarness.runPromise.mockResolvedValue(undefined);
const runtime = { runPromise: languageHarness.runPromise } as unknown as AppRuntime;

function renderLanguage(lang: Lang) {
  languageHarness.settings = { ...languageHarness.settings, lang };
  rendered = render(
    <SettingsScreen runtime={runtime} darkMode={false} onToggleDarkMode={vi.fn<(...args: unknown[]) => unknown>()} />,
  );
}

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanup();
    languageHarness.runPromise.mockReset().mockResolvedValue(undefined);
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/settings/language.feature: Selecting Bahasa shows the app in Indonesian
  Scenario("Selecting Bahasa shows the app in Indonesian", ({ Given, When, Then }) => {
    Given("the settings screen shows language is English", () => {
      renderLanguage("en");
      expect(screen.getByTestId("lang-btn-en")).toHaveAttribute("data-active", "true");
    });
    When("the user selects Indonesian language", async () => {
      fireEvent.click(screen.getByTestId("lang-btn-id"));
      await waitFor(() => expect(languageHarness.runPromise).toHaveBeenCalled());
      languageHarness.settings = { ...languageHarness.settings, lang: "id" };
      rendered.rerender(
        <SettingsScreen
          runtime={runtime}
          darkMode={false}
          onToggleDarkMode={vi.fn<(...args: unknown[]) => unknown>()}
        />,
      );
    });
    Then("the language is set to Indonesian", () => {
      expect(screen.getByTestId("lang-btn-id")).toHaveAttribute("data-active", "true");
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/settings/language.feature: Selecting English shows the app in English
  Scenario("Selecting English shows the app in English", ({ Given, When, Then }) => {
    Given("the settings screen shows language is Indonesian", () => {
      renderLanguage("id");
      expect(screen.getByTestId("lang-btn-id")).toHaveAttribute("data-active", "true");
    });
    When("the user selects English language", async () => {
      fireEvent.click(screen.getByTestId("lang-btn-en"));
      await waitFor(() => expect(languageHarness.runPromise).toHaveBeenCalled());
      languageHarness.settings = { ...languageHarness.settings, lang: "en" };
      rendered.rerender(
        <SettingsScreen
          runtime={runtime}
          darkMode={false}
          onToggleDarkMode={vi.fn<(...args: unknown[]) => unknown>()}
        />,
      );
    });
    Then("the language is set to English", () => {
      expect(screen.getByTestId("lang-btn-en")).toHaveAttribute("data-active", "true");
    });
  });
});
