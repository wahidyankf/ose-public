import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { checkManifestIntegrity } from "../../../src/features/course-paths/core/manifest-integrity";
import { checkPrerequisiteConsistency } from "../../../src/features/course-paths/core/prerequisites";
import type { PathManifest } from "../../../src/features/course-paths/core/schemas";
import { manifestFixture } from "../features/course-paths/manifest-fixture";

const behavioursRoot = path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths");

const libraryCourseIds = ["foundations", "application", "advanced"] as const;

const prerequisitesByCourse: Record<string, readonly string[]> = {
  foundations: [],
  application: ["foundations"],
  advanced: ["application"],
};

const integrityFeature = await loadFeature(path.join(behavioursRoot, "manifest-integrity.feature"));

describeFeature(integrityFeature, ({ Scenario }) => {
  let manifest: PathManifest;
  let result: ReturnType<typeof checkManifestIntegrity>;

  Scenario("Every manifest course reference resolves to a real course", ({ Given, When, Then, And }) => {
    Given("a path manifest lists phases of course IDs", () => {
      manifest = manifestFixture({ courses: ["foundations", "application", "advanced"] });
    });

    When("the manifest-integrity check runs", () => {
      result = checkManifestIntegrity(manifest, libraryCourseIds);
    });

    Then("every listed course ID resolves to an existing course in the library", () => {
      expect(result.unresolvedIds).toEqual([]);
    });

    And("no course ID appears more than once in the manifest", () => {
      expect(result.duplicateIds).toEqual([]);
      expect(new Set(manifest.courseOrder.map(String)).size).toBe(manifest.courseOrder.length);
    });
  });
});

const orderingFeature = await loadFeature(path.join(behavioursRoot, "prerequisite-consistent-ordering.feature"));

describeFeature(orderingFeature, ({ Scenario }) => {
  let manifest: PathManifest;
  let result: ReturnType<typeof checkPrerequisiteConsistency>;

  Scenario("A path manifest is a valid topological entry into the prerequisite DAG", ({ Given, When, Then, And }) => {
    Given("a path manifest lists phases of course IDs", () => {
      manifest = manifestFixture({ courses: ["foundations", "application", "advanced"] });
    });

    When("the prerequisite-consistency check runs", () => {
      result = checkPrerequisiteConsistency(manifest, prerequisitesByCourse, libraryCourseIds);
    });

    Then("no course appears before any of its declared prerequisites that are also in the manifest", () => {
      expect(result.violations).toEqual([]);
    });

    And("the check reports zero ordering violations for that manifest", () => {
      expect(result.violations).toHaveLength(0);
      expect(result.unresolvedPrerequisiteIds).toEqual([]);
    });
  });

  Scenario(
    "A path may link a prerequisite it does not include, without failing integrity",
    ({ Given, When, Then, And }) => {
      Given("a path manifest includes a course whose declared prerequisite is absent from that manifest", () => {
        manifest = manifestFixture({ courses: ["advanced"] });
      });

      When("the prerequisite-consistency check runs", () => {
        result = checkPrerequisiteConsistency(manifest, prerequisitesByCourse, libraryCourseIds);
      });

      Then("the absent prerequisite is not reported as a violation", () => {
        expect(result.violations).toEqual([]);
      });

      And("the absent prerequisite appears in the check's informational linkedPrerequisites list", () => {
        expect(result.linkedPrerequisites).toEqual([{ courseId: "advanced", missingPrerequisiteId: "application" }]);
      });
    },
  );
});
