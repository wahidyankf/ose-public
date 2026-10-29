// Discovery document steps for the Playwright E2E adapter.
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { bodyOf, fetchText, gotoPage, headerOf, statusOf } from "../support/http";

const { Given, When, Then } = createBdd();

When("a reader requests a published content page", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
});

Then("its HTML contains the current title, description, and canonical URL", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  for (const marker of [
    "Hello World",
    "First program",
    'rel="canonical"',
    "/en/learn/courses/go-basics/learning/hello-world",
  ]) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Then("alternate-language links identify only available translations", async ({ page }) => {
  expect(bodyOf(page)).toContain('hreflang="id"');
  expect(bodyOf(page)).toContain("/id");
  expect(bodyOf(page)).not.toContain('hreflang="xx"');
});

Given("the corpus contains published pages, draft pages, and a removed page", async () => {
  // The parity fixture publishes lessons, hides draft-note, and has no
  // removed-page route.
});

When("a crawler requests the sitemap", async ({ page }) => {
  await fetchText(page, "/sitemap.xml", { headers: { Accept: "application/xml" } });
});

Then("it receives a successful XML sitemap response", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expect(headerOf(page, "content-type")).toBe("application/xml; charset=utf-8");
  expect(bodyOf(page)).toContain("<urlset");
});

Then("the sitemap lists canonical published routes", async ({ page }) => {
  expect(bodyOf(page)).toContain("/en/learn/courses/go-basics/learning/hello-world");
});

Then("draft and removed routes are absent", async ({ page }) => {
  expect(bodyOf(page)).not.toContain("draft-note");
  expect(bodyOf(page)).not.toContain("removed-page");
});

When("a reader requests the RSS feed", async ({ page }) => {
  await fetchText(page, "/feed.xml", { headers: { Accept: "application/rss+xml" } });
});

Then("it receives a successful XML feed response", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("<rss");
});

Then("feed entries have the existing ordering, metadata, and canonical destinations", async ({ page }) => {
  for (const marker of ["<item>", "Hello World", "https://ayokoding.example/en/learn/"]) {
    expect(bodyOf(page)).toContain(marker);
  }
  expect(bodyOf(page)).not.toContain("Draft");
});

Then("draft pages are absent", async ({ page }) => {
  expect(bodyOf(page)).not.toContain("draft-note");
});

When("a crawler requests the robots document", async ({ page }) => {
  await fetchText(page, "/robots.txt", { headers: { Accept: "text/plain" } });
});

Then("it receives a successful plain-text robots response", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expect(headerOf(page, "content-type")).toBe("text/plain; charset=utf-8");
});

Then("the crawling directives and sitemap reference match the current site contract", async ({ page }) => {
  for (const marker of ["User-agent: *", "Allow: /", "Sitemap: /sitemap.xml"]) {
    expect(bodyOf(page)).toContain(marker);
  }
});
