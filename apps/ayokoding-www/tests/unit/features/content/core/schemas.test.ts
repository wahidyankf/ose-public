import { describe, expect, it } from "vitest";
import { frontmatterSchema } from "../../../../../src/features/content/core/schemas";

describe("frontmatterSchema — prerequisites (course-paths cycle 2.4)", () => {
  it("parses a declared prerequisites list", () => {
    const parsed = frontmatterSchema.parse({
      title: "Data Structures & Algorithms Essentials",
      prerequisites: ["version-control-and-git"],
    });

    expect(parsed.prerequisites).toEqual(["version-control-and-git"]);
  });

  it("defaults prerequisites to an empty array when the frontmatter omits it", () => {
    const parsed = frontmatterSchema.parse({ title: "A course with no declared prerequisites" });

    expect(parsed.prerequisites).toEqual([]);
  });
});

describe("frontmatterSchema — status (outline-course-status)", () => {
  it('parses status "outline"', () => {
    const parsed = frontmatterSchema.parse({ title: "An outline course", status: "outline" });

    expect(parsed.status).toEqual("outline");
  });

  it("parses when status is absent", () => {
    const parsed = frontmatterSchema.parse({ title: "A complete course" });

    expect(parsed.status).toBeUndefined();
  });

  it('rejects status "draft"', () => {
    expect(() => frontmatterSchema.parse({ title: "A draft course", status: "draft" })).toThrow();
  });
});
