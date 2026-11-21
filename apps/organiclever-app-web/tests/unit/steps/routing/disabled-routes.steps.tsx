import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { resolveAppRoute, type AppRouteResult } from "@/contexts/routing/application";

const feature = await loadFeature(
  path.resolve(
    __dirname,
    "../../../../../../specs/apps/organiclever/app-web/behaviours/routing/disabled-routes.feature",
  ),
);

describeFeature(feature, ({ ScenarioOutline }) => {
  let result: AppRouteResult;

  // @scenario specs/apps/organiclever/app-web/behaviours/routing/disabled-routes.feature: Disabled routes return 404
  ScenarioOutline("Disabled routes return 404", ({ Given, When, Then }, examples) => {
    const method = String(examples["method"] ?? "");
    const routePath = String(examples["path"] ?? "");
    Given("the application is running in local-first mode", () => {
      expect(resolveAppRoute("GET", "/app/home").status).toBe(200);
    });
    When("a visitor requests <method> <path>", () => {
      result = resolveAppRoute(method, routePath);
    });
    Then("the response status is 404", () => expect(result.status).toBe(404));
  });
});
