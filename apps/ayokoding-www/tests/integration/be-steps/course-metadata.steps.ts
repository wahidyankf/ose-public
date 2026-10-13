import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { checkCourseCorpus, formatCorpusFailure } from "@/features/content/shell/course-corpus-check";
import { checkCourseMetadata } from "@/features/content/core/course-metadata";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/backend/content/course-metadata.feature"),
);

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

  Scenario("A stale estimate fails with the expected value", ({ Given, When, Then, And }) => {
    let problems: string[] = [];
    Given("a course whose stored estimated time differs from the computed estimate", async () => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "metadata-stale-int-"));
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
      expect(issues.map((i) => i.field)).toContain("category");
      expect(issues.map((i) => i.field)).toContain("format");
    });
  });

  Scenario("A metadata typo does not hide the page", ({ Given, When, Then }) => {
    let slugs: string[] = [];
    Given("a course page whose frontmatter has an unknown category value", async () => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "metadata-typo-int-"));
      await makeCourse(root, "typo-course", "category: not-a-category\nestimatedHours: lots");
      const { FileSystemContentRepository } = await import("@/features/content/shell/repository-fs");
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
