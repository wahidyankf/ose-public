import { readdir } from "node:fs/promises";
import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { structuralBuckets } from "../../../src/features/content/core/structural-buckets";
import { integrationCaller } from "../be-steps/helpers/integration-caller";
import { followRedirects, type RedirectJourney } from "../be-steps/helpers/next-config-delivery";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature",
  ),
);

describeFeature(feature, ({ Scenario, ScenarioOutline, Background }) => {
  let buckets: string[] = [];
  let journey: RedirectJourney = { finalPath: "", hops: 0, healthy: false };

  Background(({ Given }) => {
    Given("the app is running", async () => {
      buckets = [];
      journey = { finalPath: "", hops: 0, healthy: false };
      await expect(integrationCaller.meta.health()).resolves.toEqual({ status: "ok" });
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature: The Learn section offers only Paths, Courses, and Legacy
  Scenario("The Learn section offers only Paths, Courses, and Legacy", ({ When, Then, And }) => {
    When("the content tree under the en learn section is inspected", async () => {
      const entries = await readdir(path.resolve(process.cwd(), "content/en/learn"), { withFileTypes: true });
      buckets = structuralBuckets(
        entries.map((entry) => ({ name: entry.name, kind: entry.isDirectory() ? "directory" : "file" })),
      );
    });
    Then("its only structural buckets are paths, courses, and legacy", () => {
      expect(buckets).toEqual(["courses", "legacy", "paths"]);
    });
    And("no former subject domain remains as a direct child of the learn section", () => {
      expect(buckets).not.toContain("software-engineering");
      expect(buckets).not.toContain("artificial-intelligence");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature: legacy domain URLs redirect to the legacy bucket
  ScenarioOutline("legacy domain URLs redirect to the legacy bucket", ({ When, Then, And }, variables) => {
    const domain = String(variables.domain);
    When('a visitor navigates to "/en/learn/<domain>/overview"', async () => {
      journey = await followRedirects(`/en/learn/${domain}/overview`);
    });
    Then('the current URL should contain "/en/learn/legacy/<domain>/overview"', () => {
      expect(journey.finalPath).toBe(`/en/learn/legacy/${domain}/overview`);
      expect(journey.hops).toBe(1);
    });
    And("the response status should not be a client or server error", () => {
      expect(journey.healthy).toBe(true);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature: A stale /c-bookmarked legacy domain URL redirects to its legacy address in two hops
  ScenarioOutline(
    "A stale /c-bookmarked legacy domain URL redirects to its legacy address in two hops",
    ({ When, Then, And }, variables) => {
      const domain = String(variables.domain);
      When('a visitor navigates to "/en/c/learn/<domain>/overview"', async () => {
        journey = await followRedirects(`/en/c/learn/${domain}/overview`);
      });
      Then('the current URL should contain "/en/learn/legacy/<domain>/overview"', () => {
        expect(journey.finalPath).toBe(`/en/learn/legacy/${domain}/overview`);
        expect(journey.hops).toBe(2);
      });
      And("the response status should not be a client or server error", () => {
        expect(journey.healthy).toBe(true);
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature: A historical learn-reorg source chains through to its legacy address
  Scenario("A historical learn-reorg source chains through to its legacy address", ({ When, Then, And }) => {
    When('a visitor navigates to "/en/learn/human/overview"', async () => {
      journey = await followRedirects("/en/learn/human/overview");
    });
    Then('the current URL should contain "/en/learn/legacy/personal-development/overview"', () => {
      expect(journey.finalPath).toBe("/en/learn/legacy/personal-development/overview");
      expect(journey.hops).toBe(2);
    });
    And("the response status should not be a client or server error", () => {
      expect(journey.healthy).toBe(true);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature: canonical URLs are not rewritten to legacy
  ScenarioOutline("canonical URLs are not rewritten to legacy", ({ When, Then }, variables) => {
    const url = String(variables.url);
    When('a visitor navigates to "<url>"', async () => {
      journey = await followRedirects(url);
    });
    Then('the current URL should not contain "/legacy/"', () => {
      expect(journey).toEqual({ finalPath: url, hops: 0, healthy: true });
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature: The legacy redirect does not interfere with a re-homed fundamentally-strong course URL
  Scenario(
    "The legacy redirect does not interfere with a re-homed fundamentally-strong course URL",
    ({ When, Then }) => {
      When('a visitor navigates to "/en/learn/fundamentally-strong/software-engineer/just-enough-python"', async () => {
        journey = await followRedirects("/en/learn/fundamentally-strong/software-engineer/just-enough-python");
      });
      Then('the current URL should contain "/en/learn/courses/just-enough-python"', () => {
        expect(journey.finalPath).toBe("/en/learn/courses/just-enough-python");
        expect(journey.hops).toBe(1);
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature: A deep legacy path keeps its sub-taxonomy verbatim
  Scenario("A deep legacy path keeps its sub-taxonomy verbatim", ({ When, Then, And }) => {
    When(
      'a visitor navigates to "/en/learn/software-engineering/programming-languages/python/by-example/advanced"',
      async () => {
        journey = await followRedirects(
          "/en/learn/software-engineering/programming-languages/python/by-example/advanced",
        );
      },
    );
    Then(
      'the current URL should contain "/en/learn/legacy/software-engineering/programming-languages/python/by-example/advanced"',
      () => {
        expect(journey.finalPath).toBe(
          "/en/learn/legacy/software-engineering/programming-languages/python/by-example/advanced",
        );
      },
    );
    And("the response status should not be a client or server error", () => {
      expect(journey.healthy).toBe(true);
    });
  });
});
