import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { fireEvent, within } from "@testing-library/react";
import { expect, vi, type TestContext } from "vitest";
import "./helpers/test-setup";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/course-paths/shell/use-runtime-course-path-data", () => ({
  useRuntimeCoursePathData: (_locale: string, initial: unknown) => ({ data: initial, isReady: true }),
}));

// eslint-disable-next-line import/first
import { BASH_SEQUENCE, LESSON_SEQUENCES } from "../features/learning-progress/lesson-fixtures";
// eslint-disable-next-line import/first
import { PATH_ID, openProgressScreen, PROGRESS_SCREENS } from "./helpers/progress-screens";
// eslint-disable-next-line import/first
import { actionRow, completedPages, completionToggle, noSavedProgress, openLessonPage } from "./helpers/lesson-page";

/**
 * The Unit binding of `learning-progress/learning-progress-accessibility.feature` (S35–S39;
 * tech-docs/006 E2E Techniques, tech-docs/004 Shared Rules).
 *
 * Every scenario renders the real components for the four screens the feature names — the Learn
 * home, a path page, a learning page, and a course landing page — so a unit assertion and its
 * browser binding describe one reader experience. The split is the repository's established one
 * (see `course-paths-accessibility.steps.tsx`): this level asserts the semantics and the classes
 * the components ship — status in words, `aria-hidden` bars beside their text equivalent,
 * `aria-pressed`, `role="status"`, `motion-safe` animations, `min-h-11` targets — while the
 * rendered *styles* (computed `transition-duration`, real 44 × 44 boxes, scroll width, axe
 * scans) are asserted in the browser by `learning-progress-accessibility.steps.ts`.
 */
const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/learning-progress/learning-progress-accessibility.feature",
  ),
);

/** The single-screen twin of the four-screen walk: one scenario reads one screen. */
function screen(name: "the Learn home" | "a path page" | "a learning page" | "a course landing page"): HTMLElement {
  return openProgressScreen(name);
}

const BASH_ID = "just-enough-bash";
const BACKEND_ID = "backend-essentials";

/** The words every progress bar's neighbour must carry (S35, tech-docs/004 "Bars are decoration"). */
const TEXT_EQUIVALENT = /\d+ of \d+ (?:[a-z]+ )*done/u;

// ---------------------------------------------------------------------------
// Queries and the accessibility invariants the four screens must satisfy.
// ---------------------------------------------------------------------------

function slotsIn(container: HTMLElement, name?: string): HTMLElement[] {
  const selector = name === undefined ? "[data-progress-slot]" : `[data-progress-slot="${name}"]`;
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

function controlsIn(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-progress-control]"));
}

/** Every decoration bar — `ProgressMeter`'s `aria-hidden` track (tech-docs/004 "Bars are decoration"). */
function metersIn(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-progress-slot] [aria-hidden="true"].rounded-full'));
}

/** Class tokens that animate without the `motion-safe:` variant, i.e. beside a reduced-motion reader. */
function animatingTokens(elements: readonly HTMLElement[]): string[] {
  const offenders: string[] = [];
  for (const root of elements) {
    for (const element of [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))]) {
      for (const token of Array.from(element.classList)) {
        if (/^(?:animate-|transition|duration-)/u.test(token)) {
          offenders.push(`${token} on <${element.tagName.toLowerCase()}>`);
        }
      }
    }
  }
  return offenders;
}

/** Widths a slot declares in raw pixels — a phone-width overflow risk (rem widths are not). */
function oversizedPixelWidths(container: HTMLElement): string[] {
  const offenders: string[] = [];
  for (const element of Array.from(container.querySelectorAll<HTMLElement>("*"))) {
    for (const token of Array.from(element.classList)) {
      const match = /^(?:min-)?w-\[(\d+)px\]$/u.exec(token);
      if (match !== null && Number(match[1]) >= 375) {
        offenders.push(`${token} on <${element.tagName.toLowerCase()}>`);
      }
    }
  }
  return offenders;
}

/** An element's accessible name, as the naming rules compute it for the shapes these screens use. */
function accessibleName(element: HTMLElement): string {
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy !== null) {
    return labelledBy
      .split(/\s+/u)
      .map((id) => element.ownerDocument.getElementById(id)?.textContent ?? "")
      .join(" ")
      .trim();
  }
  const label = element.getAttribute("aria-label") ?? element.getAttribute("title");
  return (label ?? element.textContent ?? "").trim();
}

/**
 * The structural WCAG 2 A/AA invariants this level can decide (S39): every interactive control
 * inside a progress slot is named, no `aria-hidden` decoration contains an interactive element,
 * every decoration bar is accompanied by its written value, and the document has one `h1`. The
 * rendered-style rules and the axe scan itself are the E2E binding's job (tech-docs/006).
 */
function structuralViolations(container: HTMLElement): string[] {
  const violations: string[] = [];
  const interactive = "a[href], button, input, select, textarea, [tabindex]";

  for (const control of Array.from(container.querySelectorAll<HTMLElement>(interactive))) {
    if (accessibleName(control) === "") {
      violations.push(`<${control.tagName.toLowerCase()}> has no accessible name`);
    }
  }

  for (const hidden of Array.from(container.querySelectorAll<HTMLElement>('[aria-hidden="true"]'))) {
    const nested = hidden.querySelectorAll(interactive);
    if (nested.length > 0) {
      violations.push(`aria-hidden element contains ${nested.length} interactive descendant(s)`);
    }
  }

  for (const bar of metersIn(container)) {
    const slot = bar.closest<HTMLElement>("[data-progress-slot]");
    if (slot === null || !TEXT_EQUIVALENT.test(slot.textContent ?? "")) {
      violations.push("a decoration bar has no written value beside it");
    }
  }

  if (container.querySelectorAll("h1").length !== 1) {
    violations.push("the screen does not carry exactly one h1");
  }

  return violations;
}

/**
 * One screen's audit, taken while it is still mounted: every scenario opens a screen, reads it at
 * once, and moves on — the same shape the E2E binding walks the four screens in.
 */
interface ScreenAudit {
  name: string;
  /** Rendered-style and structural violations the checks above can decide. */
  violations: string[];
  /** Raw-pixel widths as wide as the phone viewport (S38's overflow risk). */
  oversizedWidths: string[];
  /** Every progress control, with the classes that size it. */
  controls: { label: string; tag: string; className: string }[];
}

/** Open all four screens in sequence, auditing each one while it is the mounted tree. */
function auditScreens(): ScreenAudit[] {
  return PROGRESS_SCREENS.map(({ name, open }) => {
    const container = open();
    return {
      name,
      violations: structuralViolations(container),
      oversizedWidths: oversizedPixelWidths(container),
      controls: controlsIn(container).map((control) => ({
        label: accessibleName(control),
        tag: control.tagName,
        className: control.className,
      })),
    };
  });
}

/** Mark pages complete through the lesson page's own control — the only writer (S18). */
function markPagesComplete(courseId: string, pagePaths: readonly string[]): void {
  for (const pagePath of pagePaths) {
    openLessonPage({ courseId, pagePath, pathParam: PATH_ID });
    expect(completionToggle().getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(completionToggle());
    expect(completionToggle().getAttribute("aria-pressed")).toBe("true");
  }
}

function firstPageOf(courseId: string): string {
  const page = LESSON_SEQUENCES[courseId]?.[0];
  if (page === undefined) {
    throw new Error(`The lesson fixture declares no page for "${courseId}"`);
  }
  return page.pagePath;
}

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {
      noSavedProgress();
    });
  });

  Scenario("Status is shown in words, not only colour", ({ Given, When, Then, And }) => {
    let container: HTMLElement;

    Given("a reader has courses that are done, in progress, and not started", () => {
      noSavedProgress();
      markPagesComplete(
        BASH_ID,
        BASH_SEQUENCE.map((page) => page.pagePath),
      );
      markPagesComplete(BACKEND_ID, [firstPageOf(BACKEND_ID)]);

      expect(completedPages(BASH_ID)).toHaveLength(BASH_SEQUENCE.length);
      expect(completedPages(BACKEND_ID)).toHaveLength(1);
    });

    When("the reader opens a path page", () => {
      container = screen("a path page");
    });

    Then(
      "every course status is written as the words {string}, {string}, or {string}",
      (_ctx: TestContext, ...words: string[]) => {
        const statuses = slotsIn(container, "course-status").map((slot) => (slot.textContent ?? "").trim());

        // One status per course card, and each one is a word — never a colour only.
        expect(statuses).toHaveLength(3);
        for (const status of statuses) {
          expect(words).toContain(status);
        }
        // The reader's three kinds of course are all represented: done, in progress, not started.
        expect([...new Set(statuses)].sort()).toEqual([...words].sort());
      },
    );

    And("every progress bar has a text equivalent such as {string}", (_ctx: TestContext, example: string) => {
      // The feature's own example declares the shape, and the page writes it out in full words.
      expect(example).toMatch(TEXT_EQUIVALENT);

      const bars = metersIn(container);
      expect(bars.length).toBeGreaterThan(0);
      for (const bar of bars) {
        expect(bar.getAttribute("aria-hidden")).toBe("true");
        const slot = bar.closest<HTMLElement>("[data-progress-slot]");
        expect((slot?.textContent ?? "").trim()).toMatch(TEXT_EQUIVALENT);
      }
    });
  });

  Scenario("Progress controls work with the keyboard and announce changes", ({ Given, When, Then, And }) => {
    Given("a reader on a learning page uses only the keyboard", () => {
      noSavedProgress();
      openLessonPage({ courseId: BASH_ID, pagePath: "learning/beginner", pathParam: PATH_ID });

      const toggle = completionToggle();
      // A native button: a browser focuses it with Tab and activates it with Space or Enter, with
      // no script of ours in the path. The real Tab-then-Space flow is the E2E binding's proof.
      expect(toggle.tagName).toBe("BUTTON");
      expect(toggle.getAttribute("type")).toBe("button");
      expect(toggle.getAttribute("aria-pressed")).toBe("false");

      toggle.focus();
      expect(document.activeElement).toBe(toggle);
    });

    When("the reader tabs to {string} and presses Space", (_ctx: TestContext, label: string) => {
      const toggle = completionToggle();
      expect((toggle.textContent ?? "").trim()).toBe(label);

      // jsdom has no keyboard activation, so the browser's own Space sequence is replayed exactly:
      // keydown, the click the platform fires from it, then keyup.
      fireEvent.keyDown(toggle, { key: " ", code: "Space" });
      fireEvent.click(toggle);
      fireEvent.keyUp(toggle, { key: " ", code: "Space" });
    });

    Then("the control's pressed state becomes true", () => {
      expect(completionToggle().getAttribute("aria-pressed")).toBe("true");
      expect(completedPages(BASH_ID)).toEqual(["learning/beginner"]);
    });

    And("a status message announces that the page is complete and the new count", () => {
      const status = within(actionRow()).getByRole("status");
      const total = BASH_SEQUENCE.length;

      expect(status.getAttribute("aria-live")).toBe("polite");
      expect((status.textContent ?? "").trim()).toBe(`Beginner Examples marked as complete. 1 of ${total} pages done.`);
    });
  });

  Scenario("Reduced motion turns off progress animations", ({ Given, When, Then }) => {
    let container: HTMLElement;

    Given("the reader's system asks for reduced motion", () => {
      noSavedProgress();
      // jsdom has no media emulation, so this level asserts the source of every animation: a
      // `motion-safe:` variant, which Tailwind emits inside `@media (prefers-reduced-motion:
      // no-preference)`, is the only animation class any progress area carries. The computed
      // `transition-duration: 0s` and `animation-name: none` are the E2E binding's proof.
      expect(animatingTokens(slotsIn(screen("a path page")))).toEqual([]);
    });

    When("the reader marks a page as complete", () => {
      openLessonPage({ courseId: BASH_ID, pagePath: "learning/beginner", pathParam: PATH_ID });
      fireEvent.click(completionToggle());
      container = document.body;
    });

    Then("no progress bar or status element animates", () => {
      // Nothing inside a progress area animates except under `motion-safe:` — placeholders included.
      expect(animatingTokens(slotsIn(container))).toEqual([]);

      const bars = metersIn(container);
      expect(bars.length).toBeGreaterThan(0);
      for (const bar of bars) {
        const fill = bar.firstElementChild as HTMLElement | null;
        const classes = fill?.className ?? "";
        expect(classes).toContain("motion-safe:transition-[width]");
        expect(classes).toContain("motion-safe:duration-300");
      }
    });
  });

  Scenario("Progress screens fit a phone screen", ({ Given, When, Then, And }) => {
    let opened: ScreenAudit[];

    Given("a 375 pixel wide viewport", () => {
      // jsdom lays nothing out, so the phone's own proof — `scrollWidth <= 375` and real 44 × 44
      // boxes — is the E2E binding. Here the same contract is asserted on the markup the 375 px
      // breakpoint switches on: no raw-pixel width that wide, and touch-sized controls.
      opened = auditScreens();
    });

    When("the reader opens the Learn home, a path page, a learning page, and a course landing page", () => {
      expect(opened.map(({ name }) => name)).toEqual([
        "the Learn home",
        "a path page",
        "a learning page",
        "a course landing page",
      ]);
    });

    Then("no page scrolls horizontally", () => {
      for (const { name, oversizedWidths } of opened) {
        expect(oversizedWidths, `${name} declares a phone-overflowing width`).toEqual([]);
      }
    });

    And("every progress control is at least 44 by 44 CSS pixels", () => {
      for (const { name, controls } of opened) {
        expect(controls.length, `${name} carries a progress control`).toBeGreaterThan(0);

        for (const control of controls) {
          const where = `${name}: <${control.tag.toLowerCase()}> "${control.label}"`;
          // `min-h-11` is 44 px; full width below `sm` keeps a phone-width target wide enough.
          expect(control.className, where).toContain("min-h-11");
          expect(control.className, where).toContain("w-full");
        }
      }
    });
  });

  Scenario("Progress screens pass automated accessibility checks", ({ Given, When, Then }) => {
    let opened: ScreenAudit[];

    Given("a reader has saved progress", () => {
      noSavedProgress();
      markPagesComplete(BACKEND_ID, [firstPageOf(BACKEND_ID)]);
      expect(completedPages(BACKEND_ID)).toHaveLength(1);
    });

    When(
      "the Learn home, a path page, a learning page, and a course landing page are scanned for WCAG 2 A and AA rules",
      () => {
        opened = auditScreens();
      },
    );

    Then("no scan reports a violation", () => {
      const violations = opened.flatMap(({ name, violations: found }) =>
        found.map((violation) => `${name}: ${violation}`),
      );

      // Zero violations, exactly as the graded scan must report (S39).
      expect(violations).toEqual([]);
    });
  });
});
