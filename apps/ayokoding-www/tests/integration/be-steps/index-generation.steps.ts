import path from "path";
import fs from "node:fs/promises";
import os from "node:os";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { processAllIndexFiles } from "../../../src/features/content/shell/index-generator";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/build-tools/index-generation/index-generation.feature",
  ),
);

async function createTmpContentDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "idx-test-"));
}

async function writeIndexFile(dir: string, relativePath: string, content: string): Promise<void> {
  const fullPath = path.join(dir, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, "utf-8");
}

function makeIndex(title: string, weight: number, extra?: string): string {
  const extraFields = extra ? `\n${extra}` : "";
  return `---\ntitle: "${title}"\nweight: ${weight}\ndate: 2026-01-01T00:00:00+07:00\ndraft: false${extraFields}\n---\n`;
}

function makePage(title: string, weight: number): string {
  return `---\ntitle: "${title}"\nweight: ${weight}\ndate: 2026-01-01T00:00:00+07:00\ndraft: false\n---\n\nSome content.\n`;
}

describeFeature(feature, ({ Scenario, Background }) => {
  let tmpDir: string;

  Background(({ Given }) => {
    Given("a temporary content directory", async () => {
      tmpDir = await createTmpContentDir();
    });
  });

  Scenario("Section _index.md lists direct children sorted by weight", ({ Given, When, Then }) => {
    Given('a section "tools" with children weighted 300, 100, and 200', async () => {
      await writeIndexFile(tmpDir, "en/_index.md", makeIndex("English", 1));
      await writeIndexFile(tmpDir, "en/tools/_index.md", makeIndex("Tools", 10));
      await writeIndexFile(tmpDir, "en/tools/alpha.md", makePage("Alpha", 300));
      await writeIndexFile(tmpDir, "en/tools/beta.md", makePage("Beta", 100));
      await writeIndexFile(tmpDir, "en/tools/gamma.md", makePage("Gamma", 200));
    });

    When("the index generator runs in generate mode", async () => {
      await processAllIndexFiles(tmpDir, "generate");
    });

    Then("the tools _index.md should list children in weight order 100, 200, 300", async () => {
      const content = await fs.readFile(path.join(tmpDir, "en/tools/_index.md"), "utf-8");
      const lines = content.split("\n").filter((l) => l.startsWith("- ["));
      expect(lines[0]).toContain("Beta");
      expect(lines[1]).toContain("Gamma");
      expect(lines[2]).toContain("Alpha");
    });
  });

  Scenario("Nested sections render with indentation", ({ Given, When, Then }) => {
    Given('a section "tools" containing a child section "react" with leaf page "overview"', async () => {
      await writeIndexFile(tmpDir, "en/_index.md", makeIndex("English", 1));
      await writeIndexFile(tmpDir, "en/tools/_index.md", makeIndex("Tools", 10));
      await writeIndexFile(tmpDir, "en/tools/react/_index.md", makeIndex("React", 100));
      await writeIndexFile(tmpDir, "en/tools/react/overview.md", makePage("Overview", 10));
    });

    When("the index generator runs in generate mode", async () => {
      await processAllIndexFiles(tmpDir, "generate");
    });

    Then('the tools _index.md should show "overview" indented under "react"', async () => {
      const content = await fs.readFile(path.join(tmpDir, "en/tools/_index.md"), "utf-8");
      expect(content).toContain("- [React](/en/tools/react)");
      expect(content).toContain("  - [Overview](/en/tools/react/overview)");
    });
  });

  Scenario("Existing frontmatter is preserved during generation", ({ Given, When, Then }) => {
    Given('a _index.md with frontmatter title "My Tools" and weight 500', async () => {
      await writeIndexFile(tmpDir, "en/_index.md", makeIndex("English", 1));
      await writeIndexFile(tmpDir, "en/tools/_index.md", makeIndex("My Tools", 500));
      await writeIndexFile(tmpDir, "en/tools/page.md", makePage("Page", 10));
    });

    When("the index generator runs in generate mode", async () => {
      await processAllIndexFiles(tmpDir, "generate");
    });

    Then('the frontmatter should contain title "My Tools" and weight 500', async () => {
      const content = await fs.readFile(path.join(tmpDir, "en/tools/_index.md"), "utf-8");
      expect(content).toContain('title: "My Tools"');
      expect(content).toContain("weight: 500");
    });
  });

  Scenario("Validate mode detects stale _index.md", ({ Given, When, Then }) => {
    let result: Awaited<ReturnType<typeof processAllIndexFiles>>;

    Given("a section with a child page not listed in its _index.md", async () => {
      await writeIndexFile(tmpDir, "en/_index.md", makeIndex("English", 1));
      await writeIndexFile(tmpDir, "en/tools/_index.md", makeIndex("Tools", 10));
      await writeIndexFile(tmpDir, "en/tools/new-page.md", makePage("New Page", 10));
    });

    When("the index generator runs in validate mode", async () => {
      result = await processAllIndexFiles(tmpDir, "validate");
    });

    Then("it should report the _index.md as out of date", () => {
      expect(result.changed.length).toBeGreaterThan(0);
      expect(result.changed.some((f) => f.includes("tools/_index.md"))).toBe(true);
    });
  });

  Scenario("Generate mode is idempotent", ({ Given, When, Then }) => {
    let result: Awaited<ReturnType<typeof processAllIndexFiles>>;

    Given("a section with up-to-date _index.md files", async () => {
      await writeIndexFile(tmpDir, "en/_index.md", makeIndex("English", 1));
      await writeIndexFile(tmpDir, "en/tools/_index.md", makeIndex("Tools", 10));
      await writeIndexFile(tmpDir, "en/tools/page.md", makePage("Page", 10));
      await processAllIndexFiles(tmpDir, "generate");
    });

    When("the index generator runs in generate mode", async () => {
      result = await processAllIndexFiles(tmpDir, "generate");
    });

    Then("no files should be reported as changed", () => {
      expect(result.changed.length).toBe(0);
    });
  });

  Scenario("Missing frontmatter fields are added", ({ Given, When, Then, And }) => {
    Given("a _index.md without date or draft fields", async () => {
      await writeIndexFile(tmpDir, "en/_index.md", makeIndex("English", 1));
      const minimalFm = '---\ntitle: "Minimal"\nweight: 10\n---\n';
      await writeIndexFile(tmpDir, "en/section/_index.md", minimalFm);
      await writeIndexFile(tmpDir, "en/section/page.md", makePage("Page", 10));
    });

    When("the index generator runs in generate mode", async () => {
      await processAllIndexFiles(tmpDir, "generate");
    });

    Then("the _index.md should contain a date field", async () => {
      const content = await fs.readFile(path.join(tmpDir, "en/section/_index.md"), "utf-8");
      expect(content).toContain("date:");
    });

    And("the _index.md should contain draft set to false", async () => {
      const content = await fs.readFile(path.join(tmpDir, "en/section/_index.md"), "utf-8");
      expect(content).toContain("draft: false");
    });
  });

  Scenario("The course catalog section keeps a frontmatter-only index", ({ Given, When, Then, And }) => {
    Given('a "learn/courses" section in locale "en" with two course sections', async () => {
      await writeIndexFile(tmpDir, "en/learn/courses/_index.md", makeIndex("Courses", 102));
      await writeIndexFile(tmpDir, "en/learn/courses/sql-essentials/_index.md", makeIndex("SQL Essentials", 200));
      await writeIndexFile(tmpDir, "en/learn/courses/sql-essentials/overview.md", makePage("Overview", 10));
      await writeIndexFile(tmpDir, "en/learn/courses/git-course/_index.md", makeIndex("Git Course", 100));
      await writeIndexFile(tmpDir, "en/learn/courses/git-course/overview.md", makePage("Overview", 10));
    });

    When("the index generator runs in generate mode", async () => {
      await processAllIndexFiles(tmpDir, "generate");
    });

    Then("the learn/courses _index.md contains only its frontmatter", async () => {
      const content = await fs.readFile(path.join(tmpDir, "en/learn/courses/_index.md"), "utf-8");
      expect(content.split("\n").filter((l) => l.startsWith("- ["))).toEqual([]);
      expect(content.split("---").slice(2).join("---").trim()).toBe("");
    });

    And("each course _index.md still lists its own children", async () => {
      const content = await fs.readFile(path.join(tmpDir, "en/learn/courses/sql-essentials/_index.md"), "utf-8");
      expect(content).toContain("- [Overview](/en/learn/courses/sql-essentials/overview)");
    });
  });
});
