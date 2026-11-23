import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";

// Source-order regression, moved from tests/unit/fe-steps/course-catalog.steps.tsx because it reads
// the page source from disk. The catalog dispatch must precede the `courseId === null` early return
// in page.tsx, because courseIdFromSlug("learn/courses") is null (section, not a course root).
describe("catalog dispatch order (plan 03 regression)", () => {
  it("page.tsx checks COURSE_CATALOG_SLUG before the courseId===null return", async () => {
    const source = await fs.readFile("src/app/[locale]/(content)/[...slug]/page.tsx", "utf-8");
    expect(source.indexOf("slugStr === COURSE_CATALOG_SLUG")).toBeLessThan(source.indexOf("if (courseId === null)"));
  });
});
