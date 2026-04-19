import path from "node:path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/wahidyankf/fe/gherkin/accessibility.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {});
  });

  Scenario("Home page has zero axe-core WCAG 2.1 AA violations", ({ When, Then }) => {
    When("a visitor opens the home page", () => {});
    Then("an axe-core scan against WCAG 2.1 AA reports zero violations", () => {});
  });

  Scenario("CV page has zero axe-core WCAG 2.1 AA violations", ({ When, Then }) => {
    When("a visitor opens the CV page", () => {});
    Then("an axe-core scan against WCAG 2.1 AA reports zero violations", () => {});
  });

  Scenario("Every page has exactly one H1", ({ When, Then }) => {
    When("a visitor opens any of the home, CV, or personal-projects pages", () => {});
    Then("each of those pages has exactly one H1 element", () => {});
  });

  Scenario("Interactive controls expose accessible names", ({ When, Then, And }) => {
    When("a visitor opens the home page", () => {});
    Then("the theme toggle button exposes an aria-label", () => {});
    And("every navigation link exposes link text or an aria-label", () => {});
  });
});
