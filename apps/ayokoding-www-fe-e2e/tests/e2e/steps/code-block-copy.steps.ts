// @scenario specs/apps/ayokoding/www/behaviours/frontend/content/code-block-copy.feature: A non-mermaid code block renders a copy button
// @scenario specs/apps/ayokoding/www/behaviours/frontend/content/code-block-copy.feature: A mermaid block renders no copy button
// @scenario specs/apps/ayokoding/www/behaviours/frontend/content/code-block-copy.feature: The copy button is labelled in Indonesian on the Indonesian site
// @scenario specs/apps/ayokoding/www/behaviours/frontend/content/code-block-copy.feature: Clicking copy places the verbatim annotated source on the clipboard
// @scenario specs/apps/ayokoding/www/behaviours/frontend/content/code-block-copy.feature: The copy button confirms success to the visitor
// @scenario specs/apps/ayokoding/www/behaviours/frontend/content/code-block-copy.feature: The copy button is reachable on a touch viewport without hovering
import { createBdd } from "playwright-bdd";
import { expect, test, type Page } from "@playwright/test";

const { Given, When, Then } = createBdd();

/**
 * Real, non-mermaid annotated Lua page. Example 59 (`pcall` + `error` with a table) is the FIRST
 * fenced code block on this page, so it is always the block `annotatedCodeBlock` below resolves to.
 * It carries several `-- =>` output annotations, making it a stable target for the verbatim-clipboard
 * and success-confirmation scenarios below (source:
 * `content/en/learn/courses/just-enough-lua/learning/advanced.md` — re-homed from
 * `fundamentally-strong/software-engineer/just-enough-lua/` by
 * `ayokoding-learning-path-01-url-restructure` Phase 2; the bundle — root AND every nested
 * sub-page, via `course-rehome.ts`'s `:path*` per-course redirect — now lives at this re-homed
 * `courses/<slug>` path, so this fixture references the canonical path directly rather than the
 * old `fundamentally-strong/software-engineer/<slug>/...` path that 308s here).
 */
const ANNOTATED_LUA_PAGE = "/en/learn/courses/just-enough-lua/learning/advanced";

/** The page's first `CodeBlock` wrapper (`data-slot="code-block"`, per `code-block.tsx`) whose source
 * contains a `-- =>` annotation — i.e. Example 59. */
function annotatedCodeBlock(page: Page) {
  return page.locator('[data-slot="code-block"]', { hasText: "-- =>" }).first();
}

/** That block's copy-to-clipboard button (`data-slot="code-block-copy"`, per `copy-button.tsx`). */
function copyButtonOf(page: Page) {
  return annotatedCodeBlock(page).locator('[data-slot="code-block-copy"]');
}

/** The block's visually-hidden, polite `<output>` live region (`copy-button.tsx`). */
function liveRegionOf(page: Page) {
  return annotatedCodeBlock(page).locator("output");
}

// --- Real e2e-level coverage for the three baseline rendering scenarios -------------------------
// (unit-level equivalents in apps/ayokoding-www/tests/unit/fe-steps/code-block-copy.steps.tsx
// render MarkdownRenderer directly in jsdom with fixed HTML; these bindings drive a real page in a
// real browser instead.)

const GOBUSTER_MERMAID_PAGE = "/en/learn/legacy/information-security/tools/gobuster/quick-start";
const ID_FIXTURE_CODE_BLOCK_PAGE = "/id/belajar/e2e-fixture-blok-kode";

Given("a visitor opens an English content page containing a fenced Lua code block", async ({ page }) => {
  await page.goto(ANNOTATED_LUA_PAGE);
});

Then("the code block displays a copy button", async ({ page }) => {
  await expect(copyButtonOf(page)).toBeVisible();
});

Given("a visitor opens a content page containing a mermaid fenced block", async ({ page }) => {
  await page.goto(GOBUSTER_MERMAID_PAGE);
});

Then("the mermaid block renders as a diagram with no copy button", async ({ page }) => {
  // MermaidDiagram (mermaid.tsx) never wraps its output in the CodeBlock primitive at all — it
  // renders a bare <div> containing the async-rendered <svg> once mermaid.render() resolves, so
  // "renders as a diagram" is proven by waiting for the real SVG rather than the pre/code fallback
  // MermaidDiagram shows before that promise settles.
  const diagramContainer = page.locator("#main-content div:has(> svg)").first();
  await expect(diagramContainer.locator("svg")).toBeVisible({ timeout: 15000 });
  await expect(diagramContainer.locator('[data-slot="code-block-copy"]')).toHaveCount(0);
});

Given("a visitor opens an Indonesian content page containing a fenced code block", async ({ page }) => {
  await page.goto(ID_FIXTURE_CODE_BLOCK_PAGE);
  await page.waitForLoadState("networkidle");
});

When("the accessibility tree is inspected", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Salin" })).toBeVisible();
});

Then('the copy button has the Indonesian accessible name "Salin"', async ({ page }) => {
  const button = page.getByRole("button", { name: "Salin" });
  await expect(button).toBeVisible();
});

// --- Cycle 2.5: verbatim annotated clipboard ----------------------------------------------------

Given(
  'a visitor is on a page whose Lua block contains "-- => output" annotations',
  async ({ page, context, browserName }) => {
    // `clipboard-read`/`clipboard-write` are Chromium-only CDP permissions (verified empirically:
    // Firefox/WebKit reject the grant with "Unknown permission"). CI already runs e2e chromium-only
    // (see `playwright.config.ts`), so this is a legitimate environment guard, not a suppressed
    // failure — local runs without `--project=chromium` skip cleanly instead of erroring.
    test.skip(browserName !== "chromium", "clipboard-read/clipboard-write permissions are Chromium-only");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(ANNOTATED_LUA_PAGE);
    await expect(annotatedCodeBlock(page)).toBeVisible();
  },
);

When("the visitor clicks that block's copy button", async ({ page }) => {
  // A real Playwright click moves the mouse over the button first, which is exactly what the CSS
  // `group-hover` reveal needs (`code-block.tsx`'s `opacity-0 ... group-hover:opacity-100`) — no
  // separate `.hover()` step required.
  await copyButtonOf(page).click();
});

Then(
  'the clipboard contains the block\'s source verbatim including the "-- => output" annotations',
  async ({ page }) => {
    // In-process extraction from the SAME rendered DOM node `CodeBlock`'s `code` prop was built from
    // (`getTextContent(pre)` in `markdown-renderer.tsx`) rather than a hard-coded string, so this
    // assertion stays robust to content edits.
    const expectedText = await annotatedCodeBlock(page).locator("pre").first().textContent();
    expect(expectedText).toContain("-- =>");

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    // Windows caveat (tech-docs.md "Verbatim Text Extraction — Newline Fidelity"): the W3C
    // `writeText` algorithm normatively rewrites `\n` -> `\r\n` on Windows before the bytes hit the
    // clipboard, so the on-clipboard bytes are not guaranteed byte-identical across OSes even though
    // the source itself is never trimmed/re-flowed. Normalizing CRLF -> LF before comparing keeps
    // this assertion green on a Windows CI runner or contributor machine.
    const normalizedClipboard = clipboardText.replace(/\r\n/g, "\n");

    expect(normalizedClipboard).toContain("-- =>");
    expect(normalizedClipboard).toBe(expectedText);
  },
);

// --- Cycle 2.6: Copied confirmation ---------------------------------------------------------------

Given("a visitor has clicked a code block's copy button", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "clipboard-read/clipboard-write permissions are Chromium-only");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(ANNOTATED_LUA_PAGE);
  // Wait for the block (and, transitively, React hydration of its "use client" CopyButton) before
  // clicking — Playwright's click() only waits for DOM actionability, not JS hydration, so a click
  // fired immediately after `goto` can land before the onClick handler is wired up and silently
  // no-op instead of copying.
  await expect(annotatedCodeBlock(page)).toBeVisible();
  await copyButtonOf(page).click();
});

When("the copy succeeds", async ({ page }) => {
  // `useCopyToClipboard` only flips `copied` true after `navigator.clipboard.writeText` RESOLVES —
  // deliberately never on rejection, so there is no false success. Waiting for the live region's
  // announcement here IS the "copy succeeds" signal, not an assumption that it will.
  await expect(liveRegionOf(page)).toHaveText("Copied");
});

Then('the button shows a "Copied" confirmation before reverting', async ({ page }) => {
  await expect(copyButtonOf(page).locator("svg.lucide-check")).toBeVisible();
  await expect(liveRegionOf(page)).toHaveText("Copied");

  // "...before reverting": `CopyButton`'s default `resetMs` is 2000ms (`copy-button.tsx`); confirm
  // the success state actually reverts within that window (plus margin for CI jitter).
  await expect(copyButtonOf(page).locator("svg.lucide-check")).toBeHidden({ timeout: 3000 });
  await expect(liveRegionOf(page)).toHaveText("", { timeout: 3000 });
});

// --- Cycle 2.7: reachable on a touch viewport -----------------------------------------------------

/** Bridges the touch-context `Page` created in the `Given` step to the later `When`/`Then` steps —
 * same per-scenario `WeakMap<Page, ...>` technique `resizable-sidebar.steps.ts` uses, keyed off the
 * scenario's own default `page` fixture (which is never navigated in this scenario). */
const touchPageByScenario = new WeakMap<Page, Page>();

// The parens around "no-hover" must be escaped: Cucumber Expressions treat bare `(text)` as an
// OPTIONAL group, not literal characters — unescaped, this pattern would match "...touch  viewport"
// (parens+word silently dropped) instead of the feature file's literal "...touch (no-hover) viewport".
Given("a visitor loads a content page on a touch \\(no-hover\\) viewport", async ({ page, browser }) => {
  // `hasTouch: true` alone makes Chromium, Firefox, AND WebKit all report `(hover: none)` /
  // `(pointer: coarse)` to CSS media queries (verified empirically against all three engines before
  // writing this step) — no CDP session or `isMobile` device emulation needed, so this stays within
  // the public `browser.newContext()` API this project's `playwright.config.ts` already exposes.
  const touchContext = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
  const touchPage = await touchContext.newPage();
  touchPageByScenario.set(page, touchPage);
  await touchPage.goto(ANNOTATED_LUA_PAGE);
});

When("the code block is rendered", async ({ page }) => {
  const touchPage = touchPageByScenario.get(page);
  if (!touchPage) throw new Error("no touch page recorded for this scenario — Given step did not run first");
  await expect(annotatedCodeBlock(touchPage)).toBeVisible();
});

Then("the copy button is visible without any hover interaction", async ({ page }) => {
  const touchPage = touchPageByScenario.get(page);
  if (!touchPage) throw new Error("no touch page recorded for this scenario — Given step did not run first");

  // No `.hover()`/`.click()` call anywhere in this scenario — the mouse never moves over the button.
  const button = copyButtonOf(touchPage);
  await expect(button).toBeVisible();
  // `toBeVisible()` alone would pass even at `opacity: 0` (Playwright's visibility check ignores
  // opacity); the actual CSS contract under test is the always-on `[@media(hover:none)]:opacity-100`
  // reveal (`code-block.tsx`), so assert the computed opacity directly.
  await expect(button).toHaveCSS("opacity", "1");

  await touchPage.context().close();
});
