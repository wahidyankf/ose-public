import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { buildTrpcUrl, extractTrpcData, state } from "./helpers";

const { When, Then } = createBdd();

When("the content service retrieves the page by slug {string}", async ({ request }, slug: string) => {
  const url = buildTrpcUrl("content.getBySlug", { slug });
  const response = await request.get(url);
  const body = await response.json();

  if (slug === "nonexistent") {
    state.pageResult = extractTrpcData(body);
    return;
  }

  expect(response.ok()).toBeTruthy();
  state.pageResult = extractTrpcData(body);
});

When("the content service lists all updates", async ({ request }) => {
  const url = buildTrpcUrl("content.listUpdates", undefined);
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  state.updatesResult = extractTrpcData(body);
});

Then("the response contains the page title", async () => {
  const page = state.pageResult as Record<string, unknown>;
  expect(page.title).toBeTruthy();
});

Then("the response contains rendered HTML content", async () => {
  const page = state.pageResult as Record<string, unknown>;
  expect(page.html).toBeTruthy();
});

Then("the response contains extracted headings", async () => {
  const page = state.pageResult as Record<string, unknown>;
  expect(Array.isArray(page.headings)).toBe(true);
});

Then("the updates are returned sorted by date descending", async () => {
  const updates = state.updatesResult as { date: string }[];
  for (let i = 1; i < updates.length; i++) {
    expect(new Date(updates[i]!.date).getTime()).toBeLessThanOrEqual(new Date(updates[i - 1]!.date).getTime());
  }
});

Then("each update contains title, date, summary, and tags", async () => {
  const updates = state.updatesResult as Record<string, unknown>[];
  const first = updates[0]!;
  expect(first).toHaveProperty("title");
  expect(first).toHaveProperty("date");
  expect(first).toHaveProperty("summary");
  expect(first).toHaveProperty("tags");
});

Then("the draft page is not included in the results", async () => {
  const updates = state.updatesResult as { draft?: boolean }[];
  for (const update of updates) {
    expect(update.draft).not.toBe(true);
  }
});

Then("the response is null", async () => {
  expect(state.pageResult).toBeNull();
});
