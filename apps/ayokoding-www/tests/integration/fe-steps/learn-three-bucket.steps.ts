import { readdir } from "node:fs/promises";
import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { structuralBuckets } from "../../../src/features/content/core/structural-buckets";
import { integrationCaller } from "../be-steps/helpers/integration-caller";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature",
  ),
);

describeFeature(
  feature,
  ({ Scenario, Background }) => {
    let buckets: string[] = [];

    Background(({ Given }) => {
      Given("the app is running", async () => {
        buckets = [];
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
  },
  { excludeTags: ["integration-exempt"] },
);
