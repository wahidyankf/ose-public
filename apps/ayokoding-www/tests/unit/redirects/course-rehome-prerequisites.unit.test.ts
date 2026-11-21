import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { resolvePrerequisites } from "../../../src/features/course-paths/core/prerequisites";
import { REHOMED_COURSE_SLUGS } from "../../../src/redirects/course-rehome";

// The authored course library: one directory per course that carries an _index.md.
const COURSES_DIR = path.resolve(__dirname, "../../../content/en/learn/courses");

function authoredCourseIds(): string[] {
  return readdirSync(COURSES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(COURSES_DIR, entry.name, "_index.md")))
    .map((entry) => entry.name)
    .sort();
}

// The raw frontmatter, read before any schema default (the schema turns a missing list into []).
function declaredPrerequisites(slug: string): unknown {
  const source = readFileSync(path.join(COURSES_DIR, slug, "_index.md"), "utf-8");
  return matter(source).data["prerequisites"];
}

describe("re-homed courses declare their prerequisites (content check on the real course frontmatter)", () => {
  it("every re-homed course declares a prerequisites list of course IDs", () => {
    const missing = REHOMED_COURSE_SLUGS.filter((slug) => !Array.isArray(declaredPrerequisites(slug)));
    expect(missing, `courses without a prerequisites list: ${missing.join(", ")}`).toEqual([]);
  });

  it("every named prerequisite resolves to a course already in the library", () => {
    const library = authoredCourseIds();
    const unresolved: string[] = [];
    for (const slug of REHOMED_COURSE_SLUGS) {
      const declared = declaredPrerequisites(slug) as string[];
      const resolved = resolvePrerequisites(slug, { [slug]: declared }, library);
      for (const prerequisite of declared) {
        if (!resolved.includes(prerequisite)) unresolved.push(`${slug} -> ${prerequisite}`);
      }
    }
    expect(unresolved, `unresolved prerequisites: ${unresolved.join(", ")}`).toEqual([]);
  });

  it("no re-homed course names itself, and the declared edges form no cycle", () => {
    const edges = new Map<string, string[]>(
      REHOMED_COURSE_SLUGS.map((slug) => [slug, declaredPrerequisites(slug) as string[]]),
    );
    const selfReferences = [...edges].filter(([slug, prerequisites]) => prerequisites.includes(slug)).map(([s]) => s);
    expect(selfReferences, `self-referencing courses: ${selfReferences.join(", ")}`).toEqual([]);

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const hasCycle = (node: string): boolean => {
      if (visited.has(node)) return false;
      if (visiting.has(node)) return true;
      visiting.add(node);
      for (const next of edges.get(node) ?? []) {
        if (hasCycle(next)) return true;
      }
      visiting.delete(node);
      visited.add(node);
      return false;
    };
    expect([...edges.keys()].some(hasCycle), "the prerequisite edges contain a cycle").toBe(false);
  });
});

// Production has no syllabus roadmap: the resolver takes the authored library alone. These pin that
// true behaviour, which replaces the removed union scenarios.
describe("prerequisite resolution against the authored library (no syllabus union in production)", () => {
  it("a prerequisite naming a course that is not yet authored is left out of the resolved list", () => {
    const resolved = resolvePrerequisites(
      "advanced-algorithms",
      { "advanced-algorithms": ["a-course-declared-but-not-yet-authored", "not-a-real-course-id-xyz"] },
      authoredCourseIds(),
    );
    expect(resolved).toEqual([]);
  });

  it("a prerequisite naming an authored course resolves whether or not any syllabus lists it", () => {
    const resolved = resolvePrerequisites(
      "advanced-algorithms",
      { "advanced-algorithms": ["just-enough-python"] },
      authoredCourseIds(),
    );
    expect(resolved).toEqual(["just-enough-python"]);
  });
});
