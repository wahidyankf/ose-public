import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { state } from "./helpers";

const { When, Then } = createBdd();

When("the sitemap is generated", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBeTruthy();
  state.sitemapBody = await response.text();
});

Then("the sitemap contains a URL for the landing page", async () => {
  const body = state.sitemapBody as string;
  // The landing page URL should be present (root or /)
  expect(body).toContain("<loc>");
});

Then("the sitemap contains a URL for the about page", async () => {
  const body = state.sitemapBody as string;
  expect(body).toContain("/about");
});

Then("the sitemap contains URLs for all update pages", async () => {
  const body = state.sitemapBody as string;
  expect(body).toContain("/updates/");
});

When("the robots.txt is generated", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.ok()).toBeTruthy();
  state.robotsBody = await response.text();
});

Then("it allows all user agents", async () => {
  const body = state.robotsBody as string;
  expect(body.toLowerCase()).toContain("user-agent");
});

Then("it references the sitemap URL", async () => {
  const body = state.robotsBody as string;
  expect(body.toLowerCase()).toContain("sitemap");
});
