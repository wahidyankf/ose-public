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
  // Titles may be CDATA-wrapped: <title><![CDATA[...]]></title>
  const titlePattern = new RegExp(`<title>(?:<!\\[CDATA\\[)?[^<]*${expectedTitle}[^<]*(?:\\]\\]>)?</title>`);
  expect(body).toMatch(titlePattern);
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
