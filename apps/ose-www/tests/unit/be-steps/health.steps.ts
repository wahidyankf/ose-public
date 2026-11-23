import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { testCaller } from "./helpers/test-caller";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../specs/apps/ose/www/behaviours/backend/health/health.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", () => {
      expect(testCaller.health.check).toBeTypeOf("function");
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/health/health.feature: Health endpoint returns ok status
  Scenario("Health endpoint returns ok status", ({ When, Then }) => {
    let result: { status: string };

    When("the health endpoint is called", async () => {
      result = await testCaller.health.check();
    });

    Then('the response contains status "ok"', () => {
      expect(result.status).toBe("ok");
    });
  });
});
