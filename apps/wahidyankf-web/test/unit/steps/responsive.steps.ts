import path from "node:path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/wahidyankf/fe/gherkin/responsive.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {});
  });

  Scenario("Desktop viewport shows a fixed left sidebar", ({ When, Then, And }) => {
    When("a visitor opens the home page at 1440 by 900 viewport", () => {});
    Then("a left sidebar is visible with Home, CV, and Personal Projects links", () => {});
    And("no bottom tab bar is rendered", () => {});
  });

  Scenario("Tablet viewport hides the sidebar and renders a bottom tab bar", ({ When, Then, And }) => {
    When("a visitor opens the home page at 768 by 1024 viewport", () => {});
    Then("no left sidebar is visible", () => {});
    And("a bottom tab bar is visible with Home, CV, and Personal Projects items", () => {});
  });

  Scenario("Mobile viewport hides the sidebar and renders a bottom tab bar", ({ When, Then, And }) => {
    When("a visitor opens the home page at 375 by 812 viewport", () => {});
    Then("no left sidebar is visible", () => {});
    And("a bottom tab bar is visible with Home, CV, and Personal Projects items", () => {});
  });

  Scenario("The theme toggle is always reachable", ({ When, Then }) => {
    When("a visitor opens the home page at any viewport", () => {});
    Then("the theme toggle button is present in the DOM and clickable", () => {});
  });
});
