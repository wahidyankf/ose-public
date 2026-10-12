import fs from "node:fs";
import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import matter from "gray-matter";
import { expect } from "vitest";

const behavioursRoot = path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths");

const pathCopyFeature = await loadFeature(path.join(behavioursRoot, "path-copy.feature"));

// Same readers as tests/unit/features/course-paths/content/path-copy.unit.test.ts:
// committed content and manifest files, never fixtures.
const APP_ROOT = process.cwd();
const HUB_PAGE_PATH = path.join(APP_ROOT, "content/en/learn/paths/_index.md");
const CAREERS_ROOT = path.join(APP_ROOT, "content/en/learn/paths/careers");
const AI_PAGE_PATH = path.join(CAREERS_ROOT, "immediately-effective/ai-engineer/_index.md");
const AI_MANIFEST_PATH = path.join(
  APP_ROOT,
  "src/features/course-paths/manifests/careers/immediately-effective/ai-engineer.json",
);

const FORBIDDEN_COPY_PATTERNS = [/dangerous/i, /oi-2/i, /append/i, /manifest/i, /from.scratch/i];

function listPathCopyPages(): string[] {
  const found: string[] = [HUB_PAGE_PATH];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).toSorted((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".md")) found.push(full);
    }
  };
  walk(CAREERS_ROOT);
  return found;
}

describeFeature(pathCopyFeature, ({ Scenario }) => {
  Scenario("Career path pages contain no internal planning vocabulary", ({ Given, When, Then }) => {
    let pages: string[];
    let offenders: { file: string; patterns: string[] }[];

    Given("the paths hub page and every markdown page under content/en/learn/paths/careers", () => {
      pages = listPathCopyPages();
      expect(pages.length).toBeGreaterThan(0);
    });

    When("the page text is searched case-insensitively", () => {
      offenders = pages
        .map((file) => {
          const text = fs.readFileSync(file, "utf8");
          const patterns = FORBIDDEN_COPY_PATTERNS.filter((pattern) => pattern.test(text)).map(String);
          return { file: path.relative(APP_ROOT, file), patterns };
        })
        .filter((entry) => entry.patterns.length > 0);
    });

    Then('no page contains "Dangerous", "OI-2", "append", "manifest", or "from scratch" in any spelling', () => {
      expect(offenders).toEqual([]);
    });
  });

  Scenario("The AI Engineer path says who it is for", ({ Given, When, Then }) => {
    let pageDescription: string | undefined;
    let manifestDescription: string | undefined;

    Given("the AI Engineer path manifest and its path page", () => {
      expect(fs.existsSync(AI_PAGE_PATH)).toBe(true);
      expect(fs.existsSync(AI_MANIFEST_PATH)).toBe(true);
    });

    When("their descriptions are read", () => {
      pageDescription = (matter(fs.readFileSync(AI_PAGE_PATH, "utf8")).data as { description?: string }).description;
      manifestDescription = (JSON.parse(fs.readFileSync(AI_MANIFEST_PATH, "utf8")) as { description?: string })
        .description;
    });

    Then("both descriptions say the path is for developers who already code", () => {
      expect(pageDescription?.toLowerCase()).toContain("for developers who already code");
      expect(manifestDescription?.toLowerCase()).toContain("for developers who already code");
    });
  });
});
