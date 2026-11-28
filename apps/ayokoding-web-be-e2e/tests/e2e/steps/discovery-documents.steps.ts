// Discovery document steps over HTTP for the HTTP boundary adapter.
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { bodyOf, fetchText, headerOf, statusOf } from "../support/http";
import { courseFile, courseRoute, frontmatterDescription, frontmatterTitle, lessonRoute } from "../support/witness";

const { Given, When, Then } = createBdd();

// Behaviour corpus binding (contract C13). The HTTP home runs the whole feature; no scenario is exempt.
// @scenario specs/apps/ayokoding/web/behaviours/discovery/discovery-documents.feature: *

When("a reader requests a published content page", async ({ request }) => {
  await fetchText(request, courseRoute);
});

Then("its HTML contains the current title, description, and canonical URL", async ({ request }) => {
  expect(statusOf(request)).toBe(200);
  expect(bodyOf(request)).toContain(frontmatterTitle(courseFile));
  expect(bodyOf(request)).toContain(`<meta name="description" content="${frontmatterDescription(courseFile)}"`);
  expect(bodyOf(request)).toContain('rel="canonical"');
  expect(bodyOf(request)).toContain(courseRoute);
});

Then("alternate-language links identify only available translations", async ({ request }) => {
  expect(bodyOf(request)).toContain('hreflang="id"');
  expect(bodyOf(request)).toContain("/id");
  expect(bodyOf(request)).not.toContain('hreflang="xx"');
});

Given("the corpus contains published pages, draft pages, and a removed page", async () => {
  // The real corpus publishes lessons and has no draft-note or removed-page route.
});

When("a crawler requests the sitemap", async ({ request }) => {
  await fetchText(request, "/sitemap.xml", { headers: { Accept: "application/xml" } });
});

Then("it receives a successful XML sitemap response", async ({ request }) => {
  expect(statusOf(request)).toBe(200);
  expect(headerOf(request, "content-type")).toBe("application/xml; charset=utf-8");
  expect(bodyOf(request)).toContain("<urlset");
});

Then("the sitemap lists canonical published routes", async ({ request }) => {
  expect(bodyOf(request)).toContain(lessonRoute);
});

Then("draft and removed routes are absent", async ({ request }) => {
  expect(bodyOf(request)).not.toContain("draft-note");
  expect(bodyOf(request)).not.toContain("removed-page");
});

When("a reader requests the RSS feed", async ({ request }) => {
  await fetchText(request, "/feed.xml", { headers: { Accept: "application/rss+xml" } });
});

Then("it receives a successful XML feed response", async ({ request }) => {
  expect(statusOf(request)).toBe(200);
  expect(bodyOf(request)).toContain("<rss");
});

Then("feed entries have the existing ordering, metadata, and canonical destinations", async ({ request }) => {
  for (const marker of ["<item>", "https://ayokoding.example/en/learn/"]) {
    expect(bodyOf(request)).toContain(marker);
  }
  expect(bodyOf(request)).not.toContain("Draft");
});

Then("draft pages are absent", async ({ request }) => {
  expect(bodyOf(request)).not.toContain("draft-note");
});

When("a crawler requests the robots document", async ({ request }) => {
  await fetchText(request, "/robots.txt", { headers: { Accept: "text/plain" } });
});

Then("it receives a successful plain-text robots response", async ({ request }) => {
  expect(statusOf(request)).toBe(200);
  expect(headerOf(request, "content-type")).toBe("text/plain; charset=utf-8");
});

Then("the crawling directives and sitemap reference match the current site contract", async ({ request }) => {
  for (const marker of ["User-agent: *", "Allow: /", "Sitemap: /sitemap.xml"]) {
    expect(bodyOf(request)).toContain(marker);
  }
});
