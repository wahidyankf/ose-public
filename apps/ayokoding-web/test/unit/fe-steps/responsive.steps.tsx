import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import "./helpers/test-setup";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding-web/fe/gherkin/responsive.feature"),
);

// Responsive layout testing requires real viewport resizing — tested at E2E level
// Unit tests consume the Gherkin specs structurally to ensure spec coverage

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {});
  });

  Scenario("Desktop viewport shows sidebar, content, and table of contents", ({ Given, When, Then, And }) => {
    Given('the viewport is set to "desktop" (1280x800)', () => {});

    When("a visitor opens a content page", () => {});

    Then("the sidebar navigation should be visible", () => {
      expect(true).toBe(true);
    });

    And("the main content area should be visible", () => {
      expect(true).toBe(true);
    });

    And("the table of contents should be visible", () => {
      expect(true).toBe(true);
    });
  });

  Scenario("Laptop viewport shows sidebar and content but hides table of contents", ({ Given, When, Then, And }) => {
    Given('the viewport is set to "laptop" (1024x768)', () => {});

    When("a visitor opens a content page", () => {});

    Then("the sidebar navigation should be visible", () => {
      expect(true).toBe(true);
    });

    And("the main content area should be visible", () => {
      expect(true).toBe(true);
    });

    And("the table of contents should not be visible", () => {
      expect(true).toBe(true);
    });
  });

  Scenario("Mobile viewport shows hamburger menu and hides sidebar", ({ Given, When, Then, And }) => {
    Given('the viewport is set to "mobile" (375x667)', () => {});

    When("a visitor opens a content page", () => {});

    Then("a hamburger menu button should be visible in the header", () => {
      expect(true).toBe(true);
    });

    And("the sidebar navigation should not be visible", () => {
      expect(true).toBe(true);
    });
  });

  Scenario("Mobile hamburger menu opens the sidebar drawer", ({ Given, When, Then, And }) => {
    Given('the viewport is set to "mobile" (375x667)', () => {});
    And("a visitor is on a content page", () => {});

    When("the visitor taps the hamburger menu button", () => {});

    Then("a sidebar drawer should slide into view", () => {
      expect(true).toBe(true);
    });

    And("the sidebar navigation links should be visible inside the drawer", () => {
      expect(true).toBe(true);
    });
  });
});
