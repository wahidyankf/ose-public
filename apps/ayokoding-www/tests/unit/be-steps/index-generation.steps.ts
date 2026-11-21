import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import type { ContentMeta } from "../../../src/features/content/core/types";
import {
  processAllIndexFiles,
  type IndexGeneratorPort,
  type ProcessResult,
} from "../../../src/features/content/shell/index-generator";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/build-tools/index-generation/index-generation.feature",
  ),
);

const FIXED_NOW = new Date("2026-01-01T00:00:00.000Z");
const CONTENT_ROOT = "/virtual-content";

function makeIndex(title: string, weight: number, extra = ""): string {
  const extraFields = extra.length > 0 ? `\n${extra}` : "";
  return `---\ntitle: "${title}"\nweight: ${weight}\ndate: 2026-01-01T00:00:00+07:00\ndraft: false${extraFields}\n---\n`;
}

function makePage(title: string, weight: number): string {
  return `---\ntitle: "${title}"\nweight: ${weight}\ndate: 2026-01-01T00:00:00+07:00\ndraft: false\n---\n\nSome content.\n`;
}

function createMemoryPort(): IndexGeneratorPort & {
  files: Map<string, string>;
  add(relativePath: string, title: string, weight: number, content: string): void;
} {
  const files = new Map<string, string>();
  const metadata: ContentMeta[] = [];

  return {
    files,
    add(relativePath, title, weight, content) {
      const filePath = `${CONTENT_ROOT}/${relativePath}`;
      const [locale = "", ...restParts] = relativePath.split("/");
      const rest = restParts.join("/");
      const isSection = rest.endsWith("_index.md");
      let slug = rest.replace(/\.md$/u, "").replace(/\/_index$/u, "");
      if (slug === "_index") slug = "";
      files.set(filePath, content);
      metadata.push({
        title,
        slug,
        locale,
        weight,
        date: FIXED_NOW,
        tags: [],
        draft: false,
        isSection,
        filePath,
      });
    },
    repository: {
      async readAllContent() {
        return metadata;
      },
      async readFileContent(filePath) {
        return { content: files.get(filePath) ?? "", frontmatter: {} };
      },
    },
    async readText(filePath) {
      const content = files.get(filePath);
      if (content === undefined) throw new Error(`Missing in-memory file: ${filePath}`);
      return content;
    },
    async writeText(filePath, content) {
      files.set(filePath, content);
    },
    now() {
      return FIXED_NOW;
    },
  };
}

describeFeature(feature, ({ Scenario, Background }) => {
  let port = createMemoryPort();
  let result: ProcessResult;

  Background(({ Given }) => {
    Given("a temporary content directory", () => {
      port = createMemoryPort();
      result = { changed: [], errors: [] };
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/index-generation/index-generation.feature: Section _index.md lists direct children sorted by weight
  Scenario("Section _index.md lists direct children sorted by weight", ({ Given, When, Then }) => {
    Given('a section "tools" with children weighted 300, 100, and 200', () => {
      port.add("en/_index.md", "English", 1, makeIndex("English", 1));
      port.add("en/tools/_index.md", "Tools", 10, makeIndex("Tools", 10));
      port.add("en/tools/alpha.md", "Alpha", 300, makePage("Alpha", 300));
      port.add("en/tools/beta.md", "Beta", 100, makePage("Beta", 100));
      port.add("en/tools/gamma.md", "Gamma", 200, makePage("Gamma", 200));
    });
    When("the index generator runs in generate mode", async () => {
      result = await processAllIndexFiles(CONTENT_ROOT, "generate", port);
    });
    Then("the tools _index.md should list children in weight order 100, 200, 300", () => {
      const content = port.files.get(`${CONTENT_ROOT}/en/tools/_index.md`) ?? "";
      const links = content.split("\n").filter((line) => line.startsWith("- ["));
      expect(links).toEqual(["- [Beta](/en/tools/beta)", "- [Gamma](/en/tools/gamma)", "- [Alpha](/en/tools/alpha)"]);
      expect(result.errors).toEqual([]);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/index-generation/index-generation.feature: Nested sections render with indentation
  Scenario("Nested sections render with indentation", ({ Given, When, Then }) => {
    Given('a section "tools" containing a child section "react" with leaf page "overview"', () => {
      port.add("en/_index.md", "English", 1, makeIndex("English", 1));
      port.add("en/tools/_index.md", "Tools", 10, makeIndex("Tools", 10));
      port.add("en/tools/react/_index.md", "React", 100, makeIndex("React", 100));
      port.add("en/tools/react/overview.md", "Overview", 10, makePage("Overview", 10));
    });
    When("the index generator runs in generate mode", async () => {
      result = await processAllIndexFiles(CONTENT_ROOT, "generate", port);
    });
    Then('the tools _index.md should show "overview" indented under "react"', () => {
      const content = port.files.get(`${CONTENT_ROOT}/en/tools/_index.md`) ?? "";
      expect(content).toContain("- [React](/en/tools/react)");
      expect(content).toContain("  - [Overview](/en/tools/react/overview)");
      expect(result.errors).toEqual([]);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/index-generation/index-generation.feature: Existing frontmatter is preserved during generation
  Scenario("Existing frontmatter is preserved during generation", ({ Given, When, Then }) => {
    Given('a _index.md with frontmatter title "My Tools" and weight 500', () => {
      port.add("en/_index.md", "English", 1, makeIndex("English", 1));
      port.add("en/tools/_index.md", "My Tools", 500, makeIndex("My Tools", 500));
      port.add("en/tools/page.md", "Page", 10, makePage("Page", 10));
    });
    When("the index generator runs in generate mode", async () => {
      result = await processAllIndexFiles(CONTENT_ROOT, "generate", port);
    });
    Then('the frontmatter should contain title "My Tools" and weight 500', () => {
      const content = port.files.get(`${CONTENT_ROOT}/en/tools/_index.md`) ?? "";
      expect(content).toContain('title: "My Tools"');
      expect(content).toContain("weight: 500");
      expect(result.errors).toEqual([]);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/index-generation/index-generation.feature: Validate mode detects stale _index.md
  Scenario("Validate mode detects stale _index.md", ({ Given, When, Then }) => {
    Given("a section with a child page not listed in its _index.md", () => {
      port.add("en/_index.md", "English", 1, makeIndex("English", 1));
      port.add("en/tools/_index.md", "Tools", 10, makeIndex("Tools", 10));
      port.add("en/tools/new-page.md", "New Page", 10, makePage("New Page", 10));
    });
    When("the index generator runs in validate mode", async () => {
      result = await processAllIndexFiles(CONTENT_ROOT, "validate", port);
    });
    Then("it should report the _index.md as out of date", () => {
      expect(result.changed).toContain(`${CONTENT_ROOT}/en/tools/_index.md`);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/index-generation/index-generation.feature: Generate mode is idempotent
  Scenario("Generate mode is idempotent", ({ Given, When, Then }) => {
    Given("a section with up-to-date _index.md files", async () => {
      port.add("en/_index.md", "English", 1, makeIndex("English", 1));
      port.add("en/tools/_index.md", "Tools", 10, makeIndex("Tools", 10));
      port.add("en/tools/page.md", "Page", 10, makePage("Page", 10));
      await processAllIndexFiles(CONTENT_ROOT, "generate", port);
    });
    When("the index generator runs in generate mode", async () => {
      result = await processAllIndexFiles(CONTENT_ROOT, "generate", port);
    });
    Then("no files should be reported as changed", () => {
      expect(result).toEqual({ changed: [], errors: [] });
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/index-generation/index-generation.feature: Missing frontmatter fields are added
  Scenario("Missing frontmatter fields are added", ({ Given, When, Then, And }) => {
    Given("a _index.md without date or draft fields", () => {
      port.add("en/_index.md", "English", 1, makeIndex("English", 1));
      port.add("en/section/_index.md", "Minimal", 10, '---\ntitle: "Minimal"\nweight: 10\n---\n');
      port.add("en/section/page.md", "Page", 10, makePage("Page", 10));
    });
    When("the index generator runs in generate mode", async () => {
      result = await processAllIndexFiles(CONTENT_ROOT, "generate", port);
    });
    Then("the _index.md should contain a date field", () => {
      expect(port.files.get(`${CONTENT_ROOT}/en/section/_index.md`)).toContain(`date: ${FIXED_NOW.toISOString()}`);
    });
    And("the _index.md should contain draft set to false", () => {
      expect(port.files.get(`${CONTENT_ROOT}/en/section/_index.md`)).toContain("draft: false");
      expect(result.errors).toEqual([]);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/index-generation/index-generation.feature: The course catalog index holds only its frontmatter
  Scenario("The course catalog index holds only its frontmatter", ({ Given, When, Then }) => {
    Given('a "learn/courses" section in locale "en" with two course sections', () => {
      port.add("en/learn/courses/_index.md", "Courses", 102, makeIndex("Courses", 102));
      port.add("en/learn/courses/sql-essentials/_index.md", "SQL Essentials", 200, makeIndex("SQL Essentials", 200));
      port.add("en/learn/courses/sql-essentials/overview.md", "Overview", 10, makePage("Overview", 10));
      port.add("en/learn/courses/git-course/_index.md", "Git Course", 100, makeIndex("Git Course", 100));
      port.add("en/learn/courses/git-course/overview.md", "Overview", 10, makePage("Overview", 10));
    });

    When("the index generator runs in generate mode", async () => {
      result = await processAllIndexFiles(CONTENT_ROOT, "generate", port);
    });

    Then("the learn/courses _index.md contains only its frontmatter", () => {
      const content = port.files.get(`${CONTENT_ROOT}/en/learn/courses/_index.md`) ?? "";
      expect(content.split("\n").filter((l) => l.startsWith("- ["))).toEqual([]);
      expect(content.split("---").slice(2).join("---").trim()).toBe("");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/index-generation/index-generation.feature: Each course index lists its own pages
  Scenario("Each course index lists its own pages", ({ Given, When, Then }) => {
    Given('a "learn/courses" section in locale "en" with two course sections', () => {
      port.add("en/learn/courses/_index.md", "Courses", 102, makeIndex("Courses", 102));
      port.add("en/learn/courses/sql-essentials/_index.md", "SQL Essentials", 200, makeIndex("SQL Essentials", 200));
      port.add("en/learn/courses/sql-essentials/overview.md", "Overview", 10, makePage("Overview", 10));
      port.add("en/learn/courses/git-course/_index.md", "Git Course", 100, makeIndex("Git Course", 100));
      port.add("en/learn/courses/git-course/overview.md", "Overview", 10, makePage("Overview", 10));
    });

    When("the index generator runs in generate mode", async () => {
      result = await processAllIndexFiles(CONTENT_ROOT, "generate", port);
    });

    Then("each course _index.md still lists its own children", () => {
      const content = port.files.get(`${CONTENT_ROOT}/en/learn/courses/sql-essentials/_index.md`) ?? "";
      expect(content).toContain("- [Overview](/en/learn/courses/sql-essentials/overview)");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/index-generation/index-generation.feature: A section whose index cannot be written is listed as an error and the other sections still generate
  Scenario(
    "A section whose index cannot be written is listed as an error and the other sections still generate",
    ({ Given, When, Then, And }) => {
      Given(
        'two sections "tools" and "react" in locale "en" with one child page each, and the write to the tools index is refused',
        () => {
          port.add("en/tools/_index.md", "Tools", 10, makeIndex("Tools", 10));
          port.add("en/tools/alpha.md", "Alpha", 10, makePage("Alpha", 10));
          port.add("en/react/_index.md", "React", 20, makeIndex("React", 20));
          port.add("en/react/beta.md", "Beta", 10, makePage("Beta", 10));
          const writeAllowed = port.writeText;
          port.writeText = async (filePath, content) => {
            if (filePath === `${CONTENT_ROOT}/en/tools/_index.md`) throw new Error("EACCES: permission denied");
            return writeAllowed(filePath, content);
          };
        },
      );

      When("the index generator runs in generate mode", async () => {
        result = await processAllIndexFiles(CONTENT_ROOT, "generate", port);
      });

      Then("the tools index is listed as an error with the reason it was refused", () => {
        expect(result.errors).toEqual([`${CONTENT_ROOT}/en/tools/_index.md: EACCES: permission denied`]);
      });

      And("the react index still lists its child page", () => {
        const content = port.files.get(`${CONTENT_ROOT}/en/react/_index.md`) ?? "";
        expect(content).toContain("- [Beta](/en/react/beta)");
      });
    },
  );
});
