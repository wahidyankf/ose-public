import { describe, expect, it } from "vitest";
import { resolvePathNav } from "../../../../../src/features/course-paths/core/path-nav";
import type { PathManifest } from "../../../../../src/features/course-paths/core/schemas";
import { manifestFixture } from "../manifest-fixture";

const manifest: PathManifest = manifestFixture({
  pathId: "careers/interview-ready/software-engineer",
  arc: "interview-ready",
  title: "Interview-Ready Software Engineer",
  description: "Interview-first track for an experienced engineer re-entering the market.",
  courses: ["just-enough-python", "data-structures-and-algorithms-essentials", "capstone-forge-ready"],
});

describe("resolvePathNav", () => {
  it("returns both neighbours for a middle course", () => {
    const result = resolvePathNav(manifest, "data-structures-and-algorithms-essentials");

    expect(result).toEqual({
      prev: { id: "just-enough-python" },
      next: { id: "capstone-forge-ready" },
    });
  });

  it("returns prev: null for the first course", () => {
    const result = resolvePathNav(manifest, "just-enough-python");

    expect(result).toEqual({
      prev: null,
      next: { id: "data-structures-and-algorithms-essentials" },
    });
  });

  it("returns next: null for the last course", () => {
    const result = resolvePathNav(manifest, "capstone-forge-ready");

    expect(result).toEqual({
      prev: { id: "data-structures-and-algorithms-essentials" },
      next: null,
    });
  });

  it("returns { prev: null, next: null } for a course absent from courseOrder", () => {
    const result = resolvePathNav(manifest, "not-in-this-path");

    expect(result).toEqual({ prev: null, next: null });
  });

  it("returns the first extension course as next from the last core course (pins existing behaviour across a phase boundary)", () => {
    const phased: PathManifest = manifestFixture({
      pathId: "careers/interview-ready/software-engineer",
      arc: "interview-ready",
      title: "Interview-Ready Software Engineer",
      description: "Interview-first track for an experienced engineer re-entering the market.",
      phases: [
        {
          id: "core-one",
          title: "Core One",
          kind: "core",
          outcome: { can: "start" },
          courses: ["just-enough-python", "coding-interview"],
        },
        { id: "depth", title: "Depth", kind: "extension", courses: ["advanced-algorithms"] },
      ],
    });

    const result = resolvePathNav(phased, "coding-interview");

    expect(result).toEqual({ prev: { id: "just-enough-python" }, next: { id: "advanced-algorithms" } });
  });
});
