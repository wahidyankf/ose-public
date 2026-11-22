import path from "node:path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { FileSystemContentRepository, type ContentFileSystem } from "@/features/content/shell/repository-fs";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/backend/content/course-metadata.feature"),
);

// The content root of the in-memory tree. The real repository's read path is covered by
// tests/integration/be-steps/course-metadata.steps.ts, which writes a temporary course directory.
const ROOT = "/content";

/** In-memory content tree: a map of absolute paths to file text. A directory is any path that is a key prefix. */
function memoryContentFileSystem(files: Map<string, string>): ContentFileSystem {
  return {
    async readdir(dir) {
      const prefix = `${dir}/`;
      const isDirectoryByName = new Map<string, boolean>();
      for (const filePath of files.keys()) {
        if (!filePath.startsWith(prefix)) continue;
        const [head, ...rest] = filePath.slice(prefix.length).split("/");
        if (head === undefined) continue;
        isDirectoryByName.set(head, isDirectoryByName.get(head) === true || rest.length > 0);
      }
      if (isDirectoryByName.size === 0) throw new Error(`ENOENT: ${dir}`);
      return [...isDirectoryByName].map(([name, isDirectory]) => ({ name, isDirectory: () => isDirectory }));
    },
    async readFile(filePath) {
      const text = files.get(filePath);
      if (text === undefined) throw new Error(`ENOENT: ${filePath}`);
      return text;
    },
  };
}

function addCourse(files: Map<string, string>, slug: string, frontmatter: string): void {
  const dir = `${ROOT}/en/learn/courses/${slug}`;
  files.set(`${dir}/_index.md`, `---\ntitle: "${slug}"\n${frontmatter}\n---\n`);
  files.set(`${dir}/learning/overview.md`, '---\ntitle: "Overview"\n---\n\nHello brave new world.\n');
}

describeFeature(feature, ({ Scenario }) => {
  // @scenario specs/apps/ayokoding/www/behaviours/backend/content/course-metadata.feature: A course page with an unknown category still appears on the site
  Scenario("A course page with an unknown category still appears on the site", ({ Given, When, Then }) => {
    let slugs: string[] = [];
    Given("a course page whose frontmatter has an unknown category value", async () => {
      const files = new Map<string, string>();
      addCourse(files, "typo-course", "category: not-a-category\nestimatedHours: lots");
      const repo = new FileSystemContentRepository(ROOT, memoryContentFileSystem(files));
      const all = await repo.readAllContent();
      slugs = all.map((m) => m.slug);
    });
    When("the content index is built", () => {
      expect(slugs.length).toBeGreaterThan(0);
    });
    Then("the page is still in the content index", () => {
      expect(slugs).toContain("learn/courses/typo-course");
    });
  });
});
