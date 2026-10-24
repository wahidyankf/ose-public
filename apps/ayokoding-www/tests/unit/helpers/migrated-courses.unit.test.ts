import path from "node:path";
import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  AI_AGENT_COURSE_SLUGS,
  CAPSTONE_WORD_FLOOR,
  EXPECTED_CATALOG_TOTAL,
  EXPECTED_CATEGORY_TOTALS,
  MIGRATED_COURSES,
  REQUIRED_DRILLING_SECTIONS,
  assignedFormat,
  countWords,
  hasNetworkCall,
  parseReferenceAccessDates,
  sectionHeadings,
  wordFloor,
} from "../helpers/migrated-courses";

/** The brief directory, whether the plan still lives in-progress or is archived to done. */
async function findBriefDir(): Promise<string> {
  const repoRoot = path.resolve(process.cwd(), "..", "..");
  for (const area of ["plans/in-progress", "plans/done"]) {
    let plans: string[];
    try {
      plans = await fs.readdir(path.join(repoRoot, area));
    } catch {
      continue;
    }
    for (const plan of plans) {
      const candidate = path.join(repoRoot, area, plan, "syllabus", "courses");
      try {
        if ((await fs.stat(candidate)).isDirectory()) return candidate;
      } catch {
        /* not this plan */
      }
    }
  }
  throw new Error("syllabus/courses brief directory not found");
}

describe("migrated-courses guard data", () => {
  it("names exactly the 48 briefed slugs", async () => {
    const briefs = (await fs.readdir(await findBriefDir()))
      .filter((f) => f.endsWith(".md") && f !== "README.md")
      .map((f) => f.slice(0, -3))
      .sort();
    expect(MIGRATED_COURSES.map((c) => c.slug).sort()).toEqual(briefs);
    expect(MIGRATED_COURSES).toHaveLength(48);
  });

  it("splits 41 By Example and 7 Annotated-Concept", () => {
    const modes = MIGRATED_COURSES.map((c) => c.mode);
    expect(modes.filter((m) => m === "by-example")).toHaveLength(41);
    expect(modes.filter((m) => m === "annotated-concept")).toHaveLength(7);
  });

  it("assigns a valid format and word floor per mode", () => {
    expect(assignedFormat("by-example")).toBe("by-example");
    expect(assignedFormat("annotated-concept")).toBe("annotated-concept");
    expect(wordFloor("by-example")).toBe(28000);
    expect(wordFloor("annotated-concept")).toBe(22000);
    expect(CAPSTONE_WORD_FLOOR).toBe(800);
  });

  it("names the 4 AI coding-agent courses, all inside the 48", () => {
    const slugs = new Set(MIGRATED_COURSES.map((c) => c.slug));
    expect(AI_AGENT_COURSE_SLUGS).toHaveLength(4);
    for (const slug of AI_AGENT_COURSE_SLUGS) expect(slugs.has(slug)).toBe(true);
  });

  it("requires the five drilling sections in order", () => {
    expect(REQUIRED_DRILLING_SECTIONS).toEqual([
      "Recall Q&A",
      "Applied problems",
      "Code katas",
      "Self-check checklist",
      "Elaborative interrogation & self-explanation",
    ]);
  });

  it("expects the tech-docs/004 After totals summing to 230", () => {
    expect(EXPECTED_CATALOG_TOTAL).toBe(230);
    expect(Object.keys(EXPECTED_CATEGORY_TOTALS)).toHaveLength(14);
    expect(Object.values(EXPECTED_CATEGORY_TOTALS).reduce((a, b) => a + b, 0)).toBe(230);
  });
});

describe("migrated-courses text helpers", () => {
  it("counts words past the frontmatter", () => {
    expect(countWords('---\ntitle: "T"\n---\n\nHello brave new world.\n')).toBe(4);
    expect(countWords("one two three")).toBe(3);
  });

  it("reads ## headings in order", () => {
    expect(sectionHeadings("## Recall Q&A\n\ntext\n## Applied problems\n")).toEqual(["Recall Q&A", "Applied problems"]);
  });

  it("flags only non-local URLs in run.yaml", () => {
    expect(hasNetworkCall("run:\n  - curl https://api.example.com/v1\n")).toBe(true);
    expect(hasNetworkCall("run:\n  - node server.js # http://localhost:3101\n")).toBe(false);
    expect(hasNetworkCall("run:\n  - deno run mod.ts\n")).toBe(false);
  });

  it("parses access dates from the References section only", () => {
    const page = "## Intro\n\ndated 2020-01-01\n\n## References\n\n- v2 (accessed 2026-10-01, https://x)\n";
    expect(parseReferenceAccessDates(page)).toEqual(["2026-10-01"]);
    expect(parseReferenceAccessDates("## Intro\n\nno refs\n")).toEqual([]);
  });
});
