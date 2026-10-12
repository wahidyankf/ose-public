import { describe, expect, it } from "vitest";
import { corePhases, extensionPhases, phaseOfCourse } from "../../../../../src/features/course-paths/core/path-phases";
import { manifestFixture } from "../manifest-fixture";

const twoCoreOneExtension = manifestFixture({
  pathId: "careers/interview-ready/software-engineer",
  arc: "interview-ready",
  title: "Interview-Ready Software Engineer",
  description: "Interview-first track for an experienced engineer re-entering the market.",
  phases: [
    {
      id: "foundations",
      title: "Foundations",
      kind: "core",
      outcome: { can: "write small programs" },
      courses: ["just-enough-python", "just-enough-bash"],
    },
    {
      id: "interview-skills",
      title: "Interview Skills",
      kind: "core",
      outcome: { can: "pass the interview loop" },
      courses: ["coding-interview"],
    },
    {
      id: "depth",
      title: "Depth",
      kind: "extension",
      courses: ["advanced-algorithms", "distributed-systems"],
    },
  ],
});

describe("corePhases / extensionPhases", () => {
  it("returns only the core phases, in manifest order", () => {
    expect(corePhases(twoCoreOneExtension).map((phase) => phase.id)).toEqual(["foundations", "interview-skills"]);
  });

  it("returns only the extension phases, in manifest order", () => {
    expect(extensionPhases(twoCoreOneExtension).map((phase) => phase.id)).toEqual(["depth"]);
  });

  it("returns empty arrays when the manifest has no phase of that kind", () => {
    const coreOnly = manifestFixture({
      courses: ["just-enough-python"],
    });

    expect(corePhases(coreOnly).map((phase) => phase.id)).toEqual(["phase-a"]);
    expect(extensionPhases(coreOnly)).toEqual([]);
  });
});

describe("phaseOfCourse", () => {
  it("returns the first extension phase and its path position for the first course of the first extension phase", () => {
    const result = phaseOfCourse(twoCoreOneExtension, "advanced-algorithms");

    expect(result?.phase.id).toBe("depth");
    expect(result?.phaseIndex).toBe(2);
    // Three core courses precede it, so its 1-based position within the path is core count + 1.
    expect(result?.position).toBe(4);
  });

  it("returns position 1 for the first course of the first phase", () => {
    const result = phaseOfCourse(twoCoreOneExtension, "just-enough-python");

    expect(result?.phase.id).toBe("foundations");
    expect(result?.phaseIndex).toBe(0);
    expect(result?.position).toBe(1);
  });

  it("returns the later position for a second course within the same phase", () => {
    const result = phaseOfCourse(twoCoreOneExtension, "just-enough-bash");

    expect(result?.phase.id).toBe("foundations");
    expect(result?.phaseIndex).toBe(0);
    expect(result?.position).toBe(2);
  });

  it("returns null for a course ID in no phase", () => {
    expect(phaseOfCourse(twoCoreOneExtension, "does-not-exist")).toBeNull();
  });
});
