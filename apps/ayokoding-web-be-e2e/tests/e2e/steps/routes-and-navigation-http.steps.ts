// Canonical routes and learning navigation steps over HTTP for the HTTP boundary adapter.
// Redirect assertions use the request API without following redirects, so the
// suite observes the exact 308 status and Location the server sends.
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { bodyOf, fetchText, locationOf, statusOf } from "../support/http";
import { stateFor } from "../support/state";

const { When, Then } = createBdd();

// Behaviour corpus binding (contract C13). The HTTP home runs the whole routes-and-navigation-http feature.
// @scenario specs/apps/ayokoding/web/behaviours/navigation/routes-and-navigation-http.feature: *

When("a visitor requests the root URL", async ({ request }) => {
  await fetchText(request, "/", { maxRedirects: 0 });
});

Then("the visitor is redirected to {string}", async ({ request }, destination: string) => {
  expect(statusOf(request)).toBe(308);
  expect(locationOf(request)).toBe(destination);
});

Then("the redirect does not loop", async ({ request }) => {
  await fetchText(request, "/en");
  expect(statusOf(request)).toBe(200);
});

When("a visitor requests {string}", async ({ request }, source: string) => {
  stateFor(request).lastUrl = source;
  await fetchText(request, source, { maxRedirects: 0 });
});

Then("the response permanently redirects with status 308 to {string}", async ({ request }, destination: string) => {
  expect(statusOf(request)).toBe(308);
  expect(locationOf(request)).toBe(destination);
});

// The query check follows the requested URL: a request without a query has
// nothing to preserve, so the step passes.
Then("the query string is preserved", async ({ request }) => {
  const requested = stateFor(request).lastUrl ?? "";
  const index = requested.indexOf("?");
  if (index < 0) return;
  expect(locationOf(request).endsWith(requested.slice(index))).toBe(true);
});

Then("the redirect does not depend on the old page still existing", async ({ request }) => {
  await fetchText(request, "/en/learn/courses/go-basics/learning/hello-world");
  expect(statusOf(request)).toBe(200);
});

When("a reader opens a legacy archived page", async ({ request }) => {
  await fetchText(request, "/en/learn/legacy/software-engineering");
});

Then("the archived page shows its title and canonical body", async ({ request }) => {
  expect(statusOf(request)).toBe(200);
  const body = bodyOf(request);
  expect(body).toContain("Legacy Software Engineering");
  expect(body).toContain("Archived canonical content");
  expect(body).toContain('lang="en"');
});
