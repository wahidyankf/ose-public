import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { testCaller } from "./helpers/test-caller";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/backend/health/health-check.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", async () => {
      await expect(testCaller.meta.health()).resolves.toEqual({ status: "ok" });
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/health/health-check.feature: meta.health returns status ok
  Scenario("meta.health returns status ok", ({ When, Then }) => {
    let result: { status: string };

    When("the client calls meta.health", async () => {
      result = await testCaller.meta.health();
    });

    Then('the response should contain "status" equal to "ok"', () => {
      expect(result.status).toBe("ok");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/health/health-check.feature: meta.languages returns the list of available locales
  Scenario("meta.languages returns the list of available locales", ({ When, Then, And }) => {
    let result: { code: string; label: string }[];

    When("the client calls meta.languages", async () => {
      result = await testCaller.meta.languages();
    });

    Then('the response should contain a non-null "languages" array', () => {
      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
    });

    And('the "languages" array should include "en"', () => {
      expect(result.some((l) => l.code === "en")).toBe(true);
    });

    And('the "languages" array should include "id"', () => {
      expect(result.some((l) => l.code === "id")).toBe(true);
    });
  });
});
