import { describe, expect, it } from "vitest";
import { checkCourseMetadata } from "../../../../../src/features/content/core/course-metadata";

const base = {
  category: "data-and-databases",
  description: "Model data in tables and query it with joins and filters.",
  format: "by-example",
  estimatedHours: 8,
};

describe("checkCourseMetadata", () => {
  it("passes a complete course", () => {
    expect(checkCourseMetadata("sql-essentials", base)).toEqual([]);
  });

  it("allows an outline to omit format and estimatedHours", () => {
    expect(
      checkCourseMetadata("accounting-foundations", {
        category: "accounting",
        description: "Learn the accounting equation and double entry basics.",
        status: "outline",
      }),
    ).toEqual([]);
  });

  it("still validates declared fields on an outline", () => {
    const issues = checkCourseMetadata("x", {
      category: "accounting",
      description: "Learn the accounting equation and double entry basics.",
      status: "outline",
      format: "bogus",
    });
    expect(issues.map((i) => i.field)).toContain("format");
  });

  it("names the course and each failing field", () => {
    const issues = checkCourseMetadata("lisp", { category: "databases", description: base.description });
    const fields = issues.map((i) => i.field);
    expect(fields).toContain("category");
    expect(fields).toContain("format");
    expect(fields).toContain("estimatedHours");
    expect(issues.every((i) => i.courseId === "lisp")).toBe(true);
  });

  it("rejects description edge cases", () => {
    const bad = [
      "Too short.",
      "Build .NET tools and services for Windows desktops today. Really.",
      "First sentence here. Second sentence follows right after it.",
      "Uses a middle dot · inside an otherwise fine sentence.",
      "x".repeat(121) + ".",
      "A tiny sentence.",
    ];
    for (const description of bad) {
      const issues = checkCourseMetadata("c", { ...base, description });
      expect(
        issues.map((i) => i.field),
        description,
      ).toContain("description");
    }
  });

  it("accepts a semicolon and a single sentence at bounds", () => {
    expect(
      checkCourseMetadata("c", { ...base, description: "Learn tables; query them with joins, filters, and groups." }),
    ).toEqual([]);
  });
});
