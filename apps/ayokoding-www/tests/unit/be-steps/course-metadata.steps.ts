import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { FileSystemContentRepository } from "@/features/content/shell/repository-fs";

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
  // @scenario specs/apps/ayokoding/www/behaviours/backend/content/course-metadata.feature: A course page with an unknown category still appears on the site
  Scenario("A course page with an unknown category still appears on the site", ({ Given, When, Then }) => {
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
