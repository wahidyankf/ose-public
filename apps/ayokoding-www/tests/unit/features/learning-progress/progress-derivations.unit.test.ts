import { describe, expect, it } from "vitest";
import type { ProgressState } from "@/features/learning-progress/core/progress-schema";
import { emptyProgress } from "@/features/learning-progress/core/progress-state";
import { courseProgress, pathProgress, phaseProgress } from "@/features/learning-progress/core/progress-derivations";
import { manifestFixture } from "../course-paths/manifest-fixture";

function stateWith(completed: Record<string, string[]>): ProgressState {
  return { ...emptyProgress(), completed };
}

const twoPages = ["learning/beginner", "learning/advanced"];

describe("courseProgress", () => {
  it("counts only the completed pages that are still in the sequence", () => {
    expect(
      courseProgress(
        stateWith({ "extending-neovim": ["learning/beginner", "learning/removed"] }),
        "extending-neovim",
        twoPages,
      ),
    ).toEqual({ done: 1, total: 2, status: "in-progress" });
  });

  it("ignores another course's completed pages", () => {
    expect(courseProgress(stateWith({ "just-enough-lua": twoPages }), "extending-neovim", twoPages)).toEqual({
      done: 0,
      total: 2,
      status: "not-started",
    });
  });

  it("reports not-started, in-progress, and done", () => {
    expect(courseProgress(emptyProgress(), "extending-neovim", twoPages).status).toBe("not-started");
    expect(
      courseProgress(stateWith({ "extending-neovim": ["learning/beginner"] }), "extending-neovim", twoPages).status,
    ).toBe("in-progress");
    expect(courseProgress(stateWith({ "extending-neovim": twoPages }), "extending-neovim", twoPages).status).toBe(
      "done",
    );
  });

  it("never reports a course with an empty sequence as done", () => {
    expect(courseProgress(stateWith({ "extending-neovim": twoPages }), "extending-neovim", [])).toEqual({
      done: 0,
      total: 0,
      status: "not-started",
    });
  });
});

describe("phaseProgress", () => {
  const manifest = manifestFixture({
    courses: ["just-enough-python", "just-enough-bash", "coding-interview"],
  });

  it("counts courses, not pages", () => {
    const sequences = {
      "just-enough-python": ["learning/beginner", "learning/advanced"],
      "just-enough-bash": ["learning/beginner"],
      "coding-interview": ["learning/beginner"],
    };
    const state = stateWith({
      "just-enough-python": ["learning/beginner", "learning/advanced"],
      "just-enough-bash": ["learning/beginner"],
    });

    expect(phaseProgress(manifest.phases[0]!, state, sequences)).toEqual({ done: 2, total: 3 });
  });

  it("treats a course missing from the sequence index as empty", () => {
    expect(phaseProgress(manifest.phases[0]!, stateWith({ "just-enough-python": ["learning/beginner"] }), {})).toEqual({
      done: 0,
      total: 3,
    });
  });

  it("counts an extension phase's own courses", () => {
    const withExtension = manifestFixture({
      phases: [
        {
          id: "foundations",
          title: "Foundations",
          kind: "core",
          outcome: { can: "start" },
          courses: ["just-enough-python"],
        },
        { id: "depth", title: "Depth", kind: "extension", courses: ["advanced-algorithms", "distributed-systems"] },
      ],
    });
    const sequences = {
      "advanced-algorithms": ["learning/beginner"],
      "distributed-systems": ["learning/beginner"],
    };

    expect(
      phaseProgress(withExtension.phases[1]!, stateWith({ "advanced-algorithms": ["learning/beginner"] }), sequences),
    ).toEqual({ done: 1, total: 2 });
  });
});

describe("pathProgress", () => {
  const manifest = manifestFixture({
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
  const sequences = {
    "just-enough-python": ["learning/beginner"],
    "just-enough-bash": ["learning/beginner"],
    "advanced-algorithms": ["learning/beginner"],
  };

  it("counts core courses only, ignoring extension progress", () => {
    expect(pathProgress(manifest, stateWith({ "advanced-algorithms": ["learning/beginner"] }), sequences)).toEqual({
      coreDone: 0,
      coreTotal: 2,
      complete: false,
    });
  });

  it("is complete when every core course is done, even with extensions untouched", () => {
    expect(
      pathProgress(
        manifest,
        stateWith({ "just-enough-python": ["learning/beginner"], "just-enough-bash": ["learning/beginner"] }),
        sequences,
      ),
    ).toEqual({ coreDone: 2, coreTotal: 2, complete: true });
  });

  it("is not complete when a core course is only half done", () => {
    const withTwoPages = { ...sequences, "just-enough-bash": ["learning/beginner", "learning/advanced"] };

    expect(
      pathProgress(
        manifest,
        stateWith({ "just-enough-python": ["learning/beginner"], "just-enough-bash": ["learning/beginner"] }),
        withTwoPages,
      ),
    ).toEqual({ coreDone: 1, coreTotal: 2, complete: false });
  });

  it("counts every course of a pending-restructure skills path", () => {
    const marked = manifestFixture({
      pathId: "skills/conventional-accounting",
      arc: "immediately-effective",
      title: "Conventional Accounting",
      description: "A practical accounting path.",
      restructurePendingIn: "plan-06",
      assumes: [],
      phases: [
        {
          id: "all-courses",
          title: "Conventional Accounting",
          kind: "core",
          courses: ["debits-and-credits", "ledgers"],
        },
      ],
    });
    const flatSequences = { "debits-and-credits": ["learning/beginner"], ledgers: ["learning/beginner"] };

    expect(pathProgress(marked, emptyProgress(), flatSequences)).toEqual({
      coreDone: 0,
      coreTotal: 2,
      complete: false,
    });
    expect(
      pathProgress(
        marked,
        stateWith({ "debits-and-credits": ["learning/beginner"], ledgers: ["learning/beginner"] }),
        flatSequences,
      ),
    ).toEqual({ coreDone: 2, coreTotal: 2, complete: true });
  });
});
