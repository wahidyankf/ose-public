import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { testCaller } from "./helpers/test-caller";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/oseplatform/be/gherkin/health/health.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", () => {
      // test caller is ready
    });
  });

  Scenario("Health endpoint returns ok status", ({ When, Then }) => {
    let result: { status: string };

    When("the health endpoint is called", async () => {
      result = await testCaller.meta.health();
    });

    Then('the response contains status "ok"', () => {
      expect(result.status).toBe("ok");
    });
  });
});
