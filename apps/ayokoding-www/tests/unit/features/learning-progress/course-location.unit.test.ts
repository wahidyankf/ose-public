import { describe, expect, it } from "vitest";
import { courseLocationFromSlug } from "@/features/learning-progress/core/course-location";

describe("courseLocationFromSlug", () => {
  it("maps a course root to its course with no page path", () => {
    expect(courseLocationFromSlug("learn/courses/sql-essentials")).toEqual({
      courseId: "sql-essentials",
      pagePath: null,
    });
  });

  it("maps an inner page to its course and page path", () => {
    expect(courseLocationFromSlug("learn/courses/sql-essentials/learning/beginner")).toEqual({
      courseId: "sql-essentials",
      pagePath: "learning/beginner",
    });
  });

  it("maps a deeply nested page to its course and page path", () => {
    expect(courseLocationFromSlug("learn/courses/sql-essentials/learning/capstone/part-1")).toEqual({
      courseId: "sql-essentials",
      pagePath: "learning/capstone/part-1",
    });
  });

  it("returns null for the course catalog slug", () => {
    expect(courseLocationFromSlug("learn/courses")).toBeNull();
  });

  it("returns null for every slug outside learn/courses", () => {
    expect(courseLocationFromSlug("learn/paths/careers/immediately-effective/software-engineer")).toBeNull();
    expect(courseLocationFromSlug("learn")).toBeNull();
    expect(courseLocationFromSlug("tools/ai-benchmark")).toBeNull();
    expect(courseLocationFromSlug("")).toBeNull();
  });

  it("returns null for an empty segment", () => {
    expect(courseLocationFromSlug("learn/courses/")).toBeNull();
    expect(courseLocationFromSlug("learn/courses/sql-essentials/")).toBeNull();
    expect(courseLocationFromSlug("learn/courses//learning/beginner")).toBeNull();
  });
});
