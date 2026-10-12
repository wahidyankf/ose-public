import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import {
  checkPathModelIntegrity,
  type PathModelContext,
} from "../../../src/features/course-paths/core/manifest-integrity";
import {
  PathManifestFileSchema,
  type PathManifest,
  type PathPhase,
} from "../../../src/features/course-paths/core/schemas";
import { manifestFixture } from "../features/course-paths/manifest-fixture";

const behavioursRoot = path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths");

const closureFeature = await loadFeature(path.join(behavioursRoot, "core-closure.feature"));

const FIXTURE_META = {
  pathId: "careers/interview-ready/software-engineer",
  arc: "interview-ready",
  title: "Interview-Ready",
  description: "A deterministic path-model fixture.",
} as const;

describeFeature(closureFeature, ({ Scenario }) => {
  Scenario("A core course whose prerequisite is neither earlier nor assumed fails", ({ Given, When, Then, And }) => {
    let manifest: PathManifest;
    let context: PathModelContext;
    let violations: ReturnType<typeof checkPathModelIntegrity>;

    Given("a manifest whose core course declares a prerequisite outside the path", () => {
      manifest = manifestFixture({
        ...FIXTURE_META,
        courses: ["a-foundation", "b-tooling"],
      });
      context = {
        prerequisitesByCourse: {
          "a-foundation": [],
          "b-tooling": ["a-foundation", "outside-course"],
          "outside-course": [],
        },
        outlineCourseIds: new Set<string>(),
        libraryCourseIds: ["a-foundation", "b-tooling", "outside-course"],
      };
    });

    And("the manifest does not list that prerequisite in assumes", () => {
      expect(manifest.assumes).not.toContain("outside-course");
    });

    When("the path model integrity check runs", () => {
      violations = checkPathModelIntegrity(manifest, context);
    });

    Then("it reports a closure violation naming the course and the missing prerequisite", () => {
      expect(violations.closure).toEqual([{ courseId: "b-tooling", missingPrerequisite: "outside-course" }]);
    });
  });

  Scenario("A prerequisite listed in assumes satisfies the closure rule", ({ Given, When, Then, And }) => {
    let manifest: PathManifest;
    let context: PathModelContext;
    let violations: ReturnType<typeof checkPathModelIntegrity>;

    Given("a manifest whose core course declares a prerequisite outside the path", () => {
      manifest = manifestFixture({
        ...FIXTURE_META,
        assumes: ["outside-course"],
        courses: ["a-foundation", "b-tooling"],
      });
      context = {
        prerequisitesByCourse: {
          "a-foundation": [],
          "b-tooling": ["a-foundation", "outside-course"],
          "outside-course": [],
        },
        outlineCourseIds: new Set<string>(),
        libraryCourseIds: ["a-foundation", "b-tooling", "outside-course"],
      };
    });

    And("the manifest lists that prerequisite in assumes", () => {
      expect(manifest.assumes).toContain("outside-course");
    });

    When("the path model integrity check runs", () => {
      violations = checkPathModelIntegrity(manifest, context);
    });

    Then("it reports no closure violation for that course", () => {
      expect(violations.closure).toEqual([]);
    });
  });

  Scenario("An outline course in a core phase fails", ({ Given, When, Then, And }) => {
    let manifest: PathManifest;
    let context: PathModelContext;
    let violations: ReturnType<typeof checkPathModelIntegrity>;

    Given("a manifest whose core phase lists a course with status outline", () => {
      manifest = manifestFixture({
        ...FIXTURE_META,
        courses: ["a-foundation", "b-tooling"],
      });
      context = {
        prerequisitesByCourse: { "a-foundation": [], "b-tooling": ["a-foundation"] },
        outlineCourseIds: new Set(["b-tooling"]),
        libraryCourseIds: ["a-foundation", "b-tooling"],
      };
    });

    And("the manifest carries no skills restructure marker", () => {
      expect(manifest.restructurePendingIn).toBeUndefined();
    });

    When("the path model integrity check runs", () => {
      violations = checkPathModelIntegrity(manifest, context);
    });

    Then("it reports an outline-in-core violation naming the course", () => {
      expect(violations.outlineInCore).toEqual(["b-tooling"]);
    });
  });

  Scenario("The core equals the goals plus their prerequisite closure", ({ Given, When, Then, And }) => {
    let manifest: PathManifest;
    let context: PathModelContext;
    let violations: ReturnType<typeof checkPathModelIntegrity>;

    Given("a manifest that declares goals", () => {
      manifest = manifestFixture({
        ...FIXTURE_META,
        goals: ["c-capstone"],
        assumes: ["outside-course"],
        phases: [
          {
            id: "foundations",
            title: "Foundations",
            kind: "core",
            outcome: { can: "start" },
            courses: ["a-foundation", "b-tooling"],
          },
          {
            id: "arrival",
            title: "Arrival",
            kind: "core",
            outcome: { can: "finish" },
            courses: ["c-capstone"],
          },
        ],
      });
      context = {
        prerequisitesByCourse: {
          "a-foundation": [],
          "b-tooling": ["a-foundation"],
          "c-capstone": ["b-tooling", "outside-course"],
          "outside-course": [],
        },
        outlineCourseIds: new Set<string>(),
        libraryCourseIds: ["a-foundation", "b-tooling", "c-capstone", "outside-course"],
      };
    });

    When("the path model integrity check runs", () => {
      violations = checkPathModelIntegrity(manifest, context);
    });

    Then("the set of core courses equals the goals plus every transitive prerequisite not in assumes", () => {
      expect(violations.goalsOutsideCore).toEqual([]);
      expect(violations.coreMismatch).toBeNull();
    });

    And("any missing or extra core course is reported by ID", () => {
      expect(violations.coreMismatch).toBeNull();
    });
  });

  Scenario("An assumed course that no core course needs fails", ({ Given, When, Then }) => {
    let manifest: PathManifest;
    let context: PathModelContext;
    let violations: ReturnType<typeof checkPathModelIntegrity>;

    Given("a manifest whose assumes lists a course that no core course declares as a prerequisite", () => {
      manifest = manifestFixture({
        ...FIXTURE_META,
        assumes: ["outside-course", "unneeded-course"],
        courses: ["a-foundation", "b-tooling"],
      });
      context = {
        prerequisitesByCourse: {
          "a-foundation": [],
          "b-tooling": ["a-foundation", "outside-course"],
          "outside-course": [],
          "unneeded-course": [],
        },
        outlineCourseIds: new Set<string>(),
        libraryCourseIds: ["a-foundation", "b-tooling", "outside-course", "unneeded-course"],
      };
    });

    When("the path model integrity check runs", () => {
      violations = checkPathModelIntegrity(manifest, context);
    });

    Then("it reports an unused-assumes violation naming that course", () => {
      expect(violations.unusedAssumes).toEqual(["unneeded-course"]);
    });
  });

  Scenario("Phases are well formed", ({ Given, When, Then }) => {
    let manifest: PathManifest;
    let context: PathModelContext;
    let violations: ReturnType<typeof checkPathModelIntegrity>;

    Given("a manifest with a duplicate phase ID, an empty phase, or a core phase after an extension phase", () => {
      // `courses: []` cannot pass the schema, so this synthetic manifest bypasses the
      // fixture: phases are written by hand and courseOrder is derived the way the schema
      // derives it (flatMap over phases), keeping the two coherent.
      const clean = manifestFixture({ ...FIXTURE_META, courses: ["a-foundation", "b-tooling"] });
      const phases: PathPhase[] = [
        { id: "dup", title: "Dup", kind: "core", outcome: { can: "start" }, courses: ["a-foundation"] },
        { id: "dup", title: "Dup Again", kind: "core", outcome: { can: "continue" }, courses: ["b-tooling"] },
        { id: "empty", title: "Empty", kind: "core", outcome: { can: "nothing" }, courses: [] },
        { id: "depth", title: "Depth", kind: "extension", courses: ["x-extra"] },
        { id: "late-core", title: "Late Core", kind: "core", outcome: { can: "finish" }, courses: ["c-capstone"] },
      ];
      manifest = {
        ...clean,
        phases,
        courseOrder: phases.flatMap((phase) => phase.courses),
      };
      context = {
        prerequisitesByCourse: {
          "a-foundation": [],
          "b-tooling": ["a-foundation"],
          "x-extra": [],
          "c-capstone": ["b-tooling"],
        },
        outlineCourseIds: new Set<string>(),
        libraryCourseIds: ["a-foundation", "b-tooling", "x-extra", "c-capstone"],
      };
    });

    When("the path model integrity check runs", () => {
      violations = checkPathModelIntegrity(manifest, context);
    });

    Then("it reports each malformed phase", () => {
      expect(violations.duplicatePhaseIds).toEqual(["dup"]);
      expect(violations.emptyPhaseIds).toEqual(["empty"]);
      expect(violations.coreAfterExtension).toEqual(["late-core"]);
    });
  });

  Scenario("A skills path has no extension phase", ({ Given, When, Then }) => {
    let manifest: PathManifest;
    let context: PathModelContext;
    let violations: ReturnType<typeof checkPathModelIntegrity>;

    Given("a skills manifest that declares an extension phase", () => {
      manifest = manifestFixture({
        pathId: "skills/conventional-accounting",
        arc: "immediately-effective",
        title: "Conventional Accounting",
        description: "A deterministic skills fixture.",
        phases: [
          {
            id: "core-one",
            title: "Core One",
            kind: "core",
            outcome: { can: "start" },
            courses: ["a-foundation"],
          },
          { id: "depth", title: "Depth", kind: "extension", courses: ["x-extra"] },
        ],
      });
      context = {
        prerequisitesByCourse: { "a-foundation": [], "x-extra": [] },
        outlineCourseIds: new Set<string>(),
        libraryCourseIds: ["a-foundation", "x-extra"],
      };
    });

    When("the path model integrity check runs", () => {
      violations = checkPathModelIntegrity(manifest, context);
    });

    Then("it reports a skills-extension violation", () => {
      expect(violations.skillsExtension).toEqual(["depth"]);
    });
  });

  Scenario("A career manifest cannot carry the skills restructure marker", ({ Given, When, Then }) => {
    let parse: ReturnType<typeof PathManifestFileSchema.safeParse>;

    Given("a career path manifest file that declares restructurePendingIn", () => {
      parse = PathManifestFileSchema.safeParse({
        pathId: "careers/interview-ready/software-engineer",
        arc: "interview-ready",
        title: "Interview-Ready",
        description: "A deterministic career fixture.",
        restructurePendingIn: "plan-06",
        phases: [
          {
            id: "all-courses",
            title: "Interview-Ready",
            kind: "core",
            courses: ["a-foundation"],
          },
        ],
      });
    });

    When("the manifest schema parses it", () => {
      expect(parse).toBeDefined();
    });

    Then("parsing fails", () => {
      expect(parse.success).toBe(false);
    });
  });

  Scenario("Only an allowlisted skills path may carry the marker, with its own plan", ({ Given, When, Then, And }) => {
    let parse: ReturnType<typeof PathManifestFileSchema.safeParse>;

    Given("a skills manifest file that declares restructurePendingIn", () => {
      parse = PathManifestFileSchema.safeParse({
        pathId: "skills/conventional-accounting",
        arc: "immediately-effective",
        title: "Conventional Accounting",
        description: "A deterministic skills fixture.",
        restructurePendingIn: "plan-07",
        phases: [
          {
            id: "all-courses",
            title: "Conventional Accounting",
            kind: "core",
            courses: ["a-foundation"],
          },
        ],
      });
    });

    And("its path ID is not in the allowlist, or its value is not the allowlisted plan for that path", () => {
      expect(parse.success).toBe(false);
    });

    When("the manifest schema parses it", () => {
      expect(parse).toBeDefined();
    });

    Then("parsing fails", () => {
      expect(parse.success).toBe(false);
    });
  });

  Scenario("A marked skills manifest is exempt only from the core rules", ({ Given, When, Then, But }) => {
    let manifest: PathManifest;
    let context: PathModelContext;
    let violations: ReturnType<typeof checkPathModelIntegrity>;

    Given("an allowlisted skills manifest with its marker, outline courses, and outside prerequisites", () => {
      manifest = manifestFixture({
        pathId: "skills/conventional-accounting",
        arc: "immediately-effective",
        title: "Conventional Accounting",
        description: "A deterministic marked fixture.",
        restructurePendingIn: "plan-06",
        assumes: [],
        phases: [
          {
            id: "all-courses",
            title: "Conventional Accounting",
            kind: "core",
            courses: ["a-foundation", "b-tooling", "b-tooling", "ghost-course"],
          },
        ],
      });
      context = {
        prerequisitesByCourse: {
          "a-foundation": ["outside-course"],
          "b-tooling": [],
          "ghost-course": [],
          "outside-course": [],
        },
        outlineCourseIds: new Set(["b-tooling"]),
        libraryCourseIds: ["a-foundation", "b-tooling", "outside-course"],
      };
    });

    When("the path model integrity check runs", () => {
      violations = checkPathModelIntegrity(manifest, context);
    });

    Then("it reports no closure, outline-in-core, goals, assumes, skills-shape, or outcome violation", () => {
      expect(violations.closure).toEqual([]);
      expect(violations.outlineInCore).toEqual([]);
      expect(violations.goalsOutsideCore).toEqual([]);
      expect(violations.coreMismatch).toBeNull();
      expect(violations.unusedAssumes).toEqual([]);
      expect(violations.assumesInsidePath).toEqual([]);
      expect(violations.unresolvedAssumes).toEqual([]);
      expect(violations.skillsExtension).toEqual([]);
      expect(violations.markerNotAllowed).toBe(false);
    });

    But("it still reports unresolved and duplicate course IDs", () => {
      expect(violations.unresolvedIds).toEqual(["ghost-course"]);
      expect(violations.duplicateIds).toEqual(["b-tooling"]);
    });
  });
});
