import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import Home from "../../../src/app/page";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../specs/apps/ose/app-web/behaviours/smoke/smoke.feature"),
);

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(cleanup);

  // @scenario specs/apps/ose/app-web/behaviours/smoke/smoke.feature: Home page shows the OSE Application heading
  Scenario("Home page shows the OSE Application heading", ({ Given, When, Then }) => {
    let routeComponent: typeof Home;

    Given("the ose-app-web dev server is running", () => {
      // The Unit adapter replaces the HTTP/process boundary with the configured route component.
      routeComponent = Home;
      expect(routeComponent).toBeTypeOf("function");
    });

    When('I navigate to "/"', () => {
      render(routeComponent());
    });

    Then('I see the heading "OSE Application"', () => {
      expect(screen.getByRole("heading", { level: 1, name: "OSE Application" })).toBeVisible();
    });
  });

  // @scenario specs/apps/ose/app-web/behaviours/smoke/smoke.feature: Home page offers a Get Started button
  Scenario("Home page offers a Get Started button", ({ Given, When, Then }) => {
    let routeComponent: typeof Home;

    Given("the ose-app-web dev server is running", () => {
      routeComponent = Home;
      expect(routeComponent).toBeTypeOf("function");
    });

    When('I navigate to "/"', () => {
      render(routeComponent());
    });

    Then('I see a "Get Started" button', () => {
      expect(screen.getByRole("button", { name: "Get Started" })).toBeVisible();
    });
  });
});
