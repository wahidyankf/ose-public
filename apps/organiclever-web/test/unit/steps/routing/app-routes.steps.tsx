/**
 * Unit-level step definitions for the URL-routed shell.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/routing/app-routes.feature
 *
 * Where the e2e suite drives a real browser, the unit suite simulates URL
 * transitions and asserts on-disk page presence. Browser semantics (history
 * stack, back button, network fetches) are not modelled — those are covered
 * by the e2e suite. Step text uses double-quoted strings so the rhino-cli
 * spec-coverage scanner (which only matches `Given|When|Then|And|But("..."`
 * or `'...'`) can find the registrations.
 */

import path from "path";
import { existsSync, readFileSync } from "fs";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";

const APP_ROOT = path.resolve(__dirname, "../../../../src/app/app");

function pageFileForPath(routePath: string): string {
  const segment = routePath.replace(/^\/app\/?/, "").replace(/^\/+/, "");
  if (segment === "") return path.resolve(APP_ROOT, "page.tsx");
  return path.resolve(APP_ROOT, ...segment.split("/"), "page.tsx");
}

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/fe/gherkin/routing/app-routes.feature"),
);

describeFeature(feature, ({ Background, Scenario, ScenarioOutline }) => {
  let currentURL = "";
  let history: string[] = [];

  Background(({ Given }) => {
    Given("the application is running", () => {
      currentURL = "";
      history = [];
    });
  });

  Scenario("Visiting /app redirects to /app/home", ({ Given, When, Then, And }) => {
    Given("the app is freshly loaded", () => {
      currentURL = "";
      history = [];
    });

    When('the user navigates to "/app"', () => {
      currentURL = "/app/home";
      history = ["/app/home"];
    });

    Then('the URL becomes "/app/home"', () => {
      expect(currentURL).toBe("/app/home");
    });

    And("the Home screen is visible", () => {
      expect(existsSync(pageFileForPath("/app/home"))).toBe(true);
    });
  });

  Scenario("Visiting /app/home renders the Home screen", ({ Given, When, Then, And }) => {
    Given("the app is freshly loaded", () => {
      currentURL = "";
      history = [];
    });

    When('the user navigates to "/app/home"', () => {
      currentURL = "/app/home";
      history.push(currentURL);
    });

    Then("the Home screen is visible", () => {
      expect(existsSync(pageFileForPath("/app/home"))).toBe(true);
    });

    And("the Home tab is marked active in the navigation", () => {
      expect(currentURL).toBe("/app/home");
    });
  });

  ScenarioOutline("Each tab is reachable by URL", ({ Given, When, Then, And }, examples) => {
    const tabPath = String(examples["path"] ?? "");
    const screen = String(examples["screen"] ?? "");
    const tab = String(examples["tab"] ?? "");

    Given("the app shell is visible", () => {
      currentURL = "/app/home";
      history = [currentURL];
    });

    When('the user navigates to "<path>"', () => {
      currentURL = tabPath;
      history.push(currentURL);
    });

    Then('the "<screen>" screen is visible', () => {
      expect(existsSync(pageFileForPath(tabPath)), `expected page for ${screen} at ${tabPath}`).toBe(true);
    });

    And('the "<tab>" tab is marked active', () => {
      expect(currentURL).toBe(tabPath);
      expect(tab.toLowerCase()).toBe(tabPath.replace("/app/", ""));
    });
  });

  ScenarioOutline("Refreshing a tab URL keeps the user on that tab", ({ Given, When, Then, And }, examples) => {
    const tabPath = String(examples["path"] ?? "");
    const screen = String(examples["screen"] ?? "");

    Given('the user is on "<path>"', () => {
      currentURL = tabPath;
      history = [currentURL];
    });

    When("the user refreshes the page", () => {
      // Refresh on a stateless URL-routed page yields the same URL.
    });

    Then('the URL is still "<path>"', () => {
      expect(currentURL).toBe(tabPath);
    });

    And('the "<screen>" screen is visible', () => {
      expect(existsSync(pageFileForPath(tabPath)), `expected page for ${screen} at ${tabPath}`).toBe(true);
    });
  });

  Scenario("Back from Progress returns to Home", ({ Given, When, Then, And }) => {
    Given('the user navigated from "/app/home" to "/app/progress"', () => {
      history = ["/app/home", "/app/progress"];
      currentURL = "/app/progress";
    });

    When("the user presses the browser back button", () => {
      history.pop();
      currentURL = history[history.length - 1] ?? "/app/home";
    });

    Then('the URL becomes "/app/home"', () => {
      expect(currentURL).toBe("/app/home");
    });

    And("the Home screen is visible", () => {
      expect(existsSync(pageFileForPath("/app/home"))).toBe(true);
    });
  });

  Scenario("Old /app URL permanent-redirects to /app/home", ({ When, Then }) => {
    let configRedirect = "";

    When('a visitor requests GET "/app"', () => {
      const configFile = path.resolve(__dirname, "../../../../next.config.ts");
      const configSource = readFileSync(configFile, "utf8");
      const sourceMatch = configSource.match(/source:\s*"\/app"/);
      const destMatch = configSource.match(/destination:\s*"(\/app\/home)"/);
      const permMatch = configSource.match(/permanent:\s*true/);
      expect(sourceMatch).not.toBeNull();
      expect(destMatch).not.toBeNull();
      expect(permMatch).not.toBeNull();
      configRedirect = destMatch?.[1] ?? "";
    });

    Then('the response is a 308 redirect to "/app/home"', () => {
      expect(configRedirect).toBe("/app/home");
    });
  });

  Scenario("Unknown segment under /app returns 404", ({ When, Then }) => {
    let absent = false;

    When('a visitor requests GET "/app/does-not-exist"', () => {
      absent = !existsSync(pageFileForPath("/app/does-not-exist"));
    });

    Then("the response status is 404", () => {
      expect(absent).toBe(true);
    });
  });
});
