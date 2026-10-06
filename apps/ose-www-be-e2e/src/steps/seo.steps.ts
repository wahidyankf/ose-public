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
  const locations = [...body.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => new URL(match[1]!));
  expect(locations.some((location) => location.pathname === "/")).toBe(true);
});

Then("the sitemap contains a URL for the about page", async () => {
  const body = state.sitemapBody as string;
  expect(body).toContain("/about");
});

Then("the sitemap contains URLs for all update pages", async () => {
  const body = state.sitemapBody as string;
  expect(body).toContain("/updates/");
});

Then("every sitemap URL is on the canonical host {string}", async ({}, host: string) => {
  const body = state.sitemapBody as string;
  const hosts = [...body.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => new URL(match[1]!).host);
  expect(hosts.length).toBeGreaterThan(0);
  expect(hosts.filter((candidate) => candidate !== host)).toEqual([]);
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

Then("the sitemap URL is on the canonical host {string}", async ({}, host: string) => {
  const body = state.robotsBody as string;
  const declaration = body.match(/^sitemap:\s*(\S+)/imu);
  expect(declaration, "robots.txt must declare a sitemap URL").not.toBeNull();
  expect(new URL(declaration![1]!).host).toBe(host);
});
