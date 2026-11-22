import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PATH_CATEGORIES } from "../../../../../src/features/course-paths/shell/paths-route";

describe("PATH_CATEGORIES drift guard", () => {
  it("stays equal to core/schemas.ts's own (unexported) PATH_ID_CATEGORIES", () => {
    // `PATH_CATEGORIES` is deliberately duplicated, not imported, from `core/schemas.ts`'s own
    // `PATH_ID_CATEGORIES` (`course-paths/core` is owned by the archived
    // `ayokoding-learning-path-02-schema-and-prerequisite-dag`; this plan does not edit it). A
    // runtime import would remove that duplication entirely, so this guard instead reads
    // `schemas.ts`'s own source text (same technique as
    // `content/shell/reader.unit.test.ts`/`repository-fs.integration.test.ts`) and compares the literal
    // array it finds there against `PATH_CATEGORIES` — if a sibling plan ever adds a third
    // category upstream without this file's own list being updated to match, this test fails
    // loudly instead of the new category silently 404ing.
    const schemasSrc = readFileSync(
      resolve(__dirname, "../../../../../src/features/course-paths/core/schemas.ts"),
      "utf-8",
    );
    const match = schemasSrc.match(/PATH_ID_CATEGORIES\s*=\s*\[([^\]]*)\]/);
    expect(match).not.toBeNull();

    const categoriesFromSchemas = (match?.[1] ?? "")
      .split(",")
      .map((entry) => entry.trim().replace(/^["'](.*)["']$/, "$1"))
      .filter((entry) => entry.length > 0);

    expect(categoriesFromSchemas).toEqual([...PATH_CATEGORIES]);
  });
});
