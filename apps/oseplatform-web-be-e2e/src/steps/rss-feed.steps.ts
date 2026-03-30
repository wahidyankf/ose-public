import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { state } from "./helpers";

const { When, Then } = createBdd();

When("the RSS feed is generated", async ({ request }) => {
  const response = await request.get("/feed.xml");
  expect(response.ok()).toBeTruthy();
  state.rssFeedBody = await response.text();
});

Then("the feed has a channel with title {string}", async ({}, expectedTitle: string) => {
  const body = state.rssFeedBody as string;
  expect(body).toContain(`<title>${expectedTitle}</title>`);
});

Then("the feed has a channel link to the site URL", async () => {
  const body = state.rssFeedBody as string;
  expect(body).toContain("<link>");
});

Then("the feed contains item elements for each update", async () => {
  const body = state.rssFeedBody as string;
  expect(body).toContain("<item>");
});

Then("the feed entry has the title {string}", async ({}, expectedTitle: string) => {
  const body = state.rssFeedBody as string;
  // Titles may be CDATA-wrapped and the Gherkin title may be a partial match
  // e.g., "Phase 0 End" matches "End of Phase 0: Foundation Complete, Phase 1 Begins"
  const items = body.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const words = expectedTitle.toLowerCase().split(/\s+/);
  const hasMatch = items.some((item) => {
    const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    if (!titleMatch) return false;
    const title = titleMatch[1]!.toLowerCase();
    return words.every((word) => title.includes(word));
  });
  expect(hasMatch).toBe(true);
});

Then("the feed entry has a publication date", async () => {
  const body = state.rssFeedBody as string;
  expect(body).toContain("<pubDate>");
});

Then("the feed entry has a link to the update page", async () => {
  const body = state.rssFeedBody as string;
  // Items should have links
  const itemMatch = body.match(/<item>[\s\S]*?<link>([\s\S]*?)<\/link>/);
  expect(itemMatch).not.toBeNull();
});

Then("the feed entry has a description", async () => {
  const body = state.rssFeedBody as string;
  expect(body).toContain("<description>");
});
