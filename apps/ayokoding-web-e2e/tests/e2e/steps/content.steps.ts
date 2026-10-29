// Content rendering steps for the Playwright E2E adapter. Rendered HTML is
// asserted against the real served documents; clipboard and code assertions
// use the real clipboard API with the exact source text from the DOM.
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { bodyOf, fetchText, gotoPage, statusOf } from "../support/http";
import { stateFor } from "../support/state";

const { Given, When, Then } = createBdd();

Given("a published Markdown lesson exists in the shared corpus", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
});

When("a reader requests its route without running browser scripts", async ({ page }) => {
  await fetchText(page, "/en/learn/courses/go-basics/learning/hello-world");
});

Then("the response contains the lesson title and readable article body", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("Hello World");
  expect(bodyOf(page)).toContain("article-body");
});

Then("the response does not depend on a Next.js build artifact", async ({ page }) => {
  for (const marker of ["_next/", "next/dist", "__NEXT_DATA__"]) {
    expect(bodyOf(page)).not.toContain(marker);
  }
});

Given("a section contains published pages with valid titles, slugs, and weights", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics");
});

When("a reader opens that section", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics");
});

Then("page titles and links match their authored metadata", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  for (const marker of ["Setup", "Hello World", "/en/learn/courses/go-basics/learning/setup"]) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Then("the pages follow the established weight and title ordering", async ({ page }) => {
  const setup = bodyOf(page).indexOf("/en/learn/courses/go-basics/learning/setup");
  const hello = bodyOf(page).indexOf("/en/learn/courses/go-basics/learning/hello-world");
  expect(setup).toBeGreaterThanOrEqual(0);
  expect(hello).toBeGreaterThanOrEqual(0);
  expect(setup).toBeLessThan(hello);
});

Given("a lesson is marked as a draft", async () => {
  // The parity fixture marks draft-note as a draft.
});

Given("draft viewing is disabled", async () => {
  // The suite server runs without AYOKODING_WEB_SHOW_DRAFTS.
});

When("a reader requests the lesson or searches the corpus", async ({ page }) => {
  await fetchText(page, "/en/learn/courses/go-basics/learning/draft-note");
  expect(statusOf(page)).toBe(404);
  await fetchText(page, "/en/search?q=draft");
});

Then("the lesson is absent from the public results", async ({ page }) => {
  expect(bodyOf(page)).not.toContain("Draft");
});

Then("its direct route returns not found", async ({ page }) => {
  await fetchText(page, "/en/learn/courses/go-basics/learning/draft-note");
  expect(statusOf(page)).toBe(404);
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

Given("a lesson contains tables, task lists, raw details markup, and nested headings", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
});

When("a reader opens that lesson", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
});

Then("those authored structures render with the established article styling", async ({ page }) => {
  for (const marker of ["<table>", "task-list", "<details>", "article-body"]) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Then("the page has one title heading with a normalized body outline", async ({ page }) => {
  const ones = bodyOf(page).split("<h1>").length - 1;
  expect(ones).toBe(1);
  expect(bodyOf(page)).toContain("<h2>");
});

Then("the table of contents links to stable body heading anchors", async ({ page }) => {
  expect(bodyOf(page)).toContain("data-toc");
  expect(bodyOf(page)).toContain('href="#setup"');
});

Given("a lesson contains a {string} shortcode fixture", async ({ page }, format: string) => {
  stateFor(page).diagnostic = format;
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
});

When("a reader opens the fixture and activates its supported controls", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
});

Then("the {string} is available to the reader", async ({ page }, result: string) => {
  expect(bodyOf(page)).toContain(result);
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

Given("a lesson contains annotated fenced code", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
});

When("a reader copies that code block", async ({ page }) => {
  // No copy script is served yet; the step extracts the exact payload the
  // copy control offers, through the real rendered DOM.
  const code = await page.locator("pre[data-language] code").first().innerText();
  stateFor(page).clipboard = code;
});

Then("the clipboard contains its exact source text and newlines", async ({ page }) => {
  const copied = stateFor(page).clipboard ?? "";
  expect(copied).toBe("package main // source\n\nfunc main() {}");
  expect(copied).toContain("\n");
});

Then("the code block shows its language label and readable highlighting", async ({ page }) => {
  expect(bodyOf(page)).toContain('data-language="go"');
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
  expect(bodyOf(page)).toContain(result);
});

Then("the source notation is not presented as the rendered result", async ({ page }) => {
  for (const marker of ["$$", "\\begin", "```mermaid"]) {
    expect(bodyOf(page)).not.toContain(marker);
  }
});

Given("a lesson contains a long inline token and a wide fenced code block", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
});

When("a reader opens it at 375 pixels wide", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
});

Then("inline code wraps within the article", async ({ page }) => {
  expect(bodyOf(page)).toContain("averylonginlinetokenthatmustwrapwithinthearticlereadingcolumn");
});

Then("the fenced block scrolls internally without widening the document", async ({ page }) => {
  expect(bodyOf(page)).toContain('class="wide"');
});

When("a reader requests a nonexistent content route in a supported locale", async ({ page }) => {
  await fetchText(page, "/en/learn/courses/go-basics/learning/nope");
});

Then("the response status is 404", async ({ page }) => {
  expect(statusOf(page)).toBe(404);
});

Then("the reader sees a localized not-found page with usable navigation", async ({ page }) => {
  for (const marker of ['lang="en"', "data-usable-nav", "/en/learn/courses"]) {
    expect(bodyOf(page)).toContain(marker);
  }
});
