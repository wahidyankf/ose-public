import { describe, expect, it } from "vitest";
import { countPageEffort, estimateCourseHours } from "../../../../../src/features/content/core/course-effort";

describe("estimateCourseHours", () => {
  it("has a minimum of 1 hour", () => {
    expect(estimateCourseHours({ proseWords: 0, inlineCodeLines: 0, codeFileLines: 0 })).toBe(1);
  });

  it("uses the max of the two code counts, not the sum", () => {
    // 600 code lines at 10/min = 60 min = 1h either way; sum would give 2h.
    expect(estimateCourseHours({ proseWords: 0, inlineCodeLines: 600, codeFileLines: 600 })).toBe(1);
  });

  it("rounds half up", () => {
    // 90 minutes = 1.5h -> 2h.
    expect(estimateCourseHours({ proseWords: 18000, inlineCodeLines: 0, codeFileLines: 0 })).toBe(2);
    // 89 minutes -> 1h.
    expect(estimateCourseHours({ proseWords: 17800, inlineCodeLines: 0, codeFileLines: 0 })).toBe(1);
  });
});

describe("countPageEffort", () => {
  it("counts prose words outside fences and code lines inside", () => {
    const body = [
      "Hello brave new world",
      "",
      "```ts",
      "const a = 1;",
      "",
      "const b = 2;",
      "```",
      "",
      "Trailing words here",
    ].join("\n");
    expect(countPageEffort(body)).toEqual({ proseWords: 7, inlineCodeLines: 2 });
  });

  it("handles an unclosed fence", () => {
    expect(countPageEffort("One two\n```\ncode line\n")).toEqual({ proseWords: 2, inlineCodeLines: 1 });
  });
});
