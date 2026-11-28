// Shared learning content rendering steps over HTTP for the HTTP boundary adapter.
// Every step is a GET through the request context, and assertions read the
// served documents. No step drives a browser.
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { bodyOf, fetchText, statusOf } from "../support/http";
import { startOwnedBinary } from "../support/servers";
import { stateFor, trackOwned } from "../support/state";
import { frontmatterTitle, lessonFile, lessonRoute } from "../support/witness";

const { Given, When, Then } = createBdd();

// Behaviour corpus binding (contract C13). The HTTP home runs the whole content-rendering-http feature.
// @scenario specs/apps/ayokoding/web/behaviours/content/content-rendering-http.feature: *

Given("a published Markdown lesson exists in the shared corpus", async ({ request }) => {
  await fetchText(request, lessonRoute);
});

When("a reader requests its route without running browser scripts", async ({ request }) => {
  await fetchText(request, lessonRoute);
});

Then("the response contains the lesson title and readable article body", async ({ request }) => {
  expect(statusOf(request)).toBe(200);
  expect(bodyOf(request)).toContain(frontmatterTitle(lessonFile));
  expect(bodyOf(request)).toContain("article-body");
});

Then("the response does not depend on a client-side build artifact", async ({ request }) => {
  for (const marker of ["_next/", "next/dist", "__NEXT_DATA__"]) {
    expect(bodyOf(request)).not.toContain(marker);
  }
});

Given("a lesson is marked as a draft", async () => {
  // The parity fixture marks draft-note as a draft.
});

Given("draft viewing is disabled", async () => {
  // The suite server runs without AYOKODING_WEB_SHOW_DRAFTS.
});

// The draft route is requested on the scenario's own server when a Given
// started one (draft viewing on); otherwise on the suite server.
When("a reader requests the draft lesson's route", async ({ request }) => {
  const base = stateFor(request).spawnedUrl ?? "";
  await fetchText(request, `${base}/en/learn/courses/go-basics/learning/draft-note`);
});

When("a reader searches the corpus", async ({ request }) => {
  await fetchText(request, "/en/search?q=draft");
});

Given("AYOKODING_WEB_SHOW_DRAFTS is set to true for the app", async ({ request }) => {
  const spawned = await startOwnedBinary({
    AYOKODING_WEB_FIXTURE: "parity",
    AYOKODING_WEB_SHOW_DRAFTS: "true",
  });
  trackOwned(request, spawned);
  stateFor(request).spawnedUrl = spawned.url;
});

Then("the draft lesson's page shows its title and body", async ({ request }) => {
  expect(statusOf(request)).toBe(200);
  expect(bodyOf(request)).toContain("<h1>Draft</h1>");
});

Then("the lesson is absent from the public results", async ({ request }) => {
  expect(bodyOf(request)).not.toContain("Draft");
});

Then("its direct route returns not found", async ({ request }) => {
  await fetchText(request, "/en/learn/courses/go-basics/learning/draft-note");
  expect(statusOf(request)).toBe(404);
});

When("a reader requests a nonexistent content route in a supported locale", async ({ request }) => {
  await fetchText(request, "/en/learn/courses/go-basics/learning/nope");
});

Then("the response status is 404", async ({ request }) => {
  expect(statusOf(request)).toBe(404);
});

Then("the reader sees a localized not-found page with usable navigation", async ({ request }) => {
  for (const marker of ['lang="en"', "data-usable-nav", "/en/learn/courses"]) {
    expect(bodyOf(request)).toContain(marker);
  }
});
