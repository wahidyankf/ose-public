import path from "node:path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/wahidyankf/fe/gherkin/personal-projects.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {});
  });

  Scenario("Personal projects page renders the heading", ({ When, Then }) => {
    When("a visitor opens the personal projects page", () => {});
    Then('the H1 shows "Personal Projects"', () => {});
  });

  Scenario("Personal projects page renders a search input", ({ When, Then }) => {
    When("a visitor opens the personal projects page", () => {});
    Then('a search input with placeholder "Search projects..." is visible', () => {});
  });

  Scenario("Personal projects page lists at least one project card", ({ When, Then }) => {
    When("a visitor opens the personal projects page", () => {});
    Then("at least one project card is visible", () => {});
  });

  Scenario("Each project card exposes external links where applicable", ({ When, Then }) => {
    When("a visitor opens the personal projects page", () => {});
    Then(
      "every project card exposes a Repository, Website, or YouTube link where the project has that resource",
      () => {},
    );
  });
});
