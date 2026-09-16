/**
 * E2E bindings for specs/apps/ose/id-web/behaviours/foundation/status-shell.feature.
 *
 * This adapter owns the real browser and the real HTTP response: the 320 pixel viewport, the
 * accessibility tree a screen reader would read, keyboard-only review, and the response envelope
 * an anonymous client receives.
 */
import { createBdd } from "playwright-bdd";
import { expect, type APIResponse, type Page } from "@playwright/test";

const { Given, When, Then } = createBdd();

const STATUS_PAGE_HEADING = "OSE ID service status";
const STATUS_REGION_LABEL = "OSE ID service component status";
const AUTHENTICATION_DISABLED_NOTICE =
  "Authentication is not enabled. OSE ID cannot sign anyone in yet, and this page is not a sign-in form.";
const STATE_LABELS = ["Running", "Not reported", "Disabled"] as const;

let response: APIResponse | undefined;
let repeatedBodies: string[] = [];

function statusRegion(page: Page) {
  return page.getByRole("status", { name: STATUS_REGION_LABEL });
}

Given("the OSE ID web shell is running at a 320 pixel viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const navigation = await page.goto("/");
  expect(navigation?.status()).toBe(200);
});

When("a keyboard and screen-reader user reviews its status", async ({ page }) => {
  // Keyboard only: the review dispatches no pointer event, and tabbing must not trap focus or be
  // required to reveal any status content.
  await page.keyboard.press("Tab");
  await expect(statusRegion(page)).toBeVisible();
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflows, "the status shell must reflow inside a 320 pixel viewport").toBe(false);
});

Then("the page has one descriptive heading and named status region", async ({ page }) => {
  const headings = page.getByRole("heading", { level: 1 });
  await expect(headings).toHaveCount(1);
  await expect(headings).toHaveText(STATUS_PAGE_HEADING);
  await expect(statusRegion(page)).toHaveCount(1);
});

Then("status is conveyed by text rather than color alone", async ({ page }) => {
  const text = (await statusRegion(page).textContent()) ?? "";
  for (const label of STATE_LABELS) {
    expect(text, `the ${label} state must be readable as text`).toContain(label);
  }
  expect(text).toContain(AUTHENTICATION_DISABLED_NOTICE);
});

Given("the local web and backend services are ready", async ({ request }) => {
  const probe = await request.get("/");
  expect(probe.status()).toBe(200);
  const body = await probe.text();
  // The shell reports on itself and on the backend; a component it cannot reach is stated in
  // words, so a ready stack renders no unavailable component.
  expect(body).not.toContain("Unavailable");
});

When("an anonymous browser requests the OSE ID web root without user or tenant context", async ({ request }) => {
  response = await request.get("/", { headers: { cookie: "" } });
  repeatedBodies = [];
});

Then('the response is 200 with media type "text\\/html; charset=utf-8"', async () => {
  expect(response?.status()).toBe(200);
  expect(response?.headers()["content-type"]).toBe("text/html; charset=utf-8");
});

Then('the response is marked "no-cache" and sets no session cookie', async () => {
  expect(response?.headers()["cache-control"] ?? "").toContain("no-cache");
  expect(response?.headers()["set-cookie"]).toBeUndefined();
});

Then("the page carries one heading and a named textual status region", async () => {
  const body = (await response?.text()) ?? "";
  expect(body.match(/<h1\b/gu) ?? []).toHaveLength(1);
  expect(body).toContain(STATUS_PAGE_HEADING);
  expect(body).toContain(`aria-label="${STATUS_REGION_LABEL}"`);
});

Then("no sign-in, provider, company, consent, or administration control is rendered", async ({ page }) => {
  await page.goto("/");
  for (const role of ["button", "textbox", "link", "checkbox", "combobox"] as const) {
    await expect(page.getByRole(role)).toHaveCount(0);
  }
  await expect(page.locator("form, input, button, select, textarea")).toHaveCount(0);
});

Then("repeated and concurrent reads change nothing the service stores", async ({ request }) => {
  const concurrent = await Promise.all([request.get("/"), request.get("/"), request.get("/")]);
  for (const read of concurrent) {
    expect(read.status()).toBe(200);
    expect(read.headers()["set-cookie"]).toBeUndefined();
    repeatedBodies.push(await read.text());
  }
  const first = (await response?.text()) ?? "";
  for (const body of repeatedBodies) {
    expect(body).toBe(first);
  }
});
