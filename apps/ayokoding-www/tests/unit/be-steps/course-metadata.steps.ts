import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import matter from "gray-matter";
import { checkCourseMetadata } from "@/features/content/core/course-metadata";
import { checkCourseCorpus, formatCorpusFailure } from "@/features/content/shell/course-corpus-check";
import { FileSystemContentRepository } from "@/features/content/shell/repository-fs";
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

const execFileAsync = promisify(execFile);

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/backend/content/course-metadata.feature"),
);

const completionFeature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/backend/content/legacy-migrated-course-completion.feature",
  ),
);

const catalogFeature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/catalog-count-after-migration.feature",
  ),
);

const coursesRoot = path.resolve(process.cwd(), "content/en/learn/courses");
const repoRoot = path.resolve(process.cwd(), "..", "..");

async function walkMarkdownFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkMarkdownFiles(full)));
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out.sort();
}

async function readCourseFrontmatter(slug: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await fs.readFile(path.join(coursesRoot, slug, "_index.md"), "utf-8");
    return matter(raw).data as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** A directory is a harness unit when it directly holds code: anything that is
 *  not `run.yaml`, not prose (`*.md`), and not a lockfile (`*.lock`, which
 *  documents pinned transitives rather than runnable code). `before/`/`after/`
 *  fixture children are exempt — only code roots and their direct children
 *  are units. */
async function findUnitsWithoutRunYaml(codeRoot: string): Promise<string[]> {
  const missing: string[] = [];
  const isUnit = async (dir: string, isRoot: boolean, isDirectChild: boolean): Promise<void> => {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    const holdsCode = entries.some(
      (e) => e.isFile() && e.name !== "run.yaml" && !e.name.endsWith(".md") && !e.name.endsWith(".lock"),
    );
    if (holdsCode && (isRoot || isDirectChild) && !entries.some((e) => e.isFile() && e.name === "run.yaml")) {
      missing.push(path.relative(coursesRoot, dir));
    }
    for (const entry of entries) {
      if (entry.isDirectory()) await isUnit(path.join(dir, entry.name), false, isRoot);
    }
  };
  try {
    if (!(await fs.stat(codeRoot)).isDirectory()) return missing;
  } catch {
    return missing;
  }
  await isUnit(codeRoot, true, false);
  return missing;
}

async function lastContentCommitDate(courseDir: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", ["log", "-1", "--format=%cs", "--", courseDir], {
      cwd: repoRoot,
    });
    const date = stdout.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  } catch {
    return null;
  }
}

function daysBefore(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

async function makeCourse(root: string, slug: string, frontmatter: string): Promise<void> {
  const dir = path.join(root, "en", "learn", "courses", slug);
  await fs.mkdir(path.join(dir, "learning"), { recursive: true });
  await fs.writeFile(path.join(dir, "_index.md"), `---\ntitle: "${slug}"\n${frontmatter}\n---\n`);
  await fs.writeFile(
    path.join(dir, "learning", "overview.md"),
    '---\ntitle: "Overview"\n---\n\nHello brave new world.\n',
  );
}

describeFeature(feature, ({ Scenario }) => {
  Scenario("Every course in the library carries valid metadata", ({ Given, When, Then, And }) => {
    let failure = "";
    Given("the real course library on disk", () => {
      expect(path.resolve(process.cwd(), "content/en/learn/courses")).toContain("learn");
    });
    When("the course metadata check runs", async () => {
      const report = await checkCourseCorpus(path.resolve(process.cwd(), "content"));
      failure = report.problems.length === 0 ? "" : formatCorpusFailure(report);
      if (failure) throw new Error(failure);
    });
    Then("every course has a known category and a one-sentence description", () => {
      expect(failure).toBe("");
    });
    And("every course that is not an outline has a format and an estimated time", () => {
      expect(failure).toBe("");
    });
    And("every course resolves a Start page", () => {
      expect(failure).toBe("");
    });
  });

  Scenario("An outline course may omit format and estimated time", ({ Given, When, Then }) => {
    let issues: ReturnType<typeof checkCourseMetadata> = [];
    Given("a course marked as an outline with a category and a description only", () => {
      expect(true).toBe(true);
    });
    When("the course metadata check runs", () => {
      issues = checkCourseMetadata("outline-course", {
        category: "accounting",
        description: "Learn the accounting equation and double entry basics.",
        status: "outline",
      });
    });
    Then("the course passes", () => {
      expect(issues).toEqual([]);
    });
  });

  Scenario("Invalid metadata names the course and the field", ({ Given, When, Then, And }) => {
    let issues: ReturnType<typeof checkCourseMetadata> = [];
    Given('a course that is not an outline has the category "databases" and no format', () => {
      expect(true).toBe(true);
    });
    When("the course metadata check runs", () => {
      issues = checkCourseMetadata("bad-course", {
        category: "databases",
        description: "Model data in tables and query it with joins.",
        estimatedHours: 3,
      });
    });
    Then("the check fails", () => {
      expect(issues.length).toBeGreaterThan(0);
    });
    And('the failure names the course slug, the "category" field, and the "format" field', () => {
      const text = issues.map((i) => `${i.courseId}: ${i.field}: ${i.message}`).join("\n");
      expect(text).toContain("bad-course");
      expect(issues.map((i) => i.field)).toContain("category");
      expect(issues.map((i) => i.field)).toContain("format");
    });
  });

  Scenario("A stale estimate fails with the expected value", ({ Given, When, Then, And }) => {
    let problems: string[] = [];
    Given("a course whose stored estimated time differs from the computed estimate", async () => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "metadata-stale-"));
      await fs.mkdir(path.join(root, "en", "learn", "courses"), { recursive: true });
      await fs.writeFile(path.join(root, "en", "learn", "courses", "_index.md"), '---\ntitle: "Courses"\n---\n');
      await makeCourse(
        root,
        "stale-course",
        'category: data-and-databases\ndescription: "Model data in tables and query it well."\nformat: by-example\nestimatedHours: 99',
      );
      const report = await checkCourseCorpus(root);
      problems = report.problems;
      await fs.rm(root, { recursive: true, force: true });
    });
    When("the course metadata check runs", () => {
      expect(problems.length).toBeGreaterThan(0);
    });
    Then("the check fails", () => {
      expect(problems.some((p) => p.startsWith("stale-course:"))).toBe(true);
    });
    And("the failure prints the course slug, the stored value, and the expected value", () => {
      expect(problems.join("\n")).toContain("stale-course: estimatedHours: stored 99, expected 1");
    });
  });

  Scenario("A metadata typo does not hide the page", ({ Given, When, Then }) => {
    let slugs: string[] = [];
    Given("a course page whose frontmatter has an unknown category value", async () => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "metadata-typo-"));
      await makeCourse(root, "typo-course", "category: not-a-category\nestimatedHours: lots");
      const repo = new FileSystemContentRepository(root);
      const all = await repo.readAllContent();
      slugs = all.map((m) => m.slug);
      await fs.rm(root, { recursive: true, force: true });
    });
    When("the content index is built", () => {
      expect(slugs.length).toBeGreaterThan(0);
    });
    Then("the page is still in the content index", () => {
      expect(slugs).toContain("learn/courses/typo-course");
    });
  });
});

describeFeature(completionFeature, ({ Scenario }) => {
  Scenario("No migrated course is an outline", ({ Given, When, Then, And }) => {
    const problems: string[] = [];
    Given("the 48 course slugs this plan writes", () => {
      expect(MIGRATED_COURSES).toHaveLength(48);
    });
    When("each course's frontmatter is read", async () => {
      for (const course of MIGRATED_COURSES) {
        const frontmatter = await readCourseFrontmatter(course.slug);
        if (frontmatter === null) {
          problems.push(`missing course directory: ${course.slug}`);
          continue;
        }
        if (frontmatter["status"] === "outline") problems.push(`${course.slug}: carries the outline status`);
        if (frontmatter["format"] !== assignedFormat(course.mode)) {
          problems.push(
            `${course.slug}: format is ${String(frontmatter["format"])}, plan assigned ${assignedFormat(course.mode)}`,
          );
        }
      }
    });
    Then("no course carries the outline status", () => {
      expect(problems).toEqual([]);
    });
    And("each course declares the format this plan assigned it", () => {
      expect(problems).toEqual([]);
    });
  });

  Scenario(
    "Every migrated course reaches its mode's word floor and has a capstone and drilling",
    ({ Given, When, Then, And }) => {
      const problems: string[] = [];
      Given("the 48 course slugs this plan writes", () => {
        expect(MIGRATED_COURSES).toHaveLength(48);
      });
      When("each course's pages are read", async () => {
        for (const course of MIGRATED_COURSES) {
          const dir = path.join(coursesRoot, course.slug);
          const pages = await walkMarkdownFiles(dir);
          if (pages.length === 0) {
            problems.push(`missing course directory: ${course.slug}`);
            continue;
          }
          let words = 0;
          for (const page of pages) words += countWords(await fs.readFile(page, "utf-8"));
          if (words < wordFloor(course.mode)) {
            problems.push(`${course.slug}: ${words} words, floor is ${wordFloor(course.mode)}`);
          }
          try {
            const capstone = await fs.readFile(path.join(dir, "learning", "capstone", "overview.md"), "utf-8");
            if (countWords(capstone) < CAPSTONE_WORD_FLOOR) {
              problems.push(`${course.slug}: capstone overview below ${CAPSTONE_WORD_FLOOR} words`);
            }
          } catch {
            problems.push(`${course.slug}: learning/capstone/overview.md missing`);
          }
          try {
            const headings = sectionHeadings(await fs.readFile(path.join(dir, "drilling", "overview.md"), "utf-8"));
            for (const required of REQUIRED_DRILLING_SECTIONS) {
              if (!headings.includes(required)) problems.push(`${course.slug}: drilling misses section ${required}`);
            }
          } catch {
            problems.push(`${course.slug}: drilling/overview.md missing`);
          }
        }
      });
      Then(
        "each By Example course has at least 28000 words and each Annotated-Concept course has at least 22000 words",
        () => {
          expect(problems).toEqual([]);
        },
      );
      And("each course has a learning/capstone/overview.md of at least 800 words", () => {
        expect(problems).toEqual([]);
      });
      And("each course has a drilling/overview.md with the five required sections", () => {
        expect(problems).toEqual([]);
      });
    },
  );

  Scenario("Every code-bearing example is a harness unit", ({ Given, When, Then, And }) => {
    const problems: string[] = [];
    Given("the 48 course slugs this plan writes", () => {
      expect(MIGRATED_COURSES).toHaveLength(48);
    });
    When("each course's learning/code and drilling/code folders are searched for run specifications", async () => {
      for (const course of MIGRATED_COURSES) {
        const dir = path.join(coursesRoot, course.slug);
        try {
          if (!(await fs.stat(dir)).isDirectory()) throw new Error("missing");
        } catch {
          problems.push(`missing course directory: ${course.slug}`);
          continue;
        }
        for (const root of ["learning/code", "drilling/code", "learning/capstone/code"]) {
          for (const unit of await findUnitsWithoutRunYaml(path.join(dir, root))) {
            problems.push(`${course.slug}: harness unit without run.yaml: ${unit}`);
          }
        }
        const runYamlFiles: string[] = [];
        const collect = async (d: string): Promise<void> => {
          let entries;
          try {
            entries = await fs.readdir(d, { withFileTypes: true });
          } catch {
            return;
          }
          for (const entry of entries) {
            const full = path.join(d, entry.name);
            if (entry.isDirectory()) await collect(full);
            else if (entry.name === "run.yaml") runYamlFiles.push(full);
          }
        };
        for (const root of ["learning/code", "drilling/code", "learning/capstone/code"]) {
          await collect(path.join(dir, root));
        }
        for (const runYaml of runYamlFiles) {
          if (hasNetworkCall(await fs.readFile(runYaml, "utf-8"))) {
            problems.push(`${course.slug}: run.yaml performs a real network call: ${path.relative(dir, runYaml)}`);
          }
        }
      }
    });
    Then("every code-bearing example, kata, and capstone has a run.yaml", () => {
      expect(problems).toEqual([]);
    });
    And("no run.yaml performs a real network call", () => {
      expect(problems).toEqual([]);
    });
  });

  Scenario("AI coding-agent courses date every version-specific claim", ({ Given, When, Then, And }) => {
    const problems: string[] = [];
    Given(
      "the claude-code-for-engineers, hermes-agent-for-engineers, openclaw-for-engineers, and pi-coding-agent-for-engineers courses",
      () => {
        expect(AI_AGENT_COURSE_SLUGS).toHaveLength(4);
      },
    );
    When("each course's References section is read", async () => {
      for (const slug of AI_AGENT_COURSE_SLUGS) {
        const dir = path.join(coursesRoot, slug);
        const pages = await walkMarkdownFiles(dir);
        if (pages.length === 0) {
          problems.push(`missing course directory: ${slug}`);
          continue;
        }
        const commitDate = await lastContentCommitDate(path.join("apps/ayokoding-www/content/en/learn/courses", slug));
        if (commitDate === null) {
          problems.push(`${slug}: no content commit to date References against`);
          continue;
        }
        let dated = 0;
        for (const page of pages) {
          for (const access of parseReferenceAccessDates(await fs.readFile(page, "utf-8"))) {
            dated += 1;
            const age = daysBefore(access, commitDate);
            if (age < 0 || age > 30) {
              problems.push(`${slug}: References access date ${access} is not within 30 days of ${commitDate}`);
            }
          }
        }
        if (dated === 0) problems.push(`${slug}: References section records no access date`);
      }
    });
    Then("every version-specific or current-behaviour claim has an access date", () => {
      expect(problems).toEqual([]);
    });
    And("every runnable example drives a fixture shim rather than a live network call", () => {
      expect(problems).toEqual([]);
    });
  });
});

describeFeature(catalogFeature, ({ Scenario }) => {
  Scenario(
    "The total course count and every per-category count match the real corpus",
    ({ Given, When, Then, And }) => {
      const problems: string[] = [];
      Given("every course directory under apps/ayokoding-www/content/en/learn/courses", async () => {
        const entries = await fs.readdir(coursesRoot, { withFileTypes: true });
        expect(entries.filter((e) => e.isDirectory()).length).toBeGreaterThan(0);
      });
      When("courses are counted in total and grouped by category", async () => {
        const entries = await fs.readdir(coursesRoot, { withFileTypes: true });
        const slugs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
        if (slugs.length !== EXPECTED_CATALOG_TOTAL) {
          problems.push(`catalog total drift: expected ${EXPECTED_CATALOG_TOTAL}, found ${slugs.length}`);
        }
        const tally: Record<string, number> = {};
        for (const slug of slugs) {
          const frontmatter = await readCourseFrontmatter(slug);
          const category =
            frontmatter !== null && typeof frontmatter["category"] === "string" ? frontmatter["category"] : "?";
          tally[category] = (tally[category] ?? 0) + 1;
        }
        for (const [category, expected] of Object.entries(EXPECTED_CATEGORY_TOTALS)) {
          if ((tally[category] ?? 0) !== expected) {
            problems.push(`category ${category}: expected ${expected}, found ${tally[category] ?? 0}`);
          }
        }
        for (const category of Object.keys(tally)) {
          if (!(category in EXPECTED_CATEGORY_TOTALS)) problems.push(`unexpected category in corpus: ${category}`);
        }
      });
      Then("the total is 230", () => {
        expect(problems).toEqual([]);
      });
      And("each category's count matches the number of courses declaring that category", () => {
        expect(problems).toEqual([]);
      });
    },
  );
});
