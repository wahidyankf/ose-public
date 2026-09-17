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
  // UWT-001 regression: the permanent authentication notice is exposed with `status`, not `alert`,
  // semantics — matching the calm, non-interrupting readiness region beside it. (Scoped to this
  // component specifically: Next.js's own hidden route announcer always carries `role="alert"`
  // client-side and is unrelated to this fix, so a page-wide `getByRole("alert")` count would be a
  // false positive.)
  await expect(page.locator('[data-slot="alert"]')).toHaveAttribute("role", "status");
  // DWT-001 regression: the notice now uses the `Alert` primitive's `info` variant, giving it a
  // background/border colour visibly distinct from the status card beside it in both colour
  // schemes — restoring the page's only intended visual-hierarchy cue.
  await expect(page.locator('[data-slot="alert"]')).toHaveAttribute("data-variant", "info");
  const alertColors = await page.locator('[data-slot="alert"]').evaluate((element) => {
    const style = getComputedStyle(element);
    return { backgroundColor: style.backgroundColor, borderColor: style.borderColor };
  });
  const cardColors = await page.locator('[data-slot="card"]').evaluate((element) => {
    const style = getComputedStyle(element);
    return { backgroundColor: style.backgroundColor, borderColor: style.borderColor };
  });
  expect(alertColors.backgroundColor, "the notice's background must differ from the status card's").not.toBe(
    cardColors.backgroundColor,
  );
  expect(alertColors.borderColor, "the notice's border must differ from the status card's").not.toBe(
    cardColors.borderColor,
  );

  // DWT-002 regression: the header intro paragraph, the Alert's description, and each of the 3
  // readiness-row descriptions are constrained to a comfortable fixed-pixel reading measure via
  // a shared `max-w-md` class, independent of the outer container width. A fixed pixel cap
  // (rather than the `ch`-based `max-w-prose`) is asserted precisely, not just "not none": `ch`
  // resolves per-font digit width and this app's rounded Nunito font measured 65ch at ~624px —
  // barely narrower than the unconstrained box — so a looser "some max-width exists" assertion
  // would not have caught that regression.
  const proseElements = page.locator(".max-w-md");
  await expect(proseElements).toHaveCount(5);
  const proseMaxWidths = await proseElements.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).maxWidth),
  );
  for (const maxWidth of proseMaxWidths) {
    expect(maxWidth, "a running-text element must carry the fixed 448px reading-measure constraint").toBe("448px");
  }

  // Directly measures characters-per-line (not just that a constraint exists) using the same
  // canvas measureText technique the design-tester used, so a future font or class change that
  // resolves to a technically-present-but-ineffective constraint (as `max-w-prose` did here)
  // fails this assertion rather than only the proxy check above.
  const charsPerLine = await page.evaluate(() => {
    function measure(element: Element): number {
      const style = getComputedStyle(element);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (context === null) {
        return 0;
      }
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const text = element.textContent ?? "";
      const avgGlyphWidth = text.length > 0 ? context.measureText(text).width / text.length : 0;
      const boxWidth = element.getBoundingClientRect().width;
      return avgGlyphWidth > 0 ? boxWidth / avgGlyphWidth : 0;
    }
    const paragraph = document.querySelector("main > header > p");
    const alertDescription = document.querySelector('[data-slot="alert-description"]');
    const rowDescriptions = Array.from(document.querySelectorAll('[data-slot="readiness-row"] dd span:last-child'));
    return [paragraph, alertDescription, ...rowDescriptions]
      .filter((element): element is Element => element !== null)
      .map(measure);
  });
  expect(charsPerLine, "every running-text element must have a measurable width").toHaveLength(5);
  for (const measured of charsPerLine) {
    expect(measured, "running text must stay within WCAG SC 1.4.8's 80-character guideline").toBeLessThanOrEqual(80);
  }
});

Then("status is conveyed by text rather than color alone", async ({ page }) => {
  const text = (await statusRegion(page).textContent()) ?? "";
  for (const label of STATE_LABELS) {
    expect(text, `the ${label} state must be readable as text`).toContain(label);
  }
  expect(text).toContain(AUTHENTICATION_DISABLED_NOTICE);

  // UWT-002 regression: the by-design-active "Running" row renders with a visibly heavier
  // computed font weight than the two by-design-inactive rows, so a first glance can triage
  // status without reading every explanatory sentence — never a colour-only cue.
  const runningWeight = Number(
    await statusRegion(page)
      .getByText("Running", { exact: true })
      .evaluate((element) => getComputedStyle(element).fontWeight),
  );
  const notReportedWeight = Number(
    await statusRegion(page)
      .getByText("Not reported", { exact: true })
      .evaluate((element) => getComputedStyle(element).fontWeight),
  );
  const disabledWeight = Number(
    await statusRegion(page)
      .getByText("Disabled", { exact: true })
      .evaluate((element) => getComputedStyle(element).fontWeight),
  );
  expect(runningWeight).toBeGreaterThan(notReportedWeight);
  expect(runningWeight).toBeGreaterThan(disabledWeight);
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
  // UWT-001 regression: the authentication notice ships with `role="status"`, never `role="alert"`.
  expect(body).not.toContain(`role="alert"`);
  expect((body.match(/role="status"/gu) ?? []).length).toBe(2);
  // DWT-001 regression: the notice ships with the `info` variant, never the implicit `default` one.
  expect(body).toContain(`data-variant="info"`);
  expect(body).not.toContain(`data-variant="default"`);
  // DWT-002 regression: the header paragraph, the Alert description, and each of the 3
  // readiness-row descriptions carry the shared fixed-pixel reading-measure constraint class
  // (`max-w-md`, not the `ch`-based `max-w-prose` — see `ServiceStatusPanel`'s doc comment).
  expect(body).toMatch(/<p class="[^"]*max-w-md[^"]*">/u);
  expect(body).toMatch(/<div data-slot="alert-description" class="[^"]*max-w-md[^"]*">/u);
  expect((body.match(/<span class="[^"]*max-w-md[^"]*">/gu) ?? []).length).toBe(3);
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
