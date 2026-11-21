import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { previousAppRoute, resolveAppRoute, type AppRouteResult } from "@/contexts/routing/application";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/app-web/behaviours/routing/app-routes.feature"),
);

describeFeature(feature, ({ Background, Scenario, ScenarioOutline }) => {
  let result: AppRouteResult;
  let currentPath = "";
  let history: string[] = [];

  Background(({ Given }) => {
    Given("the application is running", () => {
      result = resolveAppRoute("GET", "/app/home");
      expect(result.status).toBe(200);
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/routing/app-routes.feature: Visiting /app permanent-redirects to /app/home
  Scenario("Visiting /app permanent-redirects to /app/home", ({ When, Then, And }) => {
    When('a visitor requests GET "/app"', () => {
      result = resolveAppRoute("GET", "/app");
    });
    Then('the response is a 308 redirect to "/app/home"', () => {
      expect(result).toMatchObject({ status: 308, location: "/app/home" });
    });
    When('the user navigates to "/app"', () => {
      result = resolveAppRoute("GET", "/app");
      currentPath = result.location ?? "/app";
    });
    Then('the URL becomes "/app/home"', () => expect(currentPath).toBe("/app/home"));
    And("the Home screen is visible", () => expect(resolveAppRoute("GET", currentPath).screen).toBe("Home"));
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/routing/app-routes.feature: Each tab is reachable by URL
  ScenarioOutline("Each tab is reachable by URL", ({ Given, When, Then, And }, examples) => {
    const tabPath = String(examples["path"] ?? "");
    const screen = String(examples["screen"] ?? "");
    const tab = String(examples["tab"] ?? "").toLowerCase();
    Given("the app shell is visible", () => {
      expect(resolveAppRoute("GET", "/app/home").screen).toBe("Home");
    });
    When('the user navigates to "<path>"', () => {
      result = resolveAppRoute("GET", tabPath);
    });
    Then('the "<screen>" screen is visible', () => expect(result.screen).toBe(screen));
    And('the "<tab>" tab is marked active', () => expect(result.activeTab).toBe(tab));
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/routing/app-routes.feature: Back from Progress returns to Home
  Scenario("Back from Progress returns to Home", ({ Given, When, Then, And }) => {
    Given('the user navigated from "/app/home" to "/app/progress"', () => {
      history = ["/app/home", "/app/progress"];
    });
    When("the user presses the browser back button", () => {
      result = previousAppRoute(history);
    });
    Then('the URL becomes "/app/home"', () => expect(result.path).toBe("/app/home"));
    And("the Home screen is visible", () => expect(result.screen).toBe("Home"));
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/routing/app-routes.feature: Unknown segment under /app returns 404
  Scenario("Unknown segment under /app returns 404", ({ When, Then }) => {
    When('a visitor requests GET "/app/does-not-exist"', () => {
      result = resolveAppRoute("GET", "/app/does-not-exist");
    });
    Then("the response status is 404", () => expect(result.status).toBe(404));
  });
});
