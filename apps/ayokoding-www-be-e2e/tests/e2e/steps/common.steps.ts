import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { buildTrpcUrl, extractTrpcData, state } from "./helpers";

const { Given, When } = createBdd();

function splitContentSlug(slugWithLocale: string): { locale: string; slug: string } {
  const [locale = "", ...slugParts] = slugWithLocale.split("/");
  return { locale, slug: slugParts.join("/") };
}

Given("the API is running", async ({ request }) => {
  const response = await request.get(buildTrpcUrl("meta.health", undefined));
  expect(response.ok()).toBeTruthy();
  expect(extractTrpcData(await response.json())).toMatchObject({ status: "ok" });
});

Given("a published page exists at slug {string}", async ({ request }, slugWithLocale: string) => {
  const response = await request.get(buildTrpcUrl("content.getBySlug", splitContentSlug(slugWithLocale)));
  expect(response.ok()).toBeTruthy();
  expect(extractTrpcData(await response.json())).toMatchObject({ draft: false });
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
    const expectedWeights = [firstWeight, secondWeight, thirdWeight, fourthWeight, fifthWeight];
    const { locale, slug: parentSlug } = splitContentSlug(slugWithLocale);
    const response = await request.get(buildTrpcUrl("content.listChildren", { locale, parentSlug }));
    expect(response.ok()).toBeTruthy();
    const children = extractTrpcData(await response.json()) as { weight: number }[];
    expect(children.map(({ weight }) => weight)).toEqual([...expectedWeights].sort((a, b) => a - b));
  },
);

Given("a published page exists at slug {string} with a fenced code block", async ({ request }, slugWithLocale) => {
  const response = await request.get(buildTrpcUrl("content.getBySlug", splitContentSlug(slugWithLocale)));
  expect(response.ok()).toBeTruthy();
  const page = extractTrpcData(await response.json()) as { draft: boolean; html: string };
  expect(page).toMatchObject({ draft: false });
  expect(page.html).toContain("<code");
});

Given("a page exists at slug {string} under locale {string}", async ({ request }, slugWithLocale, locale) => {
  const input = splitContentSlug(slugWithLocale);
  expect(input.locale).toBe(locale);
  const response = await request.get(buildTrpcUrl("content.getBySlug", input));
  expect(response.ok()).toBeTruthy();
  expect(extractTrpcData(await response.json())).toMatchObject({ locale });
});

When("the client calls content.getTree with locale {string}", async ({ request }, locale: string) => {
  const response = await request.get(buildTrpcUrl("content.getTree", { locale }));
  expect(response.ok()).toBeTruthy();
  state.treeResult = extractTrpcData(await response.json());
});

When("the client calls content.getBySlug with slug {string}", async ({ request }, slugWithLocale: string) => {
  const response = await request.get(buildTrpcUrl("content.getBySlug", splitContentSlug(slugWithLocale)));
  const body = await response.json();
  if (response.ok()) {
    state.pageResult = extractTrpcData(body);
    state.errorResult = undefined;
  } else {
    state.pageResult = undefined;
    state.errorResult = body;
  }
});

When("the client calls content.listChildren with slug {string}", async ({ request }, slugWithLocale: string) => {
  const { locale, slug: parentSlug } = splitContentSlug(slugWithLocale);
  const response = await request.get(buildTrpcUrl("content.listChildren", { locale, parentSlug }));
  expect(response.ok()).toBeTruthy();
  state.childrenResult = extractTrpcData(await response.json());
});
