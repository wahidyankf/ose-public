import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import matter from "gray-matter";
import { expect } from "vitest";

const behavioursRoot = path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths");

const pathCopyFeature = await loadFeature(path.join(behavioursRoot, "path-copy.feature"));

// In-memory stand-in for the committed path pages and the AI Engineer manifest, keyed by path from
// the app root. The real files are read by
// tests/integration/features/course-paths/content/path-copy.integration.test.ts.
const HUB_PAGE_PATH = "content/en/learn/paths/_index.md";
const CAREERS_ROOT = "content/en/learn/paths/careers";
const AI_PAGE_PATH = `${CAREERS_ROOT}/immediately-effective/ai-engineer/_index.md`;
const AI_MANIFEST_PATH = "src/features/course-paths/manifests/careers/immediately-effective/ai-engineer.json";

const AI_DESCRIPTION = "For developers who already code: build, evaluate, deploy, and operate AI systems.";
const PAGES: Readonly<Record<string, string>> = {
  [HUB_PAGE_PATH]: [
    "---",
    'title: "Paths"',
    'description: "Choose a learning path: an ordered route through the course library toward a goal."',
    "---",
    "",
    "Pick the route that fits your goal.",
    "",
  ].join("\n"),
  [AI_PAGE_PATH]: [
    "---",
    'title: "Immediately Effective AI Engineer"',
    `description: "${AI_DESCRIPTION}"`,
    "---",
    "",
    "Build, evaluate, and run AI systems.",
    "",
  ].join("\n"),
};
const MANIFESTS: Readonly<Record<string, string>> = {
  [AI_MANIFEST_PATH]: JSON.stringify({
    pathId: "careers/immediately-effective/ai-engineer",
    description: AI_DESCRIPTION,
  }),
};

const FORBIDDEN_COPY_PATTERNS = [/dangerous/i, /oi-2/i, /append/i, /manifest/i, /from.scratch/i];

function listPathCopyPages(): string[] {
  return Object.keys(PAGES).filter((page) => page === HUB_PAGE_PATH || page.startsWith(`${CAREERS_ROOT}/`));
}

function pageText(file: string): string {
  const text = PAGES[file];
  if (text === undefined) throw new Error(`no page in the double: ${file}`);
  return text;
}

describeFeature(pathCopyFeature, ({ Scenario }) => {
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/path-copy.feature: Career path pages contain no internal planning vocabulary
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
          const patterns = FORBIDDEN_COPY_PATTERNS.filter((pattern) => pattern.test(pageText(file))).map(String);
          return { file, patterns };
        })
        .filter((entry) => entry.patterns.length > 0);
    });

    Then('no page contains "Dangerous", "OI-2", "append", "manifest", or "from scratch" in any spelling', () => {
      expect(offenders).toEqual([]);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/path-copy.feature: The AI Engineer path page and card say the path is for developers who already code
  Scenario(
    "The AI Engineer path page and card say the path is for developers who already code",
    ({ Given, When, Then }) => {
      let pageDescription: string | undefined;
      let manifestDescription: string | undefined;

      Given("the AI Engineer path page and its card", () => {
        expect(PAGES[AI_PAGE_PATH]).toBeDefined();
        expect(MANIFESTS[AI_MANIFEST_PATH]).toBeDefined();
      });

      When("their descriptions are read", () => {
        pageDescription = (matter(pageText(AI_PAGE_PATH)).data as { description?: string }).description;
        manifestDescription = (JSON.parse(MANIFESTS[AI_MANIFEST_PATH] ?? "{}") as { description?: string }).description;
      });

      Then("both descriptions say the path is for developers who already code", () => {
        expect(pageDescription?.toLowerCase()).toContain("for developers who already code");
        expect(manifestDescription?.toLowerCase()).toContain("for developers who already code");
      });
    },
  );
});
