// Independent local development steps over HTTP for the HTTP boundary adapter.
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { fetchText, statusOf } from "../support/http";

const { When, Then } = createBdd();

// Behaviour corpus binding (contract C13). The HTTP home runs the whole local-development-http feature.
// @scenario specs/apps/ayokoding/web/behaviours/local-development/local-development-http.feature: *

When("a reader requests the asset {string}", async ({ request }, assetPath: string) => {
  await fetchText(request, assetPath);
});

Then("the asset responds with status {string}", async ({ request }, status: string) => {
  expect(statusOf(request)).toBe(Number(status));
});
