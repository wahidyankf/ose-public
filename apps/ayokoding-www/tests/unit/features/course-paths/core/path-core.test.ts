import { describe, expect, it } from "vitest";
import { computeCore } from "../../../../../src/features/course-paths/core/path-core";
import type { PrerequisitesByCourse } from "../../../../../src/features/course-paths/core/prerequisites";

describe("computeCore", () => {
  it("returns a single goal plus its transitive prerequisites", () => {
    const prerequisites: PrerequisitesByCourse = {
      "capstone-full-stack-app": ["frontend-essentials", "backend-essentials"],
      "frontend-essentials": ["just-enough-python"],
      "backend-essentials": ["just-enough-python"],
      "just-enough-python": [],
    };

    expect(computeCore(["capstone-full-stack-app"], prerequisites)).toEqual(
      new Set(["capstone-full-stack-app", "frontend-essentials", "backend-essentials", "just-enough-python"]),
    );
  });

  it("returns the union of two goals' closures", () => {
    const prerequisites: PrerequisitesByCourse = {
      "capstone-full-stack-app": ["frontend-essentials"],
      "capstone-forge-ready": ["extending-neovim"],
      "frontend-essentials": [],
      "extending-neovim": [],
    };

    expect(computeCore(["capstone-full-stack-app", "capstone-forge-ready"], prerequisites)).toEqual(
      new Set(["capstone-full-stack-app", "frontend-essentials", "capstone-forge-ready", "extending-neovim"]),
    );
  });

  it("stops the closure at an assumes course: the assumed course and its own prerequisites stay out", () => {
    const prerequisites: PrerequisitesByCourse = {
      "capstone-ai": ["backend-at-scale", "creating-ai-powered-apps"],
      "creating-ai-powered-apps": ["just-enough-python"],
      "backend-at-scale": ["sql-essentials"],
      "just-enough-python": [],
      "sql-essentials": [],
    };

    expect(computeCore(["capstone-ai"], prerequisites, ["backend-at-scale"])).toEqual(
      new Set(["capstone-ai", "creating-ai-powered-apps", "just-enough-python"]),
    );
  });

  it("counts a diamond dependency once", () => {
    const prerequisites: PrerequisitesByCourse = {
      goal: ["left", "right"],
      left: ["base"],
      right: ["base"],
      base: [],
    };

    const core = computeCore(["goal"], prerequisites);

    expect(core).toEqual(new Set(["goal", "left", "right", "base"]));
    expect(core.size).toBe(4);
  });

  it("ignores unknown prerequisite IDs", () => {
    const prerequisites: PrerequisitesByCourse = {
      goal: ["renamed-or-deleted-course"],
    };

    expect(computeCore(["goal"], prerequisites)).toEqual(new Set(["goal"]));
  });
});
