import { describe, expect, it } from "vitest";
import type { ProgressState } from "@/features/learning-progress/core/progress-schema";
import {
  emptyProgress,
  parseProgress,
  recordVisit,
  serializeProgress,
  setPageComplete,
} from "@/features/learning-progress/core/progress-state";

const EMPTY: ProgressState = { version: 1, completed: {}, lastPath: null, lastCourse: null };

function state(overrides: Partial<ProgressState> = {}): ProgressState {
  return { ...EMPTY, ...overrides };
}

describe("emptyProgress", () => {
  it("returns the empty record", () => {
    expect(emptyProgress()).toEqual(EMPTY);
  });
});

describe("parseProgress", () => {
  it("returns the empty state, not recovered, for a missing key", () => {
    expect(parseProgress(null)).toEqual({ state: EMPTY, recovered: false });
  });

  it("returns the empty state, recovered, for bad JSON", () => {
    expect(parseProgress("not json")).toEqual({ state: EMPTY, recovered: true });
  });

  it("returns the empty state, recovered, when the schema rejects the value", () => {
    expect(parseProgress(JSON.stringify({ version: 2, completed: {}, lastPath: null, lastCourse: null }))).toEqual({
      state: EMPTY,
      recovered: true,
    });
  });

  it("returns the stored state, not recovered, for a valid record", () => {
    const stored = state({
      completed: { "extending-neovim": ["learning/beginner"] },
      lastCourse: { courseId: "extending-neovim" },
      lastPath: { pathId: "skills/conventional-accounting", courseId: "extending-neovim" },
    });

    expect(parseProgress(serializeProgress(stored))).toEqual({ state: stored, recovered: false });
  });
});

describe("serializeProgress", () => {
  it("sorts course keys and pages, and removes duplicate pages", () => {
    const messy = state({
      completed: {
        "zebra-course": ["learning/overview", "learning/beginner", "learning/beginner"],
        "alpha-course": ["drill/two"],
      },
      lastPath: { pathId: "skills/example", courseId: "zebra-course" },
      lastCourse: { courseId: "zebra-course" },
    });

    expect(serializeProgress(messy)).toBe(
      '{"completed":{"alpha-course":["drill/two"],"zebra-course":["learning/beginner","learning/overview"]},' +
        '"lastCourse":{"courseId":"zebra-course"},' +
        '"lastPath":{"courseId":"zebra-course","pathId":"skills/example"},"version":1}',
    );
  });

  it("is stable across a parse/serialize round trip", () => {
    const once = serializeProgress(
      state({
        completed: { b: ["learning/two", "learning/one"], a: ["drill/one"] },
        lastCourse: { courseId: "b" },
      }),
    );

    expect(serializeProgress(parseProgress(once).state)).toBe(once);
  });

  it("serializes the empty state", () => {
    expect(serializeProgress(EMPTY)).toBe('{"completed":{},"lastCourse":null,"lastPath":null,"version":1}');
  });
});

describe("setPageComplete", () => {
  it("adds a page and returns a new object without mutating the input", () => {
    const before = state({ completed: { "extending-neovim": ["learning/beginner"] } });
    const snapshot = JSON.stringify(before);

    const result = setPageComplete(before, "just-enough-lua", "drill/one", true);

    expect(result).toEqual({
      ...before,
      completed: { "extending-neovim": ["learning/beginner"], "just-enough-lua": ["drill/one"] },
    });
    expect(result).not.toBe(before);
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it("keeps a page added twice exactly once", () => {
    const once = setPageComplete(EMPTY, "extending-neovim", "learning/beginner", true);
    const twice = setPageComplete(once, "extending-neovim", "learning/beginner", true);

    expect(twice).toEqual(once);
    expect(once.completed["extending-neovim"]).toEqual(["learning/beginner"]);
  });

  it("keeps the other pages when one is removed", () => {
    const before = state({ completed: { "extending-neovim": ["drill/one", "learning/beginner"] } });

    expect(setPageComplete(before, "extending-neovim", "drill/one", false).completed).toEqual({
      "extending-neovim": ["learning/beginner"],
    });
  });

  it("drops the course key when its last page is removed", () => {
    const before = state({
      completed: { "extending-neovim": ["learning/beginner"], "just-enough-lua": ["drill/one"] },
    });

    expect(setPageComplete(before, "extending-neovim", "learning/beginner", false).completed).toEqual({
      "just-enough-lua": ["drill/one"],
    });
  });

  it("ignores a removal for a course and page that are not recorded", () => {
    expect(setPageComplete(EMPTY, "extending-neovim", "learning/beginner", false)).toEqual(EMPTY);
    expect(
      setPageComplete(
        state({ completed: { "extending-neovim": ["learning/beginner"] } }),
        "extending-neovim",
        "drill/one",
        false,
      ).completed,
    ).toEqual({ "extending-neovim": ["learning/beginner"] });
  });
});

describe("recordVisit", () => {
  it("sets the last course and the last path for a visit with a path", () => {
    const result = recordVisit(
      state({
        lastCourse: { courseId: "just-enough-lua" },
        lastPath: { pathId: "skills/example", courseId: "just-enough-lua" },
      }),
      "extending-neovim",
      "careers/interview-ready/software-engineer",
    );

    expect(result.lastCourse).toEqual({ courseId: "extending-neovim" });
    expect(result.lastPath).toEqual({
      pathId: "careers/interview-ready/software-engineer",
      courseId: "extending-neovim",
    });
  });

  it("keeps the remembered path when a visit without a path stays in the same course", () => {
    const before = state({
      lastCourse: { courseId: "extending-neovim" },
      lastPath: { pathId: "skills/example", courseId: "extending-neovim" },
    });

    const result = recordVisit(before, "extending-neovim", null);

    expect(result.lastCourse).toEqual({ courseId: "extending-neovim" });
    expect(result.lastPath).toEqual({ pathId: "skills/example", courseId: "extending-neovim" });
  });

  it("clears the remembered path when a visit without a path moves to another course", () => {
    const before = state({
      lastCourse: { courseId: "extending-neovim" },
      lastPath: { pathId: "skills/example", courseId: "extending-neovim" },
    });

    const result = recordVisit(before, "just-enough-lua", null);

    expect(result.lastCourse).toEqual({ courseId: "just-enough-lua" });
    expect(result.lastPath).toBeNull();
  });

  it("leaves the last path empty when a visit without a path has nothing remembered", () => {
    expect(recordVisit(EMPTY, "extending-neovim", null)).toEqual({
      ...EMPTY,
      lastCourse: { courseId: "extending-neovim" },
    });
  });

  it("does not mutate the input", () => {
    const before = state({ completed: { "extending-neovim": ["learning/beginner"] } });
    const snapshot = JSON.stringify(before);

    const result = recordVisit(before, "extending-neovim", "skills/example");

    expect(result).not.toBe(before);
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});
