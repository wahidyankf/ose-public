// Phase-2 RED-guard data for plan 10 (`ayokoding-learn-revamp-10-legacy-unique-migration`).
//
// The 48 slugs below are the course files named in
// `syllabus/courses/README.md` (one brief per course); the modes follow that
// README's Mode column (41 By Example, 7 Annotated-Concept); the catalog
// totals follow tech-docs/004's "Category totals after this plan" After column
// (182 before + 48 new = 230). All three sources must stay in sync — the unit
// test next to this file pins the 48-count, the 41/7 split, and the 230 sum.

export type MigratedCourseMode = "by-example" | "annotated-concept";

export interface MigratedCourse {
  slug: string;
  mode: MigratedCourseMode;
}

/** The 7 Annotated-Concept courses; every other slug below is By Example. */
const ANNOTATED_CONCEPT_SLUGS: ReadonlySet<string> = new Set([
  "corporate-finance-essentials",
  "datomic-and-datalog-essentials",
  "frontend-styling-with-tailwind-and-radix-ui",
  "modern-frontend-meta-frameworks",
  "practical-data-analytics",
  "text-processing-with-awk-sed-and-jq",
  "typescript-advanced-tooling-zod-effect-trpc-and-xstate",
]);

export const MIGRATED_COURSES: readonly MigratedCourse[] = [
  "advanced-shell-scripting-in-depth",
  "claude-code-for-engineers",
  "clojure-essentials",
  "corporate-finance-essentials",
  "cross-platform-mobile-with-react-native",
  "csharp-in-depth",
  "dart-in-depth",
  "database-migrations-with-clojure-and-migratus",
  "database-migrations-with-csharp-and-ef-core",
  "database-migrations-with-elixir-and-ecto",
  "database-migrations-with-fsharp-and-dbup",
  "database-migrations-with-golang-and-goose",
  "database-migrations-with-java-and-liquibase",
  "database-migrations-with-java-and-spring-data-jpa",
  "database-migrations-with-kotlin-and-flyway",
  "database-migrations-with-python-and-alembic",
  "database-migrations-with-rust-and-sqlx",
  "database-migrations-with-typescript-and-effect-sql",
  "datomic-and-datalog-essentials",
  "elixir-in-depth",
  "flutter-for-the-web",
  "frontend-styling-with-tailwind-and-radix-ui",
  "frontend-unit-testing-with-vitest-and-testing-library",
  "fsharp-in-depth",
  "github-actions-and-gh-cli",
  "golang-in-depth",
  "hermes-agent-for-engineers",
  "java-in-depth",
  "kotlin-in-depth",
  "modern-frontend-meta-frameworks",
  "openclaw-for-engineers",
  "pi-coding-agent-for-engineers",
  "playwright-end-to-end-testing",
  "practical-data-analytics",
  "python-in-depth",
  "rust-in-depth",
  "text-processing-with-awk-sed-and-jq",
  "typescript-advanced-tooling-zod-effect-trpc-and-xstate",
  "typescript-in-depth",
  "web-backends-in-clojure-with-pedestal",
  "web-backends-in-csharp-with-aspnetcore",
  "web-backends-in-elixir-with-phoenix-and-liveview",
  "web-backends-in-fsharp-with-giraffe",
  "web-backends-in-go-with-gin",
  "web-backends-in-kotlin-with-ktor",
  "web-backends-in-rust-with-axum",
  "web-backends-in-the-jvm-with-vertx",
  "webassembly-essentials",
].map((slug) => ({
  slug,
  mode: ANNOTATED_CONCEPT_SLUGS.has(slug) ? "annotated-concept" : "by-example",
}));

/** The 4 AI coding-agent courses (FR5: References dating rule). */
export const AI_AGENT_COURSE_SLUGS: readonly string[] = [
  "claude-code-for-engineers",
  "hermes-agent-for-engineers",
  "openclaw-for-engineers",
  "pi-coding-agent-for-engineers",
];

/** `format:` value this plan assigns a course of the given mode. */
export function assignedFormat(mode: MigratedCourseMode): string {
  return mode === "by-example" ? "by-example" : "annotated-concept";
}

/** Word floor per mode (PRD scenario "Every migrated course reaches its mode's word floor"). */
export function wordFloor(mode: MigratedCourseMode): number {
  return mode === "by-example" ? 28000 : 22000;
}

export const CAPSTONE_WORD_FLOOR = 800;

/** The five required `drilling/overview.md` sections, in order (tech-docs/002). */
export const REQUIRED_DRILLING_SECTIONS: readonly string[] = [
  "Recall Q&A",
  "Applied problems",
  "Code katas",
  "Self-check checklist",
  "Elaborative interrogation & self-explanation",
];

/** Post-migration catalog total (tech-docs/004 After column: 182 + 48). */
export const EXPECTED_CATALOG_TOTAL = 230;

/** Post-migration per-category totals (tech-docs/004 After column). */
export const EXPECTED_CATEGORY_TOTALS: Readonly<Record<string, number>> = {
  accounting: 25,
  "ai-engineering": 19,
  "application-development": 31,
  "architecture-and-distributed-systems": 8,
  "computer-science": 13,
  "data-and-databases": 24,
  "erp-systems": 30,
  "infrastructure-and-operations": 10,
  "interview-preparation": 5,
  "product-and-leadership": 6,
  "programming-languages": 30,
  security: 9,
  "systems-and-networking": 7,
  "tools-and-practices": 13,
};

/**
 * Count a Markdown page's words: strip the frontmatter block, then count
 * whitespace-separated tokens (code included — the tech-docs/002 floors are
 * plan estimates over whole pages, so the guard measures whole pages too).
 */
export function countWords(markdown: string): number {
  const body = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  return body.split(/\s+/).filter((token) => token.length > 0).length;
}

/** The `## ` section headings of a Markdown page, in order. */
export function sectionHeadings(markdown: string): string[] {
  return markdown
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => line.slice(3).trim());
}

const NETWORK_URL = /https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i;

/**
 * A `run.yaml` performs a real network call when it names a non-local HTTP(S)
 * URL. Localhost URLs are fixture shims, not real network calls.
 */
export function hasNetworkCall(runYamlText: string): boolean {
  return NETWORK_URL.test(runYamlText);
}

/**
 * The access dates (`YYYY-MM-DD`) recorded in a course's `## References`
 * section (tech-docs/005: every version-specific claim carries one).
 */
export function parseReferenceAccessDates(markdown: string): string[] {
  const references = markdown.split(/^## References\s*$/m)[1] ?? "";
  const dates: string[] = [];
  for (const m of references.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)) {
    if (m[1] !== undefined) dates.push(m[1]);
  }
  return dates;
}
