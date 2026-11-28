// Independent local development steps over HTTP for the HTTP boundary adapter.
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { fetchText, statusOf } from "../support/http";

const { Given, When, Then } = createBdd();

// Behaviour corpus binding (contract C13). The HTTP home runs the whole local-development-http feature.
// @scenario specs/apps/ayokoding/web/behaviours/local-development/local-development-http.feature: *

When("a reader requests the asset {string}", async ({ request }, assetPath: string) => {
  await fetchText(request, assetPath);
});

Then("the asset responds with status {string}", async ({ request }, status: string) => {
  expect(statusOf(request)).toBe(Number(status));
});

// The real-corpus config starts its own server with no fixture selected, so the default corpus serves. The config,
// not a step, selects the server's corpus; these steps only record the precondition the config establishes.
Given("no fixture is selected", async () => {});

When("the rewrite starts with no fixture flag or fixture variable", async () => {});

Then("the lesson {string} answers with status {string}", async ({ request }, target: string, status: string) => {
  await fetchText(request, target);
  expect(statusOf(request)).toBe(Number(status));
});

// The fixture config starts its server with the parity fixture, so a fixture-only lesson answers from it.
Given("the {string} fixture is selected", async ({ request: _request }, fixture: string) => {
  expect(fixture).toBe("parity");
});

When("a reader requests the lesson {string}", async ({ request }, target: string) => {
  await fetchText(request, target);
});

Then("the lesson answers with status {string}", async ({ request }, status: string) => {
  expect(statusOf(request)).toBe(Number(status));
});
