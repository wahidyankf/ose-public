import fs from "node:fs";
import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import matter from "gray-matter";
import { expect } from "vitest";
import { frontmatterSchema } from "../../../src/features/content/core/schemas";

const behavioursRoot = path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths");
const coursesRoot = path.join(process.cwd(), "content/en/learn/courses");

function listCourseSlugs(): string[] {
  return fs
    .readdirSync(coursesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted();
}

function readMarkdownFilesRecursive(dir: string): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...readMarkdownFilesRecursive(full));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      found.push(full);
    }
  }
  return found;
}

const outlineFeature = await loadFeature(path.join(behavioursRoot, "outline-course-status.feature"));

describeFeature(outlineFeature, ({ Scenario }) => {
  Scenario("Course status accepts only the outline value", ({ Given, When, Then, And }) => {
    let outlineParse: ReturnType<typeof frontmatterSchema.safeParse>;
    let absentParse: ReturnType<typeof frontmatterSchema.safeParse>;
    let draftParse: ReturnType<typeof frontmatterSchema.safeParse>;

    Given("course frontmatter declares a status value", () => {
      outlineParse = frontmatterSchema.safeParse({ title: "An outline course", status: "outline" });
      absentParse = frontmatterSchema.safeParse({ title: "A complete course" });
      draftParse = frontmatterSchema.safeParse({ title: "A draft course", status: "draft" });
    });

    When("the frontmatter schema parses it", () => {
      expect([outlineParse, absentParse, draftParse].length).toBe(3);
    });

    Then('the value "outline" is accepted', () => {
      expect(outlineParse.success).toBe(true);
    });

    And("an absent status is accepted", () => {
      expect(absentParse.success).toBe(true);
    });

    And("any other value is rejected", () => {
      expect(draftParse.success).toBe(false);
    });
  });

  Scenario("Every course frontmatter parses so no course page is silently dropped", ({ Given, When, Then }) => {
    let slugs: string[];
    let failures: string[];

    Given("the published course library under content/en/learn/courses", () => {
      slugs = listCourseSlugs();
    });

    When("every course _index.md is parsed with the frontmatter schema", () => {
      failures = slugs.filter((slug) => {
        const raw = fs.readFileSync(path.join(coursesRoot, slug, "_index.md"), "utf8");
        return !frontmatterSchema.safeParse(matter(raw).data).success;
      });
    });

    Then("every course parses without error", () => {
      expect(failures).toEqual([]);
    });
  });

  Scenario("A course under one thousand words is marked as an outline", ({ Given, When, Then }) => {
    let slugs: string[];
    let unmarked: string[];

    Given("the published course library under content/en/learn/courses", () => {
      slugs = listCourseSlugs();
    });

    When("the words of every markdown file in each course directory are counted", () => {
      unmarked = slugs.filter((slug) => {
        const words = readMarkdownFilesRecursive(path.join(coursesRoot, slug))
          .map((file) => fs.readFileSync(file, "utf8"))
          .join("\n")
          .split(/\s+/)
          .filter((token) => token.length > 0).length;
        if (words >= 1000) return false;
        const raw = fs.readFileSync(path.join(coursesRoot, slug, "_index.md"), "utf8");
        return frontmatterSchema.parse(matter(raw).data).status !== "outline";
      });
    });

    Then("every course with fewer than 1000 words declares status outline", () => {
      expect(unmarked).toEqual([]);
    });
  });
});
