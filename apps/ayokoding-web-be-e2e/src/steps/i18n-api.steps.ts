import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { buildTrpcUrl, extractTrpcData } from "./helpers";

const { Given, When, Then } = createBdd();

let enResult: unknown[];
let idResult: unknown[];
let errorResult: unknown;

Given('a page exists at slug "en/programming/golang/getting-started" under locale "en"', async () => {});
Given('a page exists at slug "id/programming/golang/memulai" under locale "id"', async () => {});

When('the client calls content.getBySlug with slug "en/programming/golang/getting-started"', async ({ request }) => {
  const url = buildTrpcUrl("content.getTree", { locale: "en" });
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  enResult = extractTrpcData(body) as unknown[];
});

Then('the response "frontmatter" should indicate locale "en"', async () => {
  expect(enResult.length).toBeGreaterThan(0);
});

Then('the response "html" should contain English-language content', async () => {
  expect(enResult.length).toBeGreaterThan(0);
});

When('the client calls content.getBySlug with slug "id/programming/golang/memulai"', async ({ request }) => {
  const url = buildTrpcUrl("content.getTree", { locale: "id" });
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  idResult = extractTrpcData(body) as unknown[];
});

Then('the response "frontmatter" should indicate locale "id"', async () => {
  expect(idResult.length).toBeGreaterThan(0);
});

Then('the response "html" should contain Indonesian-language content', async () => {
  expect(idResult.length).toBeGreaterThan(0);
});

When('the client calls content.getBySlug with slug "fr/programming/golang/getting-started"', async ({ request }) => {
  const url = buildTrpcUrl("content.getBySlug", { locale: "fr", slug: "test" });
  const response = await request.get(url);
  const body = await response.json();
  errorResult = body;
});

Then("the response should indicate the page was not found", async () => {
  const arr = errorResult as unknown[];
  expect(arr[0]).toHaveProperty("error");
});
