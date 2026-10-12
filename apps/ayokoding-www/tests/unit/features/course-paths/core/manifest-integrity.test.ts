import { describe, expect, it } from "vitest";
import {
  checkManifestIntegrity,
  checkPathModelIntegrity,
  isCleanPathModel,
  type PathModelContext,
} from "../../../../../src/features/course-paths/core/manifest-integrity";
import type { PrerequisitesByCourse } from "../../../../../src/features/course-paths/core/prerequisites";
import type { PathManifest, PathPhase } from "../../../../../src/features/course-paths/core/schemas";
import { manifestFixture } from "../manifest-fixture";

const libraryCourseIds: readonly string[] = [
  "just-enough-python",
  "data-structures-and-algorithms-essentials",
  "advanced-algorithms",
];

const cleanManifest = manifestFixture({
  pathId: "skills/algorithms",
  arc: "algorithms",
  title: "Algorithms",
  description: "Algorithms path",
  courses: ["just-enough-python", "data-structures-and-algorithms-essentials", "advanced-algorithms"],
});

const unresolvedManifest = manifestFixture({
  pathId: "skills/algorithms",
  arc: "algorithms",
  title: "Algorithms",
  description: "Algorithms path",
  courses: ["just-enough-python", "does-not-exist-in-the-library"],
});

const duplicateManifest = manifestFixture({
  pathId: "skills/algorithms",
  arc: "algorithms",
  title: "Algorithms",
  description: "Algorithms path",
  courses: ["just-enough-python", "advanced-algorithms", "just-enough-python"],
});

// Object-form courseOrder entries must be handled identically to bare strings (2.7 REFACTOR).
const objectFormManifest = manifestFixture({
  pathId: "skills/algorithms",
  arc: "algorithms",
  title: "Algorithms",
  description: "Algorithms path",
  courses: [{ id: "just-enough-python" }, { id: "does-not-exist-in-the-library" }],
});

describe("checkManifestIntegrity", () => {
  it("reports no unresolved and no duplicate IDs for a clean manifest", () => {
    const result = checkManifestIntegrity(cleanManifest, libraryCourseIds);

    expect(result.unresolvedIds).toEqual([]);
    expect(result.duplicateIds).toEqual([]);
  });

  it("reports exactly the course ID absent from the library as unresolved", () => {
    const result = checkManifestIntegrity(unresolvedManifest, libraryCourseIds);

    expect(result.unresolvedIds).toEqual(["does-not-exist-in-the-library"]);
    expect(result.duplicateIds).toEqual([]);
  });

  it("reports exactly the repeated course ID as duplicated", () => {
    const result = checkManifestIntegrity(duplicateManifest, libraryCourseIds);

    expect(result.unresolvedIds).toEqual([]);
    expect(result.duplicateIds).toEqual(["just-enough-python"]);
  });

  it("handles object-form courseOrder entries identically to bare strings", () => {
    const result = checkManifestIntegrity(objectFormManifest, libraryCourseIds);

    expect(result.unresolvedIds).toEqual(["does-not-exist-in-the-library"]);
    expect(result.duplicateIds).toEqual([]);
  });

  it("reports a duplicate course ID shared across two phases", () => {
    const crossPhaseDuplicate = manifestFixture({
      pathId: "skills/algorithms",
      arc: "algorithms",
      title: "Algorithms",
      description: "Algorithms path",
      phases: [
        {
          id: "first",
          title: "First",
          kind: "core",
          outcome: { can: "start" },
          courses: ["just-enough-python", "advanced-algorithms"],
        },
        {
          id: "second",
          title: "Second",
          kind: "extension",
          courses: ["advanced-algorithms"],
        },
      ],
    });

    const result = checkManifestIntegrity(crossPhaseDuplicate, libraryCourseIds);

    expect(result.unresolvedIds).toEqual([]);
    expect(result.duplicateIds).toEqual(["advanced-algorithms"]);
  });
});

describe("checkPathModelIntegrity (plan 02 rules R1-R8)", () => {
  const cleanPhases: PathPhase[] = [
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
  ];
  const cleanPrerequisites: PrerequisitesByCourse = {
    "a-foundation": [],
    "b-tooling": ["a-foundation"],
    "c-capstone": ["b-tooling", "outside-course"],
    "outside-course": [],
  };
  const cleanLibrary = ["a-foundation", "b-tooling", "c-capstone", "outside-course"];

  function phasedModel(phases: PathPhase[], extra?: { assumes?: string[]; goals?: string[] }): PathManifest {
    return manifestFixture({
      pathId: "careers/interview-ready/software-engineer",
      arc: "interview-ready",
      title: "Interview-Ready",
      description: "A deterministic path-model fixture.",
      assumes: extra?.assumes ?? ["outside-course"],
      ...(extra?.goals !== undefined ? { goals: extra.goals } : {}),
      phases,
    });
  }

  function twoCorePhases(secondCourses: [string, ...string[]]): PathPhase[] {
    return [
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
        courses: [...secondCourses],
      },
    ];
  }

  function cleanModel(): { manifest: PathManifest; context: PathModelContext } {
    return {
      manifest: phasedModel(twoCorePhases(["c-capstone"])),
      context: {
        prerequisitesByCourse: cleanPrerequisites,
        outlineCourseIds: new Set<string>(),
        libraryCourseIds: cleanLibrary,
      },
    };
  }

  it("R1-R8 pass: a clean manifest reports no violations", () => {
    const { manifest, context } = cleanModel();

    const violations = checkPathModelIntegrity(manifest, context);

    expect(violations.unresolvedIds).toEqual([]);
    expect(violations.duplicateIds).toEqual([]);
    expect(violations.duplicatePhaseIds).toEqual([]);
    expect(violations.emptyPhaseIds).toEqual([]);
    expect(violations.coreAfterExtension).toEqual([]);
    expect(violations.closure).toEqual([]);
    expect(violations.outlineInCore).toEqual([]);
    expect(violations.goalsOutsideCore).toEqual([]);
    expect(violations.coreMismatch).toBeNull();
    expect(violations.unusedAssumes).toEqual([]);
    expect(violations.assumesInsidePath).toEqual([]);
    expect(violations.unresolvedAssumes).toEqual([]);
    expect(violations.skillsExtension).toEqual([]);
    expect(violations.markerNotAllowed).toBe(false);
    expect(isCleanPathModel(violations)).toBe(true);
  });

  it("R1 fails: a course ID absent from the library is reported as unresolved", () => {
    const { context } = cleanModel();
    const withGhost = phasedModel(twoCorePhases(["c-capstone", "ghost-course"]));

    const violations = checkPathModelIntegrity(withGhost, context);

    expect(violations.unresolvedIds).toEqual(["ghost-course"]);
    expect(isCleanPathModel(violations)).toBe(false);
  });

  it("R2 fails: a course ID repeated across two phases is reported as duplicated", () => {
    const { context } = cleanModel();
    const withDuplicate = phasedModel(twoCorePhases(["c-capstone", "b-tooling"]));

    const violations = checkPathModelIntegrity(withDuplicate, context);

    expect(violations.unresolvedIds).toEqual([]);
    expect(violations.duplicateIds).toEqual(["b-tooling"]);
    expect(isCleanPathModel(violations)).toBe(false);
  });

  it("R3 fails: a duplicate phase ID is reported", () => {
    const { context } = cleanModel();
    const [first, second] = twoCorePhases(["c-capstone"]);
    const withDuplicatePhaseId = phasedModel([first as PathPhase, { ...(second as PathPhase), id: "foundations" }]);

    const violations = checkPathModelIntegrity(withDuplicatePhaseId, context);

    expect(violations.duplicatePhaseIds).toEqual(["foundations"]);
    expect(isCleanPathModel(violations)).toBe(false);
  });

  it("R3 fails: an empty phase is reported", () => {
    const { context } = cleanModel();
    // `courses: []` cannot pass the schema, so this synthetic manifest bypasses the
    // fixture: phases are written by hand and courseOrder is derived the way the schema
    // derives it (flatMap over phases), keeping the two coherent.
    const phases: PathPhase[] = [
      ...twoCorePhases(["c-capstone"]),
      { id: "empty", title: "Empty", kind: "core", outcome: { can: "nothing" }, courses: [] },
    ];
    const withEmptyPhase: PathManifest = {
      ...phasedModel(twoCorePhases(["c-capstone"])),
      phases,
      courseOrder: phases.flatMap((phase) => phase.courses),
    };

    const violations = checkPathModelIntegrity(withEmptyPhase, context);

    expect(violations.emptyPhaseIds).toEqual(["empty"]);
    expect(isCleanPathModel(violations)).toBe(false);
  });

  it("R3 fails: a core phase after an extension phase is reported", () => {
    const { context } = cleanModel();
    const extensionFirst: PathManifest = manifestFixture({
      pathId: "careers/interview-ready/software-engineer",
      arc: "interview-ready",
      title: "Interview-Ready",
      description: "A deterministic path-model fixture.",
      phases: [
        { id: "depth", title: "Depth", kind: "extension", courses: ["x-extra"] },
        {
          id: "core-one",
          title: "Core One",
          kind: "core",
          outcome: { can: "start" },
          courses: ["a-foundation", "b-tooling"],
        },
      ],
    });

    const violations = checkPathModelIntegrity(extensionFirst, {
      ...context,
      libraryCourseIds: [...cleanLibrary, "x-extra"],
      prerequisitesByCourse: { ...cleanPrerequisites, "x-extra": [] },
    });

    expect(violations.coreAfterExtension).toEqual(["core-one"]);
    expect(violations.closure).toEqual([]);
    expect(isCleanPathModel(violations)).toBe(false);
  });

  it("R3 passes: extension phases after the last core phase report nothing", () => {
    const { context } = cleanModel();
    const withExtension: PathManifest = manifestFixture({
      pathId: "careers/interview-ready/software-engineer",
      arc: "interview-ready",
      title: "Interview-Ready",
      description: "A deterministic path-model fixture.",
      assumes: ["outside-course"],
      phases: [
        ...(cleanPhases.map((phase) => ({ ...phase, courses: [...phase.courses] })) as PathPhase[]),
        { id: "depth", title: "Depth", kind: "extension", courses: ["x-extra"] },
      ],
    });

    const violations = checkPathModelIntegrity(withExtension, {
      ...context,
      libraryCourseIds: [...cleanLibrary, "x-extra"],
      prerequisitesByCourse: { ...cleanPrerequisites, "x-extra": [] },
    });

    expect(violations.duplicatePhaseIds).toEqual([]);
    expect(violations.emptyPhaseIds).toEqual([]);
    expect(violations.coreAfterExtension).toEqual([]);
    expect(isCleanPathModel(violations)).toBe(true);
  });

  it("R4 fails: a core course whose prerequisite is neither earlier nor assumed is reported", () => {
    const { manifest, context } = cleanModel();
    const withOutsidePrerequisite: PathManifest = {
      ...manifest,
      phases: [cleanPhases[0] as PathPhase, { ...(cleanPhases[1] as PathPhase), courses: ["c-capstone"] }],
    };

    const violations = checkPathModelIntegrity(withOutsidePrerequisite, {
      ...context,
      libraryCourseIds: [...cleanLibrary, "unassumed-outside"],
      prerequisitesByCourse: {
        ...cleanPrerequisites,
        "c-capstone": ["b-tooling", "outside-course", "unassumed-outside"],
        "unassumed-outside": [],
      },
    });

    expect(violations.closure).toEqual([{ courseId: "c-capstone", missingPrerequisite: "unassumed-outside" }]);
    expect(isCleanPathModel(violations)).toBe(false);
  });

  it("R4 fails: a core course placed before its in-path prerequisite is reported", () => {
    const { context } = cleanModel();
    const misordered: PathManifest = manifestFixture({
      pathId: "careers/interview-ready/software-engineer",
      arc: "interview-ready",
      title: "Interview-Ready",
      description: "A deterministic path-model fixture.",
      assumes: ["outside-course"],
      phases: [
        {
          id: "arrival",
          title: "Arrival",
          kind: "core",
          outcome: { can: "finish" },
          courses: ["c-capstone", "b-tooling", "a-foundation"],
        },
      ],
    });

    const violations = checkPathModelIntegrity(misordered, context);

    expect(violations.closure).toContainEqual({ courseId: "b-tooling", missingPrerequisite: "a-foundation" });
    expect(isCleanPathModel(violations)).toBe(false);
  });

  it("R5 fails: an outline course in a core phase is reported", () => {
    const { manifest, context } = cleanModel();

    const violations = checkPathModelIntegrity(manifest, {
      ...context,
      outlineCourseIds: new Set(["b-tooling"]),
    });

    expect(violations.outlineInCore).toEqual(["b-tooling"]);
    expect(isCleanPathModel(violations)).toBe(false);
  });

  it("R5 passes: an outline course in an extension phase is not reported", () => {
    const { context } = cleanModel();
    const outlineInExtension: PathManifest = manifestFixture({
      pathId: "careers/interview-ready/software-engineer",
      arc: "interview-ready",
      title: "Interview-Ready",
      description: "A deterministic path-model fixture.",
      assumes: ["outside-course"],
      phases: [
        ...(cleanPhases.map((phase) => ({ ...phase, courses: [...phase.courses] })) as PathPhase[]),
        { id: "depth", title: "Depth", kind: "extension", courses: ["x-outline"] },
      ],
    });

    const violations = checkPathModelIntegrity(outlineInExtension, {
      ...context,
      libraryCourseIds: [...cleanLibrary, "x-outline"],
      prerequisitesByCourse: { ...cleanPrerequisites, "x-outline": [] },
      outlineCourseIds: new Set(["x-outline"]),
    });

    expect(violations.outlineInCore).toEqual([]);
    expect(isCleanPathModel(violations)).toBe(true);
  });

  it("R6 fails: a goal outside every core phase is reported, with the core mismatch by ID", () => {
    const { manifest, context } = cleanModel();
    const goalOutsideCore: PathManifest = {
      ...manifest,
      goals: ["c-capstone", "later-goal"],
    };

    const violations = checkPathModelIntegrity(goalOutsideCore, {
      ...context,
      libraryCourseIds: [...cleanLibrary, "later-goal"],
      prerequisitesByCourse: { ...cleanPrerequisites, "later-goal": [] },
    });

    expect(violations.goalsOutsideCore).toEqual(["later-goal"]);
    expect(violations.coreMismatch).toEqual({ missing: ["later-goal"], extra: [] });
    expect(isCleanPathModel(violations)).toBe(false);
  });

  it("R6 fails: an extra core course beyond the goal closure is reported", () => {
    const { manifest, context } = cleanModel();
    const narrowGoal: PathManifest = { ...manifest, goals: ["b-tooling"] };

    const violations = checkPathModelIntegrity(narrowGoal, context);

    expect(violations.goalsOutsideCore).toEqual([]);
    expect(violations.coreMismatch).toEqual({ missing: [], extra: ["c-capstone"] });
    expect(isCleanPathModel(violations)).toBe(false);
  });

  it("R6 passes: the core equal to the goal closure reports a null mismatch", () => {
    const { manifest, context } = cleanModel();
    const withGoal: PathManifest = { ...manifest, goals: ["c-capstone"] };

    const violations = checkPathModelIntegrity(withGoal, context);

    expect(violations.goalsOutsideCore).toEqual([]);
    expect(violations.coreMismatch).toBeNull();
    expect(isCleanPathModel(violations)).toBe(true);
  });

  it("R7 fails: an assumed course that no core course needs is reported as unused", () => {
    const { manifest, context } = cleanModel();
    const withUnneededAssumes: PathManifest = { ...manifest, assumes: ["outside-course", "unneeded-course"] };

    const violations = checkPathModelIntegrity(withUnneededAssumes, {
      ...context,
      libraryCourseIds: [...cleanLibrary, "unneeded-course"],
      prerequisitesByCourse: { ...cleanPrerequisites, "unneeded-course": [] },
    });

    expect(violations.unusedAssumes).toEqual(["unneeded-course"]);
    expect(violations.unresolvedAssumes).toEqual([]);
    expect(violations.assumesInsidePath).toEqual([]);
    expect(isCleanPathModel(violations)).toBe(false);
  });

  it("R7 fails: an assumed course that sits inside the path is reported", () => {
    const { manifest, context } = cleanModel();
    const withInsideAssumes: PathManifest = { ...manifest, assumes: ["outside-course", "a-foundation"] };

    const violations = checkPathModelIntegrity(withInsideAssumes, context);

    expect(violations.assumesInsidePath).toEqual(["a-foundation"]);
    expect(violations.unusedAssumes).toEqual([]);
    expect(isCleanPathModel(violations)).toBe(false);
  });

  it("R7 fails: an assumed course absent from the library is reported as unresolved", () => {
    const { manifest, context } = cleanModel();
    const withGhostAssumes: PathManifest = { ...manifest, assumes: ["outside-course", "ghost-assumed"] };

    const violations = checkPathModelIntegrity(withGhostAssumes, context);

    expect(violations.unresolvedAssumes).toEqual(["ghost-assumed"]);
    expect(isCleanPathModel(violations)).toBe(false);
  });

  it("R8 fails: an extension phase in a skills path is reported", () => {
    const { context } = cleanModel();
    const skillsWithExtension: PathManifest = manifestFixture({
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

    const violations = checkPathModelIntegrity(skillsWithExtension, {
      ...context,
      libraryCourseIds: [...cleanLibrary, "x-extra"],
      prerequisitesByCourse: { "a-foundation": [], "x-extra": [], "outside-course": [] },
    });

    expect(violations.skillsExtension).toEqual(["depth"]);
    expect(isCleanPathModel(violations)).toBe(false);
  });

  it("R8 passes: a core-only skills path reports no skills-extension violation", () => {
    const { context } = cleanModel();
    const coreOnlySkills: PathManifest = manifestFixture({
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
      ],
    });

    const violations = checkPathModelIntegrity(coreOnlySkills, {
      ...context,
      prerequisitesByCourse: { "a-foundation": [], "outside-course": [] },
    });

    expect(violations.skillsExtension).toEqual([]);
    expect(isCleanPathModel(violations)).toBe(true);
  });

  it("R9 exemption: a marked manifest skips the core rules but still reports unresolved and duplicate IDs", () => {
    const { context } = cleanModel();
    const marked = manifestFixture({
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

    const violations = checkPathModelIntegrity(marked, {
      ...context,
      prerequisitesByCourse: {
        ...cleanPrerequisites,
        "a-foundation": ["outside-course"],
        "ghost-course": [],
      },
      outlineCourseIds: new Set(["b-tooling"]),
    });

    // a-foundation's outside prerequisite would close over R4, b-tooling's outline over R5 —
    // both skipped for a marked manifest, along with R6, R7, and R8.
    expect(violations.closure).toEqual([]);
    expect(violations.outlineInCore).toEqual([]);
    expect(violations.goalsOutsideCore).toEqual([]);
    expect(violations.coreMismatch).toBeNull();
    expect(violations.unusedAssumes).toEqual([]);
    expect(violations.assumesInsidePath).toEqual([]);
    expect(violations.unresolvedAssumes).toEqual([]);
    expect(violations.skillsExtension).toEqual([]);
    expect(violations.markerNotAllowed).toBe(false);
    // R1 and R2 still run.
    expect(violations.unresolvedIds).toEqual(["ghost-course"]);
    expect(violations.duplicateIds).toEqual(["b-tooling"]);
    expect(isCleanPathModel(violations)).toBe(false);
  });

  it("R9: a synthetic career manifest carrying the marker sets markerNotAllowed", () => {
    const { manifest, context } = cleanModel();
    const careerWithMarker: PathManifest = { ...manifest, restructurePendingIn: "plan-06" };

    const violations = checkPathModelIntegrity(careerWithMarker, context);

    expect(violations.markerNotAllowed).toBe(true);
    expect(isCleanPathModel(violations)).toBe(false);
  });
});
