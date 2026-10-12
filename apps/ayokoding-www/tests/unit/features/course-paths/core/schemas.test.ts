import { describe, expect, it } from "vitest";
import { PathManifestSchema } from "../../../../../src/features/course-paths/core/schemas";

// A minimal, otherwise-valid 3-segment careers manifest used as the base fixture for the
// negative-path assertions below (each test overrides or removes exactly one field).
const careersManifest = {
  pathId: "careers/interview-ready/software-engineer",
  arc: "interview-ready",
  title: "Interview-Ready Software Engineer",
  description: "Interview-first track for an experienced engineer re-entering the market.",
  courseOrder: ["just-enough-python", "capstone-forge-ready"],
};

describe("PathManifestSchema", () => {
  it("(a) accepts a manifest whose phase courses mix bare course-ID strings with framing objects", () => {
    const { courseOrder: _legacy, ...phaseBase } = careersManifest;
    const manifest = {
      ...phaseBase,
      phases: [
        {
          id: "foundations",
          title: "Foundations",
          kind: "core",
          outcome: { can: "start" },
          courses: [
            "just-enough-python",
            {
              id: "capstone-forge-ready",
              framing: {
                intro: "Before you start the capstone, revisit your interview notes.",
                outro: "You are ready to walk into the interview loop.",
              },
            },
          ],
        },
      ],
    };

    const result = PathManifestSchema.safeParse(manifest);

    expect(result.success).toBe(true);
  });

  it("(b) accepts a 3-segment careers fixture, a 2-segment skills fixture, and a 4-segment forward-compatibility fixture — no fixed segment count", () => {
    const phaseFileFor = (pathId: string) => ({
      pathId,
      arc: "interview-ready",
      title: "Forward-compatibility fixture",
      description: "Proves the schema never bounds pathId depth above.",
      phases: [
        {
          id: "foundations",
          title: "Foundations",
          kind: "core",
          outcome: { can: "start" },
          courses: ["just-enough-python"],
        },
      ],
    });
    const threeSegmentCareers = phaseFileFor("careers/interview-ready/software-engineer");
    const twoSegmentSkills = phaseFileFor("skills/conventional-accounting");
    const fourSegmentForwardCompat = phaseFileFor("careers/a/b/c");

    expect(PathManifestSchema.safeParse(threeSegmentCareers).success).toBe(true);
    expect(PathManifestSchema.safeParse(twoSegmentSkills).success).toBe(true);
    expect(PathManifestSchema.safeParse(fourSegmentForwardCompat).success).toBe(true);
  });

  it("(c) rejects a manifest whose pathId's first segment is neither careers nor skills", () => {
    const manifest = { ...careersManifest, pathId: "bogus/foo" };

    const result = PathManifestSchema.safeParse(manifest);

    expect(result.success).toBe(false);
  });

  it("(d) rejects a bare single-segment pathId, with or without a trailing slash", () => {
    const bareCategory = { ...careersManifest, pathId: "careers" };
    const bareCategoryTrailingSlash = { ...careersManifest, pathId: "careers/" };

    expect(PathManifestSchema.safeParse(bareCategory).success).toBe(false);
    expect(PathManifestSchema.safeParse(bareCategoryTrailingSlash).success).toBe(false);
  });

  it("(e) rejects a manifest missing arc, even on an otherwise-valid 2-segment skills fixture", () => {
    const { arc: _arc, ...manifestWithoutArc } = {
      pathId: "skills/conventional-accounting",
      arc: "immediately-effective",
      title: "Conventional Accounting",
      description: "A from-scratch skills track in conventional accounting fundamentals.",
      courseOrder: ["just-enough-python"],
    };

    const result = PathManifestSchema.safeParse(manifestWithoutArc);

    expect(result.success).toBe(false);
  });

  it("(f) rejects a manifest missing courseOrder", () => {
    const { courseOrder: _courseOrder, ...manifestWithoutCourseOrder } = careersManifest;

    const result = PathManifestSchema.safeParse(manifestWithoutCourseOrder);

    expect(result.success).toBe(false);
  });

  it("(g) rejects a pathId carrying a '..' path-traversal segment even though it otherwise satisfies the category-prefix and minimum-arity checks", () => {
    const manifest = { ...careersManifest, pathId: "careers/../../../etc/passwd" };

    const result = PathManifestSchema.safeParse(manifest);

    expect(result.success).toBe(false);
  });

  it("(h) rejects a pathId carrying a bare '.' segment", () => {
    const manifest = { ...careersManifest, pathId: "careers/./software-engineer" };

    const result = PathManifestSchema.safeParse(manifest);

    expect(result.success).toBe(false);
  });

  it("(i) rejects a pathId containing a backslash", () => {
    const manifest = { ...careersManifest, pathId: "careers\\interview-ready\\software-engineer" };

    const result = PathManifestSchema.safeParse(manifest);

    expect(result.success).toBe(false);
  });

  it("(j) rejects a pathId containing a null byte", () => {
    const manifest = { ...careersManifest, pathId: "careers/interview-ready\0" };

    const result = PathManifestSchema.safeParse(manifest);

    expect(result.success).toBe(false);
  });

  // RED (PR review finding #1, pr-review-synthesis-maker review 4770318960, cycle 2): the
  // pre-fix schema forbade only `\`, `\0`, `.`, and `..` — a pathId containing `&`, `=`, `#`, `%`,
  // or whitespace passed `safeParse` even though `contentUrl` interpolates it unencoded into a
  // `?path=` query string, corrupting or truncating it on the `URLSearchParams` round-trip in
  // `parsePathContext`.
  it("(k) rejects a pathId containing query-string-hazard characters ('&', '=', '#', '%', whitespace)", () => {
    const ampersand = { ...careersManifest, pathId: "careers/soft&ware=engineer" };
    const hash = { ...careersManifest, pathId: "careers/soft#ware" };
    const percent = { ...careersManifest, pathId: "careers/soft%20ware" };
    const whitespace = { ...careersManifest, pathId: "careers/soft ware" };

    expect(PathManifestSchema.safeParse(ampersand).success).toBe(false);
    expect(PathManifestSchema.safeParse(hash).success).toBe(false);
    expect(PathManifestSchema.safeParse(percent).success).toBe(false);
    expect(PathManifestSchema.safeParse(whitespace).success).toBe(false);
  });

  // RED (PR review finding #2, pr-review-synthesis-maker review 4770318960, cycle 2): the pre-fix
  // arity floor counted segments AFTER `.split("/").filter(Boolean)` dropped empty tokens, so a
  // trailing slash or a doubled slash on an otherwise-valid, multi-segment pathId validated
  // identically to its clean form — two "equal" paths that differ by string.
  it("(l) rejects an otherwise-valid pathId carrying a trailing slash or a doubled internal slash", () => {
    const trailingSlash = { ...careersManifest, pathId: "careers/interview-ready/software-engineer/" };
    const doubledSlash = { ...careersManifest, pathId: "careers//interview-ready" };

    expect(PathManifestSchema.safeParse(trailingSlash).success).toBe(false);
    expect(PathManifestSchema.safeParse(doubledSlash).success).toBe(false);
  });
});

describe("PathManifestSchema phase shape (plan 02 expand)", () => {
  const phaseShapedFile = {
    pathId: "careers/interview-ready/software-engineer",
    arc: "interview-ready",
    title: "Interview-Ready Software Engineer",
    description: "Interview-first track for an experienced engineer re-entering the market.",
    goals: ["capstone-interview-loop"],
    assumes: ["sql-essentials"],
    phases: [
      {
        id: "foundations",
        title: "Foundations",
        kind: "core",
        outcome: { can: "write small programs" },
        courses: ["just-enough-python"],
      },
      {
        id: "interview-skills",
        title: "Interview Skills",
        kind: "core",
        outcome: { can: "pass the interview loop", cannotYet: "lead a team" },
        courses: ["coding-interview", "capstone-interview-loop"],
      },
      {
        id: "depth",
        title: "Depth",
        kind: "extension",
        courses: ["advanced-algorithms"],
      },
    ],
  };

  it("(m) parses a phase-shaped file and derives courseOrder from its phases in order", () => {
    const result = PathManifestSchema.safeParse(phaseShapedFile);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phases.map((phase) => phase.id)).toEqual(["foundations", "interview-skills", "depth"]);
      expect(result.data.courseOrder).toEqual([
        "just-enough-python",
        "coding-interview",
        "capstone-interview-loop",
        "advanced-algorithms",
      ]);
    }
  });

  it("(n) rejects a core phase without an outcome", () => {
    const file = {
      ...phaseShapedFile,
      phases: [{ id: "foundations", title: "Foundations", kind: "core", courses: ["just-enough-python"] }],
    };

    const result = PathManifestSchema.safeParse(file);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "phases")).toBe(true);
    }
  });

  it("(o) rejects an empty phase", () => {
    const file = {
      ...phaseShapedFile,
      phases: [
        {
          id: "foundations",
          title: "Foundations",
          kind: "core",
          outcome: { can: "write small programs" },
          courses: [],
        },
      ],
    };

    const result = PathManifestSchema.safeParse(file);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "phases")).toBe(true);
    }
  });

  it("(p) rejects a bad phase ID", () => {
    const file = {
      ...phaseShapedFile,
      phases: [
        {
          id: "Phase 1",
          title: "Foundations",
          kind: "core",
          outcome: { can: "write small programs" },
          courses: ["just-enough-python"],
        },
      ],
    };

    const result = PathManifestSchema.safeParse(file);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "phases")).toBe(true);
    }
  });

  it("(q) rejects a file containing courseOrder", () => {
    const result = PathManifestSchema.safeParse(careersManifest);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.code === "unrecognized_keys")).toBe(true);
    }
  });

  it("(q2) rejects a file with an unknown top-level key", () => {
    const result = PathManifestSchema.safeParse({ ...phaseShapedFile, extraKey: "nope" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.code === "unrecognized_keys")).toBe(true);
    }
  });
});

describe("PathManifestSchema skills restructure marker (plan 02, decision 39)", () => {
  const markedSkillsFile = {
    pathId: "skills/conventional-accounting",
    arc: "immediately-effective",
    title: "Conventional Accounting",
    description: "A practical accounting path from a balancing ledger to controlled reporting.",
    restructurePendingIn: "plan-06",
    assumes: [],
    phases: [
      {
        id: "all-courses",
        title: "Conventional Accounting",
        kind: "core",
        courses: ["accounting-foundations", "chart-of-accounts-and-data-modeling"],
      },
    ],
  };

  it("(r) parses a marked allowlisted skills file", () => {
    const result = PathManifestSchema.safeParse(markedSkillsFile);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.restructurePendingIn).toBe("plan-06");
      expect(result.data.courseOrder).toEqual(["accounting-foundations", "chart-of-accounts-and-data-modeling"]);
    }
  });

  it("(s) rejects the same marker on a career path", () => {
    const result = PathManifestSchema.safeParse({
      ...markedSkillsFile,
      pathId: "careers/interview-ready/software-engineer",
    });

    expect(result.success).toBe(false);
  });

  it("(t) rejects the marker on an unlisted skills path", () => {
    const result = PathManifestSchema.safeParse({ ...markedSkillsFile, pathId: "skills/e2e-fixture-alpha" });

    expect(result.success).toBe(false);
  });

  it("(u) rejects an accounting path carrying the ERP plan value", () => {
    const result = PathManifestSchema.safeParse({ ...markedSkillsFile, restructurePendingIn: "plan-07" });

    expect(result.success).toBe(false);
  });

  it("(v) rejects a marked file with two phases", () => {
    const result = PathManifestSchema.safeParse({
      ...markedSkillsFile,
      phases: [...markedSkillsFile.phases, { id: "more", title: "More", kind: "core", courses: ["x-extra"] }],
    });

    expect(result.success).toBe(false);
  });

  it("(w) parses a marked file whose core phase has no outcome", () => {
    const result = PathManifestSchema.safeParse(markedSkillsFile);

    expect(result.success).toBe(true);
  });
});
