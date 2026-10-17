import { describe, expect, it } from "vitest";
import type { ProgressState } from "@/features/learning-progress/core/progress-schema";
import { emptyProgress } from "@/features/learning-progress/core/progress-state";
import { courseNextTarget, resolvePathNextStep } from "@/features/learning-progress/core/next-step";
import { manifestFixture } from "../course-paths/manifest-fixture";

function stateWith(completed: Record<string, string[]>, lastPath: ProgressState["lastPath"] = null): ProgressState {
  return { ...emptyProgress(), completed, lastPath };
}

const manifest = manifestFixture({
  pathId: "careers/immediately-effective/software-engineer",
  phases: [
    {
      id: "foundations",
      title: "Foundations",
      kind: "core",
      outcome: { can: "start the path" },
      courses: ["just-enough-python", "just-enough-bash"],
    },
    { id: "depth", title: "Depth", kind: "extension", courses: ["advanced-algorithms"] },
  ],
});

const sequences: Record<string, readonly string[]> = {
  "just-enough-python": ["learning/beginner", "learning/advanced"],
  "just-enough-bash": ["learning/overview", "learning/beginner", "learning/advanced"],
  "advanced-algorithms": ["learning/beginner"],
};

const bashPathId = { pathId: manifest.pathId, courseId: "just-enough-bash" };

describe("courseNextTarget", () => {
  it("returns null when the course is done", () => {
    expect(
      courseNextTarget(
        stateWith({ "just-enough-python": ["learning/beginner", "learning/advanced"] }),
        "just-enough-python",
        sequences["just-enough-python"]!,
      ),
    ).toBeNull();
  });

  it("returns the course landing page when the course has no completed page", () => {
    expect(courseNextTarget(emptyProgress(), "just-enough-bash", sequences["just-enough-bash"]!)).toEqual({
      courseId: "just-enough-bash",
      pagePath: null,
    });
  });

  it("returns the landing page when every completed page is stale", () => {
    expect(
      courseNextTarget(
        stateWith({ "just-enough-python": ["learning/removed"] }),
        "just-enough-python",
        sequences["just-enough-python"]!,
      ),
    ).toEqual({ courseId: "just-enough-python", pagePath: null });
  });

  it("returns the first uncompleted sequence page once a page is done", () => {
    expect(
      courseNextTarget(
        stateWith({ "just-enough-bash": ["learning/overview", "learning/advanced"] }),
        "just-enough-bash",
        sequences["just-enough-bash"]!,
      ),
    ).toEqual({ courseId: "just-enough-bash", pagePath: "learning/beginner" });
  });

  it("returns the landing page for a course with an empty sequence", () => {
    expect(
      courseNextTarget(stateWith({ "just-enough-python": ["learning/beginner"] }), "just-enough-python", []),
    ).toEqual({ courseId: "just-enough-python", pagePath: null });
  });
});

describe("resolvePathNextStep", () => {
  it("starts a fresh path at its first core course's landing page", () => {
    expect(resolvePathNextStep(manifest, emptyProgress(), sequences)).toEqual({
      kind: "start",
      target: { courseId: "just-enough-python", pagePath: null },
    });
  });

  it("continues the last path's remembered course when it is unfinished", () => {
    expect(
      resolvePathNextStep(manifest, stateWith({ "just-enough-bash": ["learning/overview"] }, bashPathId), sequences),
    ).toEqual({ kind: "continue", target: { courseId: "just-enough-bash", pagePath: "learning/beginner" } });
  });

  it("moves on to the first unfinished core course when the remembered course is done", () => {
    expect(
      resolvePathNextStep(
        manifest,
        stateWith(
          {
            "just-enough-bash": ["learning/overview", "learning/beginner", "learning/advanced"],
          },
          bashPathId,
        ),
        sequences,
      ),
    ).toEqual({ kind: "continue", target: { courseId: "just-enough-python", pagePath: null } });
  });

  it("ignores a remembered path that belongs to another path", () => {
    expect(
      resolvePathNextStep(
        manifest,
        stateWith(
          { "just-enough-bash": ["learning/overview"] },
          { pathId: "skills/conventional-accounting", courseId: "just-enough-bash" },
        ),
        sequences,
      ),
    ).toEqual({ kind: "continue", target: { courseId: "just-enough-python", pagePath: null } });
  });

  it("ignores a remembered course that is not in this path", () => {
    expect(
      resolvePathNextStep(
        manifest,
        stateWith({}, { pathId: manifest.pathId, courseId: "capstone-secure-service" }),
        sequences,
      ),
    ).toEqual({ kind: "start", target: { courseId: "just-enough-python", pagePath: null } });
  });

  it("continues at the first core course when only an extension course has progress", () => {
    expect(
      resolvePathNextStep(manifest, stateWith({ "advanced-algorithms": ["learning/beginner"] }), sequences),
    ).toEqual({ kind: "continue", target: { courseId: "just-enough-python", pagePath: null } });
  });

  it("reports core-complete when every core course is done, even with extensions untouched", () => {
    expect(
      resolvePathNextStep(
        manifest,
        stateWith({
          "just-enough-python": ["learning/beginner", "learning/advanced"],
          "just-enough-bash": ["learning/overview", "learning/beginner", "learning/advanced"],
        }),
        sequences,
      ),
    ).toEqual({ kind: "core-complete" });
  });

  it("starts with a course whose sequence is missing from the index", () => {
    expect(resolvePathNextStep(manifest, emptyProgress(), {})).toEqual({
      kind: "start",
      target: { courseId: "just-enough-python", pagePath: null },
    });
  });
});
