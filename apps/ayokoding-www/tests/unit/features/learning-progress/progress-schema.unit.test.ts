import { describe, expect, it } from "vitest";
import {
  PROGRESS_STORAGE_KEY,
  PROGRESS_VERSION,
  courseIdSchema,
  pagePathSchema,
  pathIdSchema,
  progressStateSchema,
} from "@/features/learning-progress/core/progress-schema";

const validState = {
  version: PROGRESS_VERSION,
  completed: {
    "extending-neovim": ["drill/one", "learning/beginner"],
    "just-enough-lua": ["learning/overview"],
  },
  lastPath: { pathId: "careers/immediately-effective/software-engineer", courseId: "extending-neovim" },
  lastCourse: { courseId: "extending-neovim" },
};

function rejects(value: unknown): boolean {
  return progressStateSchema.safeParse(value).success === false;
}

describe("progress schema constants", () => {
  it("pins the persisted key and the version", () => {
    expect(PROGRESS_STORAGE_KEY).toBe("ayokoding-learn-progress-v1");
    expect(PROGRESS_VERSION).toBe(1);
  });
});

describe("progressStateSchema", () => {
  it("parses a valid record unchanged", () => {
    expect(progressStateSchema.parse(validState)).toEqual(validState);
  });

  it("parses an empty record", () => {
    expect(progressStateSchema.parse({ version: 1, completed: {}, lastPath: null, lastCourse: null })).toEqual({
      version: 1,
      completed: {},
      lastPath: null,
      lastCourse: null,
    });
  });

  it("rejects another version", () => {
    expect(rejects({ ...validState, version: 2 })).toBe(true);
  });

  it("rejects an extra top-level key", () => {
    expect(rejects({ ...validState, extra: true })).toBe(true);
  });

  it("rejects an extra key inside a nested object", () => {
    expect(rejects({ ...validState, lastPath: { ...validState.lastPath, source: "url" } })).toBe(true);
    expect(rejects({ ...validState, lastCourse: { ...validState.lastCourse, title: "Extending Neovim" } })).toBe(true);
  });

  it("rejects a bad course id", () => {
    expect(rejects({ ...validState, completed: { Extending_Neovim: ["learning/beginner"] } })).toBe(true);
    expect(rejects({ ...validState, completed: { "": ["learning/beginner"] } })).toBe(true);
  });

  it("rejects a bad page path", () => {
    expect(rejects({ ...validState, completed: { "extending-neovim": ["Learning/Beginner"] } })).toBe(true);
    expect(rejects({ ...validState, completed: { "extending-neovim": ["learning//beginner"] } })).toBe(true);
    expect(rejects({ ...validState, completed: { "extending-neovim": [""] } })).toBe(true);
  });

  it("rejects a bad path id", () => {
    expect(rejects({ ...validState, lastPath: { pathId: "careers", courseId: "extending-neovim" } })).toBe(true);
    expect(rejects({ ...validState, lastPath: { pathId: "learn/courses/x", courseId: "extending-neovim" } })).toBe(
      true,
    );
    expect(rejects({ ...validState, lastPath: { pathId: "skills/UPPER", courseId: "extending-neovim" } })).toBe(true);
  });

  it("accepts 500 completed pages and rejects 501", () => {
    const pages = (count: number) => Array.from({ length: count }, (_, index) => `page-${index}`);
    expect(
      progressStateSchema.safeParse({ ...validState, completed: { "extending-neovim": pages(500) } }).success,
    ).toBe(true);
    expect(rejects({ ...validState, completed: { "extending-neovim": pages(501) } })).toBe(true);
  });

  it("accepts 500 completed courses and rejects 501", () => {
    const courses = (count: number) =>
      Object.fromEntries(Array.from({ length: count }, (_, index) => [`course-${index}`, ["learning/beginner"]]));
    expect(progressStateSchema.safeParse({ ...validState, completed: courses(500) }).success).toBe(true);
    expect(rejects({ ...validState, completed: courses(501) })).toBe(true);
  });
});

describe("id patterns", () => {
  it("accepts kebab-case ids and rejects malformed ones", () => {
    expect(courseIdSchema.safeParse("just-enough-nvim").success).toBe(true);
    expect(courseIdSchema.safeParse("just_enough_nvim").success).toBe(false);
    expect(courseIdSchema.safeParse("just-enough-").success).toBe(false);
    expect(courseIdSchema.safeParse("-just-enough").success).toBe(false);
  });

  it("accepts nested page paths and rejects leading, trailing, and doubled slashes", () => {
    expect(pagePathSchema.safeParse("learning/beginner").success).toBe(true);
    expect(pagePathSchema.safeParse("learning/capstone/part-1").success).toBe(true);
    expect(pagePathSchema.safeParse("/learning").success).toBe(false);
    expect(pagePathSchema.safeParse("learning/").success).toBe(false);
    expect(pagePathSchema.safeParse("learning//beginner").success).toBe(false);
  });

  it("accepts careers and skills path ids and rejects every other category", () => {
    expect(pathIdSchema.safeParse("careers/immediately-effective/software-engineer").success).toBe(true);
    expect(pathIdSchema.safeParse("skills/conventional-accounting").success).toBe(true);
    expect(pathIdSchema.safeParse("skills/a/b").success).toBe(true);
    expect(pathIdSchema.safeParse("courses/just-enough-nvim").success).toBe(false);
    expect(pathIdSchema.safeParse("skills").success).toBe(false);
    expect(pathIdSchema.safeParse("skills/conventional-accounting/").success).toBe(false);
  });
});
