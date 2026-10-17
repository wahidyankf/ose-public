import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";

const { Given, When, Then } = createBdd();

/**
 * A real content page that renders both the desktop resizable rail
 * (`ResizableSidebar`, `apps/ayokoding-www/src/features/navigation/shell/resizable-sidebar.tsx`)
 * and — via `Header` — the mobile drawer trigger. It is the stable course-root page the U6 ledger
 * names, since `/en/learn/overview` was retired in favour of the Learn home.
 */
const DOCS_PAGE = "/en/learn/courses/backend-essentials/overview";

/** `localStorage` key `ResizableSidebar` persists the desktop rail's chosen width under. */
const SIDEBAR_STORAGE_KEY = "ayokoding-sidebar-width";

/** Selector for the primitive's outer sizing element (see `resizable-panel.tsx`'s `data-slot`). */
const PANEL_SELECTOR = '[data-slot="resizable-panel"]';

/** `clampWidth`'s lower band bound, as a percentage of the viewport width. */
const MIN_WIDTH_PCT = 15;

/** Sets the desktop rail's persisted width directly, mirroring a prior drag/keyboard commit. */
async function setPersistedSidebarWidth(page: Page, widthPx: number): Promise<void> {
  await page.evaluate(({ key, px }) => localStorage.setItem(key, String(px)), {
    key: SIDEBAR_STORAGE_KEY,
    px: widthPx,
  });
}

Given("the reader has resized the docs sidebar to {int} pixels on a desktop viewport", async ({ page }, px: number) => {
  await page.goto(DOCS_PAGE);
  await setPersistedSidebarWidth(page, px);
});

When("the reader reloads the page", async ({ page }) => {
  await page.reload();
});

Then("the docs sidebar renders at {int} pixels", async ({ page }, expectedPx: number) => {
  const panel = page.locator(PANEL_SELECTOR);
  await expect(panel).toHaveCSS("width", `${expectedPx}px`);
});

Given("the docs page is open at a {int} pixel viewport", async ({ page }, viewportWidth: number) => {
  await page.setViewportSize({ width: viewportWidth, height: 800 });
  await page.goto(DOCS_PAGE);
});

When("the layout renders", async ({ page }) => {
  await expect(page.getByRole("article")).toBeVisible();
});

Then("the resizable aside is not displayed", async ({ page }) => {
  const aside = page.locator(`aside:has(${PANEL_SELECTOR})`);
  await expect(aside).toBeHidden();
});

Then("navigation is available through the mobile drawer", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeVisible();
});

/** The tree container `sidebar-tree.tsx` wraps its depth-0 `<ul>` in, so long labels scroll. */
const SCROLL_CONTAINER_SELECTOR = `aside:has(${PANEL_SELECTOR}) .overflow-x-auto`;

/**
 * The courses index — a stable (not subject to this plan's learn-section relocation, DD-42)
 * page whose sidebar shows all 37 course titles at once, several long enough (e.g. "21 ·
 * Object-Oriented Design & Patterns") to force horizontal scroll, and numerous enough to force
 * vertical scroll even at a full-height viewport, which is what these two overflow scenarios need.
 */
const TALL_WIDE_SIDEBAR_PAGE = "/en/learn/courses";

Given(
  "a docs sidebar narrowed to {int} pixels containing a nav label wider than {int} pixels",
  async ({ page }, widthPx: number, _minLabelWidthPx: number) => {
    // `useResizableWidth` re-clamps a persisted width against MIN_WIDTH_PCT of the CURRENT
    // viewport on mount (see width-model.ts's `clampWidth`, wired since the primitive was
    // introduced). At Playwright's default 1280px-wide viewport, MIN_WIDTH_PCT (15%) is 192px —
    // above this scenario's literal 150px — so the persisted value silently got clamped upward
    // instead of applying. Size the viewport so `widthPx` sits exactly at the minimum band
    // bound and is therefore not clamped, mirroring the same technique already used by the
    // "resizable panel rendered at N pixels with a M to K pixel band" step above.
    const viewportWidth = Math.round(widthPx / (MIN_WIDTH_PCT / 100));
    await page.setViewportSize({ width: viewportWidth, height: 800 });
    await page.goto(TALL_WIDE_SIDEBAR_PAGE);
    await setPersistedSidebarWidth(page, widthPx);
    await page.reload();

    const panel = page.locator(PANEL_SELECTOR);
    await expect(panel).toHaveCSS("width", `${widthPx}px`);
  },
);

When("the reader views the sidebar", async ({ page }) => {
  await expect(page.getByRole("article")).toBeVisible();
});

Then("the sidebar content area is horizontally scrollable", async ({ page }) => {
  const scrollContainer = page.locator(SCROLL_CONTAINER_SELECTOR);
  await expect(scrollContainer).toHaveCount(1);
  await expect.poll(async () => scrollContainer.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
});

Then("the label is not clipped or wrapped", async ({ page }) => {
  const noWrapLinks = page.locator(`aside:has(${PANEL_SELECTOR}) a.whitespace-nowrap:not(.truncate)`);
  await expect(noWrapLinks.first()).toBeAttached();
});

/**
 * The div `resizable-sidebar.tsx` renders as `ResizablePanel`'s sole child — the immediate
 * child of the primitive's `resizable-panel-content` slot — which owns the rail's vertical
 * scroll (see that file's docstring for why it, not `<aside>`, is the real scroll owner).
 */
const VERTICAL_SCROLL_CONTAINER_SELECTOR = `aside:has(${PANEL_SELECTOR}) [data-slot="resizable-panel-content"] > div`;

Given("a docs sidebar whose nav tree is taller than the visible rail height", async ({ page }) => {
  // Rather than fabricating tall content, shrink the viewport height enough that a real page's
  // nav tree exceeds the rail's `h-[calc(100vh-4rem)]` height — mirroring the "narrowed to N
  // pixels" technique above, which shrinks width instead for the horizontal scenario. Uses
  // `TALL_WIDE_SIDEBAR_PAGE` (the courses index, 37 titles), the tallest sidebar the fixture
  // content offers, so the tree overflows the rail even at a 300px viewport.
  await page.setViewportSize({ width: 1280, height: 300 });
  await page.goto(TALL_WIDE_SIDEBAR_PAGE);
});

Then("the sidebar content area is vertically scrollable", async ({ page }) => {
  const scrollContainer = page.locator(VERTICAL_SCROLL_CONTAINER_SELECTOR);
  await expect(scrollContainer).toHaveCount(1);
  await expect.poll(async () => scrollContainer.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
});

Then("the horizontal scroll behaviour is unaffected", async ({ page }) => {
  // This scenario's 1280px-wide viewport (see the Given step above, which only shrinks height)
  // means a real docs label is unlikely to overflow horizontally here, so asserting live
  // `scrollWidth > clientWidth` overflow (as the dedicated horizontal scenario at line 356-360
  // does) would be flaky at this viewport. Instead assert the container still carries the
  // `overflow-x: auto` computed style — proving the horizontal-scroll *capability* the vertical
  // fix must not remove, without depending on this viewport happening to trigger overflow.
  const scrollContainer = page.locator(SCROLL_CONTAINER_SELECTOR);
  await expect(scrollContainer).toHaveCount(1);
  await expect(scrollContainer).toHaveCSS("overflow-x", "auto");
});

/** Selector for `mobile-nav.tsx`'s `SheetContent` root (see its `data-slot`). */
const MOBILE_DRAWER_SELECTOR = '[data-slot="sheet-content"]';

Given("the mobile nav drawer is open at a {int} pixel viewport", async ({ page }, viewportWidth: number) => {
  await page.setViewportSize({ width: viewportWidth, height: 800 });
  await page.goto(DOCS_PAGE);
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(page.locator(MOBILE_DRAWER_SELECTOR)).toBeVisible();
});

When("the reader selects the wider preset", async ({ page }) => {
  await page.getByRole("button", { name: "Wide" }).click();
});

Then("the drawer renders at the wider preset width", async ({ page }) => {
  await expect(page.locator(MOBILE_DRAWER_SELECTOR)).toHaveCSS("width", "360px");
});

Given('the docs page is open in the "id" locale', async ({ page }) => {
  await page.goto("/id/belajar/ikhtisar");
  await page.waitForLoadState("networkidle");
});

Then('the resize handle\'s aria-label is the "id" translation of "Resize panel"', async ({ page }) => {
  await expect(page.getByRole("separator")).toHaveAttribute("aria-label", "Ubah ukuran panel");
});

const MOBILE_NAV_WIDTH_STORAGE_KEY = "ayokoding-mobilenav-width";

Given("the mobile nav drawer has a corrupted persisted preset width", async ({ page }) => {
  await page.goto(DOCS_PAGE);
  await page.evaluate((key) => localStorage.setItem(key, "999"), MOBILE_NAV_WIDTH_STORAGE_KEY);
  expect(await page.evaluate((key) => localStorage.getItem(key), MOBILE_NAV_WIDTH_STORAGE_KEY)).toBe("999");
});

When("the mobile nav drawer opens at a {int} pixel viewport", async ({ page }, viewportWidth: number) => {
  await page.setViewportSize({ width: viewportWidth, height: 800 });
  await page.reload();
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(page.locator(MOBILE_DRAWER_SELECTOR)).toBeVisible();
});

Then("the drawer renders at the default preset width", async ({ page }) => {
  await expect(page.locator(MOBILE_DRAWER_SELECTOR)).toHaveCSS("width", "280px");
});

When("the reader looks at the width-preset buttons", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Default" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Wide" })).toBeVisible();
});

Then("a visible caption explains that the buttons control the drawer's width", async ({ page }) => {
  await expect(page.getByText("Drawer width", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Widen the drawer to read long path or course titles in full", { exact: true }),
  ).toBeVisible();
});

Given(
  "the docs sidebar is narrowed enough that a nav label's text exceeds the visible rail width",
  async ({ page }) => {
    const widthPx = 150;
    const viewportWidth = Math.round(widthPx / (MIN_WIDTH_PCT / 100));
    await page.setViewportSize({ width: viewportWidth, height: 800 });
    await page.goto(TALL_WIDE_SIDEBAR_PAGE);
    await setPersistedSidebarWidth(page, widthPx);
    await page.reload();
    await expect(page.locator(PANEL_SELECTOR)).toHaveCSS("width", `${widthPx}px`);
    await expect
      .poll(() => page.locator(SCROLL_CONTAINER_SELECTOR).evaluate((el) => el.scrollWidth > el.clientWidth))
      .toBe(true);
  },
);

When("the reader views the sidebar without scrolling it", async ({ page }) => {
  const scrollContainer = page.locator(SCROLL_CONTAINER_SELECTOR);
  await expect(scrollContainer).toBeVisible();
  expect(await scrollContainer.evaluate((el) => el.scrollLeft)).toBe(0);
});

Then("a visible cue indicates the label continues off-screen", async ({ page }) => {
  const scrollContainer = page.locator(SCROLL_CONTAINER_SELECTOR);
  await expect(scrollContainer).toHaveAttribute("data-overflowing", "true");
  await expect
    .poll(() =>
      scrollContainer.evaluate((el) => getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage),
    )
    .toContain("linear-gradient");
});

Then("the item's expand-or-collapse chevron remains visible", async ({ page }) => {
  const chevron = page.locator(`aside:has(${PANEL_SELECTOR}) button[aria-label$="section"]`).first();
  await expect(chevron).toBeVisible();
  const aside = page.locator(`aside:has(${PANEL_SELECTOR})`);
  const [chevronBox, asideBox] = await Promise.all([chevron.boundingBox(), aside.boundingBox()]);
  expect(chevronBox).not.toBeNull();
  expect(asideBox).not.toBeNull();
  expect((chevronBox?.x ?? 0) + (chevronBox?.width ?? 0)).toBeLessThanOrEqual(
    (asideBox?.x ?? 0) + (asideBox?.width ?? 0),
  );
});
