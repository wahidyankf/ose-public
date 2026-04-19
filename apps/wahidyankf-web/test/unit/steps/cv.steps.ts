import path from "node:path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";

const feature = await loadFeature(path.resolve(process.cwd(), "../../specs/apps/wahidyankf/fe/gherkin/cv.feature"));

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {});
  });

  Scenario("CV renders the Curriculum Vitae heading", ({ When, Then }) => {
    When("a visitor opens the CV page", () => {});
    Then('the H1 shows "Curriculum Vitae"', () => {});
  });

  Scenario("CV renders a search input", ({ When, Then }) => {
    When("a visitor opens the CV page", () => {});
    Then('a search input with placeholder "Search CV entries..." is visible', () => {});
  });

  Scenario("CV renders the Highlights section header", ({ When, Then }) => {
    When("a visitor opens the CV page", () => {});
    Then('a "Highlights" section header is visible', () => {});
  });

  Scenario("CV cross-linked via scrollTop query scrolls into the entries", ({ When, Then }) => {
    When('a visitor opens the CV page with search term "TypeScript" and scrollTop true', () => {});
    Then("the page scrolls past Highlights into the matching entries", () => {});
  });
});
