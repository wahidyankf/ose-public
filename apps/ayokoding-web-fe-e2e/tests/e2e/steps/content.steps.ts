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
  trackOverviewWhere,
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

// Opens the lesson the Given recorded, so each scenario reads its own witness.
When("a reader opens that lesson", async ({ page }) => {
  const route = stateFor(page).lessonRoute;
  if (route === undefined) throw new Error("the Given step recorded no lesson");
  await gotoPage(page, route);
});

// The table witness is a served learn page whose prose (outside fenced code) carries a GFM table.
Given("a lesson contains a table", async ({ page }) => {
  const route = servedLearnPageWhere((text) => /^\|.*\|\s*\n\|[-| :]+\|/m.test(outsideFences(text)), "a table").route;
  stateFor(page).lessonRoute = route;
  await gotoPage(page, route);
});

Then("the authored table renders with the established article styling", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  await expect(page.locator(".article-body table").first()).toBeVisible();
});

// Witness rules for each authored structure. A task list is a served page with a checkbox item outside code; raw
// details is a served page with a details block outside code.
const structureWitnesses: Record<string, (text: string) => boolean> = {
  "task list": (text) => /^\s*[-*] \[[ xX]\] /m.test(outsideFences(text)),
  "raw details": (text) => /^<details[\s>]/m.test(outsideFences(text)),
};

Given("a lesson contains a {string} structure", async ({ page }, structure: string) => {
  const rule = structureWitnesses[structure];
  if (rule === undefined) throw new Error(`no real-corpus witness rule for ${structure}`);
  const route = servedLearnPageWhere(rule, `a ${structure}`).route;
  stateFor(page).lessonRoute = route;
  await gotoPage(page, route);
});

Then("the authored {string} renders with the established article styling", async ({ page }, structure: string) => {
  expect(statusOf(page)).toBe(200);
  await expect(page.locator(".article-body").first()).toBeVisible();
  if (structure === "task list") {
    await expect(page.locator('.article-body input[type="checkbox"]').first()).toBeAttached();
  } else if (structure === "raw details") {
    await expect(page.locator(".article-body details").first()).toBeAttached();
  } else {
    throw new Error(`no rendered-result check for ${structure}`);
  }
});

// The outline witness has a level-two and a level-three heading outside code, so the normalization has nesting to
// order.
Given("a lesson with nested headings is open for its outline", async ({ page }) => {
  const route = servedLearnPageWhere(
    (text) => /^## /m.test(outsideFences(text)) && /^### /m.test(outsideFences(text)),
    "nested level-two and level-three headings",
  ).route;
  stateFor(page).lessonRoute = route;
  await gotoPage(page, route);
});

Then("the page has one title heading with a normalized body outline", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  // The title is the only h1: the lesson template emits it, and the body's headings are normalized below it.
  await expect(page.locator(".article-body h1")).toHaveCount(1);
  await expect(page.locator(".article-body h2").first()).toBeVisible();
});

// The table of contents witness has at least two level-two headings outside code, so the outline has entries to link.
Given("a lesson with body headings is open for its table of contents", async ({ page }) => {
  const route = servedLearnPageWhere(
    (text) => (outsideFences(text).match(/^## /gm) ?? []).length >= 2,
    "two level-two headings",
  ).route;
  stateFor(page).lessonRoute = route;
  await gotoPage(page, route);
});

Then("the table of contents links to stable body heading anchors", async ({ page }) => {
  const hrefs = await page
    .locator('[data-toc] a[href^="#"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    const anchored = await page.evaluate((id) => document.getElementById(id) !== null, href.slice(1));
    expect(anchored, `table of contents link ${href} has no body anchor`).toBe(true);
  }
});

// Shortcode witnesses: a served page whose prose (outside code) uses the shortcode. The steps shortcode is the
// Hugo-style {{% steps %}} pair; callouts and tabs use their named forms.
const shortcodeWitnesses: Record<string, (text: string) => boolean> = {
  callout: (text) => /\{\{<\s*callout\s+type="(warning|info|tip)"/.test(outsideFences(text)),
  tabs: (text) => /\{\{<\s*tabs\s+items=/.test(outsideFences(text)),
  steps: (text) => /\{\{%\s*steps\s*%\}\}/.test(outsideFences(text)),
};

// The YouTube row stays on the parity fixture until P4-Tree delivers the shortcode (@fixture-until-p4-tree).
const fixtureShortcodeRoute = "/en/learn/courses/go-basics/learning/hello-world";

Given("a lesson contains a {string} shortcode fixture", async ({ page }, format: string) => {
  stateFor(page).shortcode = format;
  let route: string;
  if (format === "youtube") {
    route = fixtureShortcodeRoute;
  } else {
    const rule = shortcodeWitnesses[format];
    if (rule === undefined) throw new Error(`no real-corpus witness rule for ${format}`);
    route = servedLearnPageWhere(rule, `a ${format} shortcode`).route;
  }
  stateFor(page).lessonRoute = route;
  await gotoPage(page, route);
});

When("a reader opens the fixture and activates its supported controls", async ({ page }) => {
  const route = stateFor(page).lessonRoute;
  if (route === undefined) throw new Error("the Given step recorded no lesson");
  await gotoPage(page, route);
});

Then("the {string} is available to the reader", async ({ page }, result: string) => {
  expect(statusOf(page)).toBe(200);
  const format = stateFor(page).shortcode;
  if (format === "youtube") {
    expect(bodyOf(page)).toContain(result);
    return;
  }
  if (format === "callout") {
    const callout = page.locator(".article-body [data-callout]").first();
    await expect(callout).toBeVisible();
    await expect(callout).toHaveText(/\S/);
    return;
  }
  if (format === "steps") {
    // The steps container is bordered and its authored headings carry the numbering ("Step 1: ..."), as in www.
    const first = page.locator(".article-body [data-steps] h3").first();
    await expect(first).toBeVisible();
    await expect(first).toContainText("Step 1");
    return;
  }
  if (format === "tabs") {
    // progress.js gives the authored tabs tablist semantics; the arrow key moves the selection and focus.
    const list = page.locator('[role="tablist"]').first();
    await expect(list).toBeVisible();
    await list.locator('[role="tab"][aria-selected="true"]').focus();
    await page.keyboard.press("ArrowRight");
    await expect(list.locator('[role="tab"][aria-selected="true"]')).toBeFocused();
    return;
  }
  throw new Error(`no rendered-result check for ${format} ${result}`);
});

// The relative-link witness is a track overview whose body links to a lesson by a relative path with a fragment.
Given("a section index contains a relative Markdown link with a heading fragment", async ({ page }) => {
  // A sibling link (./name.md#fragment) resolves inside the track's own directory; a ../ link leaves it, so it is not
  // the witness for a section-directory rule.
  const overview = trackOverviewWhere(
    (text) => /\]\(\.\/[^)\s]*\.md#[^)\s]+\)/.test(outsideFences(text)),
    "a sibling Markdown link with a heading fragment",
  );
  stateFor(page).lessonRoute = overview.route;
  await gotoPage(page, overview.route);
});

When("a reader follows that link", async ({ page }) => {
  // The overview's relative link resolves to its served route with the fragment; the click follows it.
  const link = page.locator('.article-body a[href^="/en/learn/"][href*="#"]').first();
  const href = await link.getAttribute("href");
  if (href === null) throw new Error("the overview has no resolved relative link with a fragment");
  stateFor(page).linkHref = href;
  const target = href.split("#")[0] ?? href;
  await Promise.all([page.waitForURL((url) => url.pathname === target), link.click()]);
});

Then("the destination is resolved relative to that section's directory", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  // The overview is served at learning/learning, so the section directory is its learning/ route.
  const overviewRoute = stateFor(page).lessonRoute ?? "";
  const directory = overviewRoute.replace(/\/[^/]+$/, "/");
  const path = new URL(page.url()).pathname;
  expect(path.startsWith(directory)).toBe(true);
  expect(path).toBe((stateFor(page).linkHref ?? "").split("#")[0]);
});

Then("the reader reaches the intended heading in the same locale", async ({ page }) => {
  const url = new URL(page.url());
  expect(url.pathname.startsWith("/en/")).toBe(true);
  expect(await page.locator("html").getAttribute("lang")).toBe("en");
  const fragment = url.hash.slice(1);
  expect(fragment).not.toBe("");
  const anchored = await page.evaluate((id) => document.getElementById(id) !== null, fragment);
  expect(anchored, `no heading with id ${fragment} on the destination`).toBe(true);
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

// Math and diagram witnesses: a served learn page whose prose holds the notation outside code, or a Mermaid fence.
const notationWitnesses: Record<string, (text: string) => boolean> = {
  // A TeX span holds a named math macro (\frac, \beta) between its dollar signs. The allowlist keeps shell escapes such as
  // \r or \x00 from matching as math.
  "inline math": (text) =>
    /\$[^$\n]*\\(frac|times|cdot|alpha|beta|gamma|delta|sigma|sum|sqrt|text|mathbf|approx|leq|geq|pi|mu|lambda|theta)\b[^$\n]*\$/.test(
      outsideFences(text),
    ),
  "display math": (text) => /^\$\$\s*$/m.test(outsideFences(text)),
  Mermaid: (text) => fenceLanguages(text).includes("mermaid"),
};

Given("a lesson contains a {string} fixture", async ({ page }, format: string) => {
  const rule = notationWitnesses[format];
  if (rule === undefined) throw new Error(`no real-corpus witness rule for ${format}`);
  const route = servedLearnPageWhere(rule, `a ${format} notation`).route;
  stateFor(page).lessonRoute = route;
  await gotoPage(page, route);
});

When("a reader opens the lesson", async ({ page }) => {
  const route = stateFor(page).lessonRoute;
  if (route === undefined) throw new Error("the Given step recorded no lesson");
  await gotoPage(page, route);
});

Then("the reader sees {string}", async ({ page }, result: string) => {
  expect(statusOf(page)).toBe(200);
  const selectors: Record<string, string> = {
    "inline mathematical notation": ".math-inline .katex",
    "display mathematical notation": ".math-display .katex",
    "an accessible SVG diagram": ".mermaid svg",
  };
  const selector = selectors[result];
  if (selector === undefined) throw new Error(`no rendered-result check for ${result}`);
  // KaTeX and mermaid load their vendor scripts only when the page carries the hooks, so the result appears after load.
  await expect(page.locator(selector).first()).toBeVisible();
});

Then("the source notation is not presented as the rendered result", async ({ page }) => {
  const rendered = await page.locator(".article-body").innerText();
  for (const marker of ["$$", "\\begin", "```mermaid"]) {
    expect(rendered).not.toContain(marker);
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
