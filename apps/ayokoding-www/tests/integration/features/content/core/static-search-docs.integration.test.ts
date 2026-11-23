import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { t } from "@/features/i18n/core/translations";
import { staticSearchDocs } from "../../../../../src/features/content/core/static-search-docs";

// Regression test for Rule-15 UWT-001: the site's search index was built entirely from markdown
// `content/` files, so app-route pages with no markdown file (the Tools section) never appeared in
// search results for any query, including exact matches on the tool's own name. `staticSearchDocs`
// is the fix — a small, explicit, pure list of extra docs merged into the index by
// `shell/service.ts`.
describe("staticSearchDocs", () => {
  it("produces one doc per (locale x tool) pair", () => {
    const docs = staticSearchDocs();
    expect(docs).toHaveLength(4);
  });

  it("includes the AI benchmark tool for both locales, with slug matching its real route", () => {
    const docs = staticSearchDocs();
    const en = docs.find((d) => d.locale === "en" && d.slug === "tools/ai-benchmark");
    const id = docs.find((d) => d.locale === "id" && d.slug === "tools/ai-benchmark");

    expect(en).toBeDefined();
    expect(en?.title).toBe(t("en", "toolsPageAiBenchLink"));
    expect(en?.content).toBe(t("en", "toolsPageAiBenchDesc"));

    expect(id).toBeDefined();
    expect(id?.title).toBe(t("id", "toolsPageAiBenchLink"));
    expect(id?.content).toBe(t("id", "toolsPageAiBenchDesc"));
  });

  it("includes the cost-of-living calculator tool for both locales, with slug matching its real route", () => {
    const docs = staticSearchDocs();
    const en = docs.find((d) => d.locale === "en" && d.slug === "tools/cost-of-living-calculator");
    const id = docs.find((d) => d.locale === "id" && d.slug === "tools/cost-of-living-calculator");

    expect(en).toBeDefined();
    expect(en?.title).toBe(t("en", "toolsPageCalcLink"));

    expect(id).toBeDefined();
    expect(id?.title).toBe(t("id", "toolsPageCalcLink"));
  });

  it("gives each doc a unique, locale-prefixed id", () => {
    const docs = staticSearchDocs();
    const ids = docs.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("en:tools/ai-benchmark");
    expect(ids).toContain("id:tools/ai-benchmark");
  });
});

// ── Parity regression: TOOL_ENTRIES must stay in sync with the tools index page's own nav links
// (pr-review-synthesis-maker MEDIUM finding, PR #122 cycle 1) ──────────────────────────────────
//
// `TOOL_ENTRIES` is a hand-maintained mirror of `tools/page.tsx`'s `<Link>` list, with no enforced
// parity — a new tool linked from the nav but never added here would reproduce UWT-001 (a tool
// prominently linked but unfindable in search), and the four-doc-count test above is
// self-referential (it names both current tools explicitly, so it cannot catch a third). This test
// reads `tools/page.tsx` as TEXT (no JSX parser, mirroring `band-tokens.unit.test.ts`'s own
// text-based approach for the same reason: resilient to formatting churn) and extracts every
// `href="./tools/<slug>"` link, then asserts each one has a matching `TOOL_ENTRIES` slug — NOT the
// reverse (a TOOL_ENTRIES-only entry with no nav link yet is not this test's concern).
describe("TOOL_ENTRIES parity with the tools index page's nav links", () => {
  // Nx's `test:unit` target sets `cwd = {projectRoot}` (apps/ayokoding-www) — see
  // `band-tokens.unit.test.ts` for the same convention and its rationale.
  const toolsIndexPagePath = join(process.cwd(), "src", "app", "[locale]", "tools", "page.tsx");
  const toolsIndexSource = readFileSync(toolsIndexPagePath, "utf8");

  const navSlugs = Array.from(toolsIndexSource.matchAll(/href="\.\/(tools\/[a-z0-9-]+)"/g)).map((m) => m[1]);

  it("sanity: the tools index page's source links at least one tools/* route", () => {
    expect(navSlugs.length).toBeGreaterThan(0);
  });

  it.each(navSlugs)("every tools/page.tsx nav link (%s) has a matching TOOL_ENTRIES slug", (slug) => {
    const docs = staticSearchDocs();
    const matches = docs.some((d) => d.slug === slug);
    expect(matches, `no staticSearchDocs entry has slug "${slug}" — TOOL_ENTRIES is missing it`).toBe(true);
  });
});
