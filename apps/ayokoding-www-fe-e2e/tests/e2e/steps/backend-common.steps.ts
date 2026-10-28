import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { buildTrpcUrl, extractTrpcData, backendState } from "./backend-helpers";

const { Given, When } = createBdd();

// Shared Background step for every backend/**/*.feature scenario — the live server is already up
// via this project's own `webServer` (playwright.config.ts), the same server the frontend e2e
// scenarios in this project drive.
Given("the API is running", async ({ request }) => {
  const response = await request.get(buildTrpcUrl("meta.health", undefined));
  expect(response.ok()).toBe(true);
  expect(extractTrpcData(await response.json())).toEqual({ status: "ok" });
});

Given("a published page exists at slug {string}", async ({ request }, slugWithLocale: string) => {
  const [locale, ...segments] = slugWithLocale.split("/");
  const response = await request.get(buildTrpcUrl("content.getBySlug", { locale, slug: segments.join("/") }));
  expect(response.ok()).toBe(true);
  expect(extractTrpcData(await response.json())).toMatchObject({ locale, draft: false });
});
Given(
  "a section exists at slug {string} with child pages weighted {int}, {int}, {int}, {int}, and {int}",
  async (
    { request },
    slugWithLocale: string,
    firstWeight: number,
    secondWeight: number,
    thirdWeight: number,
    fourthWeight: number,
    fifthWeight: number,
  ) => {
    const declaredWeights = [firstWeight, secondWeight, thirdWeight, fourthWeight, fifthWeight];
    const [locale, ...segments] = slugWithLocale.split("/");
    const response = await request.get(
      buildTrpcUrl("content.listChildren", { locale, parentSlug: segments.join("/") }),
    );
    expect(response.ok()).toBe(true);
    const children = extractTrpcData(await response.json()) as Array<{ weight: number }>;
    expect(children.map(({ weight }) => weight)).toEqual([...declaredWeights].sort((left, right) => left - right));
  },
);
Given(
  "a published page exists at slug {string} with a fenced code block",
  async ({ request }, slugWithLocale: string) => {
    const [locale, ...segments] = slugWithLocale.split("/");
    const response = await request.get(buildTrpcUrl("content.getBySlug", { locale, slug: segments.join("/") }));
    expect(response.ok()).toBe(true);
    expect(extractTrpcData(await response.json())).toMatchObject({ html: expect.stringContaining("<code") });
  },
);
Given(
  "a page exists at slug {string} under locale {string}",
  async ({ request }, slugWithLocale: string, expectedLocale: string) => {
    const [locale, ...segments] = slugWithLocale.split("/");
    expect(locale).toBe(expectedLocale);
    const response = await request.get(buildTrpcUrl("content.getBySlug", { locale, slug: segments.join("/") }));
    expect(response.ok()).toBe(true);
    expect(extractTrpcData(await response.json())).toMatchObject({ locale: expectedLocale });
  },
);

// Shared: getTree for locale {string}
When("the client calls content.getTree with locale {string}", async ({ request }, locale: string) => {
  const url = buildTrpcUrl("content.getTree", { locale });
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  backendState.treeResult = extractTrpcData(body);
});

// Shared: getBySlug with slug {string}. Mirrors ayokoding-www-be-e2e's identical binding: the
// Gherkin's own example slugs name real, known-good content (a course lesson page such as
// learn/courses/just-enough-go/learning/beginner) for the "happy path" case, while the
// invalid-locale/bad-request/draft cases exercise the tRPC endpoint's real error responses.
When("the client calls content.getBySlug with slug {string}", async ({ request }, slugStr: string) => {
  const parts = slugStr.split("/");
  const locale = parts[0];
  const slug = parts.slice(1).join("/");

  if (locale !== "en" && locale !== "id") {
    const url = buildTrpcUrl("content.getBySlug", { locale, slug: slug || "test" });
    const response = await request.get(url);
    const body = await response.json();
    backendState.errorResult = body;
    return;
  }

  if (slugStr.includes("does/not/exist")) {
    const url = buildTrpcUrl("content.getBySlug", { locale, slug });
    const response = await request.get(url);
    const body = await response.json();
    backendState.errorResult = body;
    return;
  }

  const url = buildTrpcUrl("content.getBySlug", { locale, slug });
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const data = extractTrpcData(body);
  backendState.pageResult = data;
  backendState[`${locale}Result`] = data;
});

// Shared: listChildren with slug {string}
When("the client calls content.listChildren with slug {string}", async ({ request }, slugWithLocale: string) => {
  const [locale, ...segments] = slugWithLocale.split("/");
  const url = buildTrpcUrl("content.listChildren", { locale, parentSlug: segments.join("/") });
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  backendState.childrenResult = extractTrpcData(body);
});
