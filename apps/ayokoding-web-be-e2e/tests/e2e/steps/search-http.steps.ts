// Locale-scoped search steps over HTTP for the HTTP boundary adapter. Result
// assertions use the real HTTP responses the search endpoint serves.
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { bodyOf, fetchText, statusOf } from "../support/http";

const { Given, When, Then } = createBdd();

// Behaviour corpus binding (contract C13). The HTTP home runs the whole search-http feature.
// @scenario specs/apps/ayokoding/web/behaviours/search/search-http.feature: *

Given("matching published content exists in both supported locales", async () => {
  // The parity fixture publishes the lesson in English and Indonesian.
});

When("a reader opens the search page for the matching term in one locale", async ({ request }) => {
  await fetchText(request, "/en/search?q=hello");
});

Then("the search page lists the matching results for that locale only", async ({ request }) => {
  expect(statusOf(request)).toBe(200);
  expect(bodyOf(request)).toContain("/en/learn/courses/go-basics/learning/hello-world");
  expect(bodyOf(request)).not.toContain("/id/");
});
