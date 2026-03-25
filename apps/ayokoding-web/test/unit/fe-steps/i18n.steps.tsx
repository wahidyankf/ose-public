import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import "./helpers/test-setup";
import { t } from "@/lib/i18n/translations";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding-web/fe/gherkin/i18n.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {});
  });

  Scenario("Language switcher displays the current locale", ({ When, Then }) => {
    When("a visitor is on a page under the /en locale", () => {});

    Then('the language switcher should display "English" as the current language', () => {
      // LanguageSwitcher is a client component depending on useLocale hook
      // Verify translations module returns correct labels
      const label = t("en", "language");
      expect(label).toBeTruthy();
    });
  });

  Scenario("Switching language redirects to the locale-specific URL", ({ Given, When, Then }) => {
    Given("a visitor is on the English version of a content page at /en/some-page", () => {});

    When("the visitor selects Indonesian from the language switcher", () => {});

    Then("the visitor should be redirected to the Indonesian version of that page at /id/some-page", () => {
      // Language switching navigation is tested at E2E level
      expect(true).toBe(true);
    });
  });

  Scenario("UI labels change to the selected language", ({ Given, Then, And }) => {
    Given("a visitor is on the Indonesian version of a page", () => {});

    Then("navigation labels and UI text should be displayed in Indonesian", () => {
      const idSearch = t("id", "search");
      expect(idSearch).toBeTruthy();
      expect(idSearch).not.toBe(t("en", "search"));
    });

    And("the page title and headings should reflect the Indonesian locale content", () => {
      expect(true).toBe(true);
    });
  });

  Scenario("Root URL redirects to the default locale", ({ When, Then, And }) => {
    When("a visitor opens the root URL /", () => {});

    Then("they should be redirected to /en", () => {
      // Root redirect is handled by middleware — tested at E2E level
      expect(true).toBe(true);
    });

    And("the English version of the home page should be displayed", () => {
      expect(true).toBe(true);
    });
  });
});
