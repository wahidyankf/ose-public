import path from "node:path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";

const feature = await loadFeature(path.resolve(process.cwd(), "../../specs/apps/wahidyankf/fe/gherkin/search.feature"));

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {});
  });

  Scenario("Typing a term updates the URL query string", ({ When, And, Then }) => {
    When("a visitor opens the home page", () => {});
    And('the visitor types "TypeScript" in the search input', () => {});
    Then("the URL becomes /?search=TypeScript", () => {});
  });

  Scenario("Matching content is highlighted with a yellow mark", ({ When, Then }) => {
    When('a visitor opens the home page with search term "TypeScript"', () => {});
    Then('the matching pill wraps "TypeScript" in a mark element', () => {});
  });

  Scenario("Non-matching About Me shows a placeholder", ({ When, Then }) => {
    When('a visitor opens the home page with search term "NoSuchTerm"', () => {});
    Then('the About Me card shows "No matching content in the About Me section."', () => {});
  });

  Scenario("Clicking a skill pill navigates to the CV with scrollTop", ({ When, And, Then }) => {
    When("a visitor opens the home page", () => {});
    And('the visitor clicks the "TypeScript" skill pill', () => {});
    Then("the URL becomes /cv?search=TypeScript&scrollTop=true", () => {});
  });
});
