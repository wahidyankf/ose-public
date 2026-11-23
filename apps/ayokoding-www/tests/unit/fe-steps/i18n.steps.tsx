import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "../../../src/features/i18n/core/config";
import { t } from "../../../src/features/i18n/core/translations";
import { buildLocaleSwitchHref } from "../../../src/features/i18n/shell/language-switcher";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/i18n/i18n.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  let locale = "";
  let currentHref = "";

  Background(({ Given }) => {
    Given("the app is running", () => {
      expect(SUPPORTED_LOCALES).toEqual(["en", "id"]);
      locale = "";
      currentHref = "";
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/i18n/i18n.feature: Language switcher displays the current locale
  Scenario("Language switcher displays the current locale", ({ When, Then }) => {
    When("a visitor is on a page under the /en locale", () => {
      currentHref = "/en/learn";
      locale = currentHref.split("/")[1] ?? "";
    });
    Then('the language switcher should display "English" as the current language', () => {
      expect(LOCALE_LABELS[locale as keyof typeof LOCALE_LABELS]).toBe("English");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/i18n/i18n.feature: Switching language redirects to the locale-specific URL
  Scenario("Switching language redirects to the locale-specific URL", ({ Given, When, Then }) => {
    Given("a visitor is on the English AI benchmark page at /en/tools/ai-benchmark", () => {
      currentHref = "/en/tools/ai-benchmark";
    });
    When("the visitor selects Indonesian from the language switcher", () => {
      currentHref = buildLocaleSwitchHref(currentHref, new URLSearchParams(), "id");
    });
    Then("the visitor should be redirected to the Indonesian AI benchmark page at /id/tools/ai-benchmark", () => {
      expect(currentHref).toBe("/id/tools/ai-benchmark");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/i18n/i18n.feature: UI labels change to the selected language
  Scenario("UI labels change to the selected language", ({ When, Then, And }) => {
    When("a visitor is on the Indonesian version of a page", () => {
      locale = "id";
    });
    Then("navigation labels and UI text should be displayed in Indonesian", () => {
      expect(t("id", "search")).not.toBe(t("en", "search"));
      expect(t("id", "breadcrumbHome")).not.toBe(t("en", "breadcrumbHome"));
    });
    And("the page title and headings should reflect the Indonesian locale content", () => {
      expect(t("id", "toolsPageTitle")).toBe("Alat");
      expect(t("id", "toolsPageTitle")).not.toBe(t("en", "toolsPageTitle"));
    });
  });
});
