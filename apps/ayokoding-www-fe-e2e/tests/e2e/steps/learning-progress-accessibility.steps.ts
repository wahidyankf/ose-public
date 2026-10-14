import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { completeCourseThroughUi } from "./support/complete-course";

const { Given, When, Then } = createBdd();

// ---------------------------------------------------------------------------
// plan ayokoding-learn-revamp-04-learning-experience, Phase 8 —
// `learning-progress/learning-progress-accessibility.feature` (S35–S39). The unit bindings for the
// same scenarios live in
// `apps/ayokoding-www/tests/unit/fe-steps/learning-progress-accessibility.steps.tsx`.
//
// The techniques are the ones tech-docs/006 "E2E Techniques" prescribes: status words beside every
// `aria-hidden` bar, Tab-then-Space on the completion toggle with its `role="status"` announcement,
// reduced-motion computed styles, a 375 px viewport with 44 × 44 progress controls, and an axe scan
// with the `wcag2a` and `wcag2aa` tags. Two step texts are bound elsewhere and reused, exactly as
// the other progress features do: "the reader opens a path page" (`path-roadmap.steps.ts`, S21 and
// progress-store's S5) and "a reader has saved progress" (`progress-store.steps.ts`, S39 here).
// ---------------------------------------------------------------------------

const BACKEND_PATH = "careers/immediately-effective/backend-track";
const BASH_ID = "just-enough-bash";

/** The backend-track fixture's second core course — the one this feature starts but never finishes. */
const BACKEND_SECOND_COURSE = "backend-essentials";

/** The course landing header (`courseHeaderLabel`) whose primary action opens a course's first page. */
const COURSE_HEADER = 'header[aria-label="Course summary"]';

/** The lesson action row, whose `Page navigation` name U4 keeps. */
function actionRow(page: Page) {
  return page.getByRole("navigation", { name: "Page navigation" });
}

/** The completion toggle — the action row's only button, its state carried by `aria-pressed`. */
function completionToggle(page: Page) {
  return actionRow(page).getByRole("button");
}

/** The lesson context bar, the landmark a lesson page renders. */
function contextBar(page: Page) {
  return page.getByRole("navigation", { name: "Lesson location" });
}

const LESSON_URL = `/en/learn/courses/${BASH_ID}/learning/beginner?path=${BACKEND_PATH}`;

async function openLessonPage(page: Page): Promise<void> {
  await page.goto(LESSON_URL);
  await page.waitForLoadState("networkidle");
  await expect(contextBar(page)).toBeVisible();
}

/**
 * Mark the page a reader has opened complete. The toggle only becomes operable once the store has
 * hydrated, so the click-and-verify pair is retried as a unit (the same guard `path-roadmap.steps.ts`
 * uses for its own clicks).
 */
async function markPageComplete(page: Page): Promise<void> {
  const toggle = completionToggle(page);
  await expect(toggle).toBeEnabled();
  await expect(async () => {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true", { timeout: 2000 });
  }).toPass({ timeout: 15000 });
}

/**
 * Open a course's first lesson page through its own landing page and mark that page complete — the
 * only writer of progress (S18), so every status below is earned through the UI.
 */
async function markFirstLessonPageComplete(page: Page, courseId: string, pathId: string): Promise<void> {
  const courseRoot = `/en/learn/courses/${courseId}`;

  await page.goto(`${courseRoot}?path=${pathId}`);
  await page.waitForLoadState("networkidle");
  await page.locator(COURSE_HEADER).locator(`a[href^="${courseRoot}/"], button`).first().click();
  await page.waitForURL((url) => url.pathname.startsWith(`${courseRoot}/`));
  await markPageComplete(page);
}

// ---------------------------------------------------------------------------
// S35 — status is shown in words, not only colour.
// ---------------------------------------------------------------------------

const COURSE_STATUS_SLOT = '[data-progress-slot="course-status"]';
const STATUS_WORDS = /^(Done|In progress|Not started)$/u;
/** `contextPageOf` / `progressPagesDone` / `progressCoreCoursesDone` / `progressPhaseDone`, in words. */
const WRITTEN_COUNT = /\d+ of \d+ (?:[a-z]+ )*done/u;

Given("a reader has courses that are done, in progress, and not started", async ({ page }) => {
  // The shared "the reader opens a path page" step opens the backend track, so the three states are
  // earned on that fixture's own core courses — the scenario's three states have to be on the page
  // the scenario opens: just-enough-bash finished, backend-essentials started, sql-essentials
  // untouched.
  await page.goto("/en/learn");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => window.localStorage.removeItem("ayokoding-learn-progress-v1"));

  await completeCourseThroughUi(page, BASH_ID, BACKEND_PATH);
  await markFirstLessonPageComplete(page, BACKEND_SECOND_COURSE, BACKEND_PATH);
});

Then(
  "every course status is written as the words {string}, {string}, or {string}",
  async ({ page }, ...words: string[]) => {
    const statuses = (await page.locator(COURSE_STATUS_SLOT).allTextContents()).map((text) => text.trim());

    // One status per course card, each one a word — colour is only ever the second signal.
    expect(statuses.length).toBeGreaterThan(0);
    for (const status of statuses) {
      expect(status).toMatch(STATUS_WORDS);
      expect(words).toContain(status);
    }
    // All three words appear: the reader's finished, started, and untouched courses.
    expect([...new Set(statuses)].sort()).toEqual([...words].sort());
  },
);

Then("every progress bar has a text equivalent such as {string}", async ({ page }, example: string) => {
  expect(example).toMatch(WRITTEN_COUNT);

  const bars = page.locator('[data-progress-slot] [aria-hidden="true"].rounded-full');
  const count = await bars.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    const bar = bars.nth(index);
    await expect(bar).toBeAttached();
    // The bar is decoration: the value sits in words in the same slot, never only in the bar.
    const slot = bar.locator("xpath=ancestor::*[@data-progress-slot][1]");
    await expect(slot).toContainText(WRITTEN_COUNT);
  }
});

// ---------------------------------------------------------------------------
// S36 — progress controls work with the keyboard and announce changes.
// ---------------------------------------------------------------------------

Given("a reader on a learning page uses only the keyboard", async ({ page }) => {
  await openLessonPage(page);
  // The toggle is operable only once the store has hydrated; from then on nothing here uses a
  // pointer.
  await expect(completionToggle(page)).toBeEnabled();
});

When("the reader tabs to {string} and presses Space", async ({ page, browserName }, label: string) => {
  const reached = await tabToControl(page, label, browserName);
  expect(reached, `Tab reached "${label}" within this page's own focus order`).toBe(true);
  await page.keyboard.press(" ");
});

/**
 * Tab until the focused element is the named control: the keyboard user's own path to it, from the
 * top of the page, in the page's own order.
 *
 * The budget is the page's own focus order measured up front, not a number picked by hand: a lesson
 * page carries a large sidebar tree plus a copy-to-clipboard button per code block, so the action
 * row sits well past any fixed allowance. Scrollable panes count too, because the browsers that
 * focus them add a stop each. A control that has no place in that order still fails the step.
 *
 * Which key walks that order is the reader's own platform question, not a shortcut around it.
 * Safari leaves plain `Tab` on text fields and the focusable scrollable panes — on this page that
 * walks the code blocks below and never reaches the action row — and moves through links and
 * buttons on Option+Tab, which Playwright sends as `Alt+Tab` and which this suite's
 * `accessibility.steps.ts` already uses for WebKit. Chromium and Firefox reach every control on
 * plain `Tab`. Either way the traversal starts at the top of the page and spends real presses to
 * get there, and the same control has to come up.
 */
async function tabToControl(page: Page, label: string, browserName: string): Promise<boolean> {
  // The locator names the control the scenario means, so focus is matched by element identity
  // rather than by its text: no whitespace difference in `textContent`, and no React commit of
  // `aria-pressed` still in flight, can pass this off as a different element — while the accessible
  // name still has to be the label this step names.
  const control = completionToggle(page);
  await expect(control).toHaveAccessibleName(label);

  const budget = await page.evaluate(() => {
    const tabbable =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return document.querySelectorAll(tabbable).length + document.querySelectorAll("pre").length;
  });

  // The measured order is a floor, not a ceiling: a browser's own sequence reaches a few more stops
  // than the DOM count suggests (and can dwell on a scrollable pane), so give it headroom rather
  // than failing a control that is genuinely reachable.
  const maxPresses = budget * 3 + 50;
  const tabKey = browserName === "webkit" ? "Alt+Tab" : "Tab";

  for (let presses = 0; presses < maxPresses; presses += 1) {
    await page.keyboard.press(tabKey);
    const focused = await control.evaluate((node) => node === document.activeElement);
    if (focused) {
      return true;
    }
  }
  return false;
}

Then("the control's pressed state becomes true", async ({ page }) => {
  await expect(completionToggle(page)).toHaveAttribute("aria-pressed", "true");
});

Then("a status message announces that the page is complete and the new count", async ({ page }) => {
  const status = actionRow(page).getByRole("status");
  // The announcement names the page and the new count: "marked as complete. {done} of {total} pages done."
  await expect(status).toHaveText(/marked as complete\. \d+ of \d+ pages done\./u);
});

// ---------------------------------------------------------------------------
// S37 — reduced motion turns off progress animations.
// ---------------------------------------------------------------------------

Given("the reader's system asks for reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

When("the reader marks a page as complete", async ({ page }) => {
  await openLessonPage(page);
  await markPageComplete(page);
  // The bar that just changed width is on this page's context bar.
  await expect(contextBar(page)).toContainText(WRITTEN_COUNT);
});

Then("no progress bar or status element animates", async ({ page }) => {
  const animating = await page.evaluate(() => {
    const offenders: string[] = [];

    for (const slot of Array.from(document.querySelectorAll("[data-progress-slot]"))) {
      for (const element of Array.from(slot.querySelectorAll("*"))) {
        const computed = window.getComputedStyle(element);
        const duration = computed.transitionDuration;
        const animation = computed.animationName;
        if (duration !== "0s" || animation !== "none") {
          offenders.push(`${element.tagName}.${element.className} -> ${duration}/${animation}`);
        }
      }
    }

    return offenders;
  });

  // `motion-safe:` keeps every animation inside `@media (prefers-reduced-motion: no-preference)`,
  // so a reduced-motion reader gets no transition and no animation at all.
  expect(animating).toEqual([]);
});

// ---------------------------------------------------------------------------
// S38 — progress screens fit a phone screen.
// ---------------------------------------------------------------------------

/** The four screens the feature names, at the phone width this scenario sets. */
const PHONE_SCREENS: ReadonlyArray<{ name: string; url: string }> = [
  { name: "the Learn home", url: "/en/learn" },
  { name: "a path page", url: `/en/learn/paths/${BACKEND_PATH}` },
  { name: "a learning page", url: `/en/learn/courses/${BASH_ID}/learning/beginner?path=${BACKEND_PATH}` },
  { name: "a course landing page", url: `/en/learn/courses/${BASH_ID}?path=${BACKEND_PATH}` },
];

/** What one phone-width screen measured: its scroll width and every progress control's box. */
interface PhoneMeasurement {
  name: string;
  scrollWidth: number;
  controls: { label: string; width: number; height: number }[];
}

let phoneMeasurements: PhoneMeasurement[] = [];

Given("a 375 pixel wide viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  phoneMeasurements = [];
});

When("the reader opens the Learn home, a path page, a learning page, and a course landing page", async ({ page }) => {
  for (const screen of PHONE_SCREENS) {
    await page.goto(screen.url);
    await page.waitForLoadState("networkidle");

    const controls = page.locator("[data-progress-control]");
    const boxes: { label: string; width: number; height: number }[] = [];
    const count = await controls.count();

    for (let index = 0; index < count; index += 1) {
      const control = controls.nth(index);
      await expect(control).toBeVisible();
      const box = await control.boundingBox();
      expect(box, `${screen.name}: a progress control has no box`).not.toBeNull();
      boxes.push({
        label: ((await control.textContent()) ?? "").trim(),
        width: box?.width ?? 0,
        height: box?.height ?? 0,
      });
    }

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    phoneMeasurements.push({ name: screen.name, scrollWidth, controls: boxes });
  }
});

Then("no page scrolls horizontally", () => {
  expect(phoneMeasurements).toHaveLength(PHONE_SCREENS.length);
  for (const { name, scrollWidth } of phoneMeasurements) {
    expect(scrollWidth, `${name} fits a 375 px viewport`).toBeLessThanOrEqual(375);
  }
});

Then("every progress control is at least 44 by 44 CSS pixels", () => {
  expect(phoneMeasurements).toHaveLength(PHONE_SCREENS.length);
  for (const { name, controls } of phoneMeasurements) {
    // Every screen in scope carries at least one progress control.
    expect(controls.length, `${name} carries a progress control`).toBeGreaterThan(0);

    for (const control of controls) {
      expect(control.width, `${name}: "${control.label}" is 44 px wide`).toBeGreaterThanOrEqual(44);
      expect(control.height, `${name}: "${control.label}" is 44 px tall`).toBeGreaterThanOrEqual(44);
    }
  }
});

// ---------------------------------------------------------------------------
// S39 — progress screens pass automated accessibility checks. The scenario's Given, "a reader has
// saved progress", is bound once in `progress-store.steps.ts` (it completes the path's first course
// through the UI) and reused here.
// ---------------------------------------------------------------------------

interface AxeFinding {
  screen: string;
  rule: string;
  nodes: string[];
}

let axeFindings: AxeFinding[] = [];

When(
  "the Learn home, a path page, a learning page, and a course landing page are scanned for WCAG 2 A and AA rules",
  async ({ page }) => {
    axeFindings = [];

    for (const screen of PHONE_SCREENS) {
      await page.goto(screen.url);
      await page.waitForLoadState("networkidle");

      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      for (const violation of violations) {
        for (const node of violation.nodes) {
          axeFindings.push({ screen: screen.name, rule: violation.id, nodes: [node.target.join(" ")] });
        }
      }
    }
  },
);

Then("no scan reports a violation", () => {
  // Zero violations across the four screens, rule and offending selector named when there is one.
  expect(axeFindings).toEqual([]);
});
