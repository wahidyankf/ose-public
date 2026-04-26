/**
 * Step definitions for the Disabled Routes feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/routing/disabled-routes.feature
 *
 * Verifies that previously-removed routes have no corresponding page/route
 * files on disk. Next.js serves 404 for any path with no matching file,
 * so absent files are the authoritative source of truth for routing.
 */
import path from "path";
import { existsSync } from "fs";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/fe/gherkin/routing/disabled-routes.feature"),
);

const appRoot = path.resolve(__dirname, "../../../../../src/app");

/**
 * Resolves the file-system path candidates for a Next.js App Router route.
 * GET /login -> src/app/login/page.tsx
 * GET /profile -> src/app/profile/page.tsx
 */
function routeFilePaths(method: string, routePath: string): string[] {
  const segments = routePath.replace(/^\//, "").split("/");
  const dir = path.join(appRoot, ...segments);
  if (method === "GET") {
    return [
      path.join(dir, "page.tsx"),
      path.join(dir, "page.ts"),
      path.join(dir, "page.jsx"),
      path.join(dir, "page.js"),
    ];
  }
  return [path.join(dir, "route.ts"), path.join(dir, "route.js")];
}

describeFeature(feature, ({ ScenarioOutline }) => {
  ScenarioOutline("Disabled routes return 404", ({ Given, When, Then }, examples) => {
    // The examples object provides the substituted values for this row.
    const method = String(examples["method"] ?? "");
    const routePath = String(examples["path"] ?? "");

    Given("the application is running in local-first mode", () => {
      // Local-first mode is the default — no setup required.
    });

    // Step text must match the raw feature step (before example substitution).
    When("a visitor requests <method> <path>", () => {
      // The method and routePath values are captured from the examples row above.
      // Assertion happens in Then to keep Given/When/Then structure clean.
    });

    Then("the response status is 404", () => {
      const candidates = routeFilePaths(method, routePath);
      const anyExists = candidates.some((p) => existsSync(p));
      expect(anyExists, `Route file found for ${method} ${routePath} — this route should be disabled`).toBe(false);
    });
  });
});
