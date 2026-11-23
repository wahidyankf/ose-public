import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { refreshAppRoute, resolveAppRoute, type AppRouteResult } from "@/contexts/routing/application";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/app-web/behaviours/app-shell/navigation.feature"),
);

describeFeature(feature, ({ ScenarioOutline }) => {
  let route: AppRouteResult;

  // @scenario specs/apps/organiclever/app-web/behaviours/app-shell/navigation.feature: Tapping a tab opens its screen and marks the tab active
  ScenarioOutline("Tapping a tab opens its screen and marks the tab active", ({ Given, When, Then, And }, examples) => {
    const tab = String(examples["tab"] ?? "");
    const screen = String(examples["screen"] ?? "");
    Given("the app shell is visible", () => {
      route = resolveAppRoute("GET", "/app/home");
    });
    When('the user taps the "<tab>" tab', () => {
      route = resolveAppRoute("GET", `/app/${tab.toLowerCase()}`);
    });
    Then('the "<screen>" screen is visible', () => expect(route).toMatchObject({ status: 200, screen }));
    And('the "<tab>" tab is marked active', () => expect(route.activeTab).toBe(tab.toLowerCase()));
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/app-shell/navigation.feature: URL persists across page refresh on each tab
  ScenarioOutline("URL persists across page refresh on each tab", ({ Given, When, Then, And }, examples) => {
    const refreshPath = String(examples["path"] ?? "");
    const expectedScreen = String(examples["screen"] ?? "");
    Given('the user is on "<path>"', () => {
      route = resolveAppRoute("GET", refreshPath);
    });
    When("the user refreshes the page", () => {
      route = refreshAppRoute(route.path);
    });
    Then('the URL is still "<path>"', () => expect(route.path).toBe(refreshPath));
    And('the "<screen>" screen is visible', () => expect(route.screen).toBe(expectedScreen));
  });
});
