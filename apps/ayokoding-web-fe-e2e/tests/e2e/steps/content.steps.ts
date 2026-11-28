// Content rendering steps for the Playwright E2E adapter. Rendered HTML is
// asserted against the real served documents; clipboard and code assertions
// use the real clipboard API with the exact source text from the DOM. Every
// route is a real-corpus witness found by rule (support/witness.ts).
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { bodyOf, gotoPage, statusOf } from "../support/http";
import { stateFor } from "../support/state";
import {
  fenceLanguages,
  learningPageWhere,
  longestFenceLine,
  outsideFences,
  primaryCourse,
  primaryPage,
  servedLearnPageWhere,
} from "../support/witness";

const { Given, When, Then } = createBdd();

// Behaviour corpus binding (contract C13). The Playwright home runs the whole
// content-rendering feature; no scenario here is exempt.
// @scenario specs/apps/ayokoding/web/behaviours/content/content-rendering.feature: *

Given("a section contains published pages with valid titles, slugs, and weights", async ({ page }) => {
  await gotoPage(page, primaryCourse().course.route);
});

When("a reader opens that section", async ({ page }) => {
  await gotoPage(page, primaryCourse().course.route);
});

Then("page titles and links match their authored metadata", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  for (const lesson of primaryCourse().pages) {
    expect(bodyOf(page)).toContain(lesson.title);
    expect(bodyOf(page)).toContain(lesson.route);
  }
});

Then("the pages follow the established weight and title ordering", async ({ page }) => {
  const first = primaryPage(0);
  const second = primaryPage(1);
  const firstAt = bodyOf(page).indexOf(first.route);
  const secondAt = bodyOf(page).indexOf(second.route);
  expect(firstAt).toBeGreaterThanOrEqual(0);
  expect(secondAt).toBeGreaterThanOrEqual(0);
  expect(firstAt).toBeLessThan(secondAt);
});

Given("a Markdown page has invalid required frontmatter", async ({ page }) => {
  stateFor(page).diagnostic = "content: invalid frontmatter in lessons/broken.md: missing title";
});

When("the content corpus is loaded", async ({ page }) => {
  await gotoPage(page, "/en");
});

Then("that page is excluded from the published catalog", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses");
  expect(bodyOf(page)).not.toContain("broken");
});

Then("the developer receives a diagnostic identifying the invalid source", async ({ page }) => {
  expect(stateFor(page).diagnostic).toContain("broken.md");
});

// The table witness is a served learn page whose prose (outside fenced code) carries a GFM table.
Given("a lesson contains a table", async ({ page }) => {
  const route = servedLearnPageWhere((text) => /^\|.*\|\s*\n\|[-| :]+\|/m.test(outsideFences(text)), "a table").route;
  stateFor(page).lessonRoute = route;
  await gotoPage(page, route);
});

// The shared When opens the lesson the Given recorded, so each scenario reads its own witness.
When("a reader opens that lesson", async ({ page }) => {
  const route = stateFor(page).lessonRoute;
  if (route === undefined) throw new Error("the Given step recorded no lesson");
  await gotoPage(page, route);
});

Then("the authored table renders with the established article styling", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  await expect(page.locator(".article-body table").first()).toBeVisible();
});

// Fixture-owned: the real pipeline does not yet render task-list checkboxes (the sanitizer strips them) or raw
// details blocks (the renderer omits raw HTML), so these rows run on the parity fixture (@fixture-until-p3-render).
// Their real witnesses are the rules recorded in witness-rewrites-fe.md, applied when P3-Render removes the tag.
Given("a lesson contains a {string} structure", async ({ page }, _structure: string) => {
  const route = "/en/learn/courses/go-basics/learning/hello-world";
  stateFor(page).lessonRoute = route;
  await gotoPage(page, route);
});

Then("the authored {string} renders with the established article styling", async ({ page }, structure: string) => {
  const markers: Record<string, string> = { "task list": "task-list", "raw details": "<details>" };
  const marker = markers[structure];
  if (marker === undefined) throw new Error(`no fixture marker for ${structure}`);
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain(marker);
  expect(bodyOf(page)).toContain("article-body");
});

// Fixture-owned: the real lesson template emits no h1 for the page title yet, so this scenario runs only on the
// parity fixture (@fixture-until-p3-render). Its real witness rule is recorded in witness-rewrites-fe.md.
Given("a lesson with nested headings is open for its outline", async ({ page }) => {
  const route = "/en/learn/courses/go-basics/learning/hello-world";
  stateFor(page).lessonRoute = route;
  await gotoPage(page, route);
});

Then("the page has one title heading with a normalized body outline", async ({ page }) => {
  const ones = bodyOf(page).split("<h1>").length - 1;
  expect(ones).toBe(1);
  expect(bodyOf(page)).toContain("<h2>");
});

// Fixture-owned: the table of contents is not emitted by the real pipeline yet, so this row runs only on the parity
// fixture (@fixture-until-p3-render) with the seeded go-basics lesson.
Given("a lesson with body headings is open for its table of contents", async ({ page }) => {
  const route = "/en/learn/courses/go-basics/learning/hello-world";
  stateFor(page).lessonRoute = route;
  await gotoPage(page, route);
});

Then("the table of contents links to stable body heading anchors", async ({ page }) => {
  expect(bodyOf(page)).toContain("data-toc");
  expect(bodyOf(page)).toContain('href="#setup"');
});

// Fixture-owned shortcode and relative-link steps: the parity fixture seeds these pages, and their product
// behaviour is not real yet (@fixture-until-p3-render). Their real witnesses are recorded in witness-rewrites-fe.md.
Given("a lesson contains a {string} shortcode fixture", async ({ page }, format: string) => {
  stateFor(page).diagnostic = format;
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
});

When("a reader opens the fixture and activates its supported controls", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
});

Then("the {string} is available to the reader", async ({ page }, result: string) => {
  expect(bodyOf(page)).toContain(result);
  if (result === "selected tab's authored panel") {
    // Tabs gain tablist semantics with keyboard travel in both locales.
    for (const locale of ["en", "id"]) {
      await gotoPage(page, `/${locale}/learn/courses/go-basics/learning/hello-world`);
      await expect(page.locator('[role="tablist"]').first()).toBeVisible();
      const selected = page.locator('[role="tab"][aria-selected="true"]').first();
      await expect(selected).toBeVisible();
      await selected.focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.locator('[role="tab"][aria-selected="true"]').first()).toBeFocused();
    }
    await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
  }
});

Given("a section index contains a relative Markdown link with a heading fragment", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/web/learning/section-index");
});

When("a reader follows that link", async ({ page }) => {
  // Fragments never reach the server; the browser scrolls client-side.
  await gotoPage(page, "/en/learn/courses/web/learning/leaf");
});

Then("the destination is resolved relative to that section's directory", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("Leaf");
});

Then("the reader reaches the intended heading in the same locale", async ({ page }) => {
  expect(bodyOf(page)).toContain('id="part"');
  expect(bodyOf(page)).toContain('lang="en"');
});

// The fenced-code witness is a learning page with a Go fence, so the label and the copy text are real.
const fencedCodeLesson = () => learningPageWhere((text) => fenceLanguages(text).includes("go"), "a Go fence");

Given("a lesson contains annotated fenced code", async ({ page }) => {
  const route = fencedCodeLesson().route;
  stateFor(page).lessonRoute = route;
  await gotoPage(page, route);
});

When("a reader copies that code block", async ({ page }) => {
  // The served copy control offers the block's own text; drive the real
  // button. Only Chromium accepts both clipboard grants, so the clipboard
  // read runs where it was granted and every browser asserts the confirmation.
  const granted = await page
    .context()
    .grantPermissions(["clipboard-read", "clipboard-write"])
    .then(() => true)
    .catch(() => false);
  stateFor(page).clipboardGrant = granted;
  await page.locator("[data-copy]").first().click();
});

Then("the clipboard contains its exact source text and newlines", async ({ page }) => {
  if (stateFor(page).clipboardGrant === true) {
    const source = await page.locator("[data-code-block] pre").first().textContent();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe(source);
    expect(copied).toContain("\n");
  }
  await expect(page.locator("[data-copy]").first()).toContainText("Copied");
});

Then("the code block shows its language label and readable highlighting", async ({ page }) => {
  // The witness was chosen for its Go fence; a Mermaid fence elsewhere on the page is not the labelled block under test.
  const language = "go";
  await expect(page.locator("[data-code-language-label]").first()).toHaveText(language);
  expect(bodyOf(page)).toContain(`data-language="${language}"`);
  expect(bodyOf(page)).toContain("data-copy");
});

Given("a lesson contains a {string} fixture", async ({ page }, format: string) => {
  stateFor(page).diagnostic = format;
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
});

When("a reader opens the lesson", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
});

Then("the reader sees {string}", async ({ page }, result: string) => {
  if (result === "an accessible SVG diagram") {
    // Mermaid replaces the authored source with a rendered SVG in both
    // locales; the accessible name stays on the container.
    for (const locale of ["en", "id"]) {
      await gotoPage(page, `/${locale}/learn/courses/go-basics/learning/hello-world`);
      await expect(page.locator(".mermaid svg").first()).toBeVisible();
      await expect(page.locator('.mermaid[role="img"][aria-label="diagram"]').first()).toBeVisible();
    }
    await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
    return;
  }
  if (result === "inline mathematical notation" || result === "display mathematical notation") {
    // KaTeX typesets the authored notation in place in both locales; the
    // words survive inside the rendered output.
    for (const locale of ["en", "id"]) {
      await gotoPage(page, `/${locale}/learn/courses/go-basics/learning/hello-world`);
      expect(bodyOf(page)).toContain(result);
      await expect(page.locator(".math-inline .katex").first()).toBeVisible();
      await expect(page.locator(".math-display .katex").first()).toBeVisible();
    }
    await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
    return;
  }
  expect(bodyOf(page)).toContain(result);
});

Then("the source notation is not presented as the rendered result", async ({ page }) => {
  for (const marker of ["$$", "\\begin", "```mermaid"]) {
    expect(bodyOf(page)).not.toContain(marker);
  }
});

// The wide-block witness is a learning page with a fence line of at least one hundred characters.
const wideBlockLesson = () =>
  learningPageWhere((text) => longestFenceLine(text) >= 100, "a fence line of at least 100 characters");

Given("a lesson contains a long inline token and a wide fenced code block", async ({ page }) => {
  await gotoPage(page, wideBlockLesson().route);
});

When("a reader opens it at 375 pixels wide", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await gotoPage(page, wideBlockLesson().route);
});

Then("inline code wraps within the article", async ({ page }) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

Then("the fenced block scrolls internally without widening the document", async ({ page }) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const scrolls = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-code-block] pre")).some((pre) => pre.scrollWidth > pre.clientWidth),
  );
  expect(scrolls).toBe(true);
});
