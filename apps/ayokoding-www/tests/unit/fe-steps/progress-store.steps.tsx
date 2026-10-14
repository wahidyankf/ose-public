import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { expect, vi } from "vitest";
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
import { PROGRESS_STORAGE_KEY } from "@/features/learning-progress/core/progress-schema";
import {
  emptyProgress,
  parseProgress,
  serializeProgress,
  setPageComplete,
} from "@/features/learning-progress/core/progress-state";
import type { PathManifest } from "@/features/course-paths/core/schemas";
import { PathLanding } from "@/features/course-paths/shell/path-landing";
import { manifestFixture } from "../features/course-paths/manifest-fixture";
import { BASH_SEQUENCE } from "../features/learning-progress/lesson-fixtures";
import { completedPages, completionToggle, contextBar, noSavedProgress, openLessonPage } from "./helpers/lesson-page";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/learning-progress/progress-store.feature",
  ),
);

const PATH_ID = "careers/immediately-effective/backend-track";

/** Every network call the store's guard rails must never make, watched for the whole scenario. */
let networkCalls: string[] = [];
let originalFetch: typeof globalThis.fetch | undefined;
let xhrSend: ReturnType<typeof vi.spyOn> | null = null;

function watchNetwork(): void {
  networkCalls = [];
  originalFetch = globalThis.fetch;
  globalThis.fetch = ((input: unknown) => {
    networkCalls.push(String(input));
    return Promise.reject(new Error("the progress store must not fetch"));
  }) as typeof globalThis.fetch;
  xhrSend = vi.spyOn(globalThis.XMLHttpRequest.prototype, "send").mockImplementation(() => {
    networkCalls.push("XMLHttpRequest.send");
  });
}

function stopWatchingNetwork(): void {
  if (originalFetch === undefined) {
    delete (globalThis as unknown as { fetch?: unknown }).fetch;
  } else {
    globalThis.fetch = originalFetch;
  }
  xhrSend?.mockRestore();
  xhrSend = null;
}

/**
 * Blocking storage (tech-docs/006's blocked-storage technique): every `localStorage` method the
 * store can reach throws, exactly as a browser with site storage switched off does. The methods
 * are restored when the scenario ends, but the shared store itself stays in memory mode — which is
 * what tech-docs/002 promises for the life of the tab. This scenario is therefore the last one in
 * the file, and any scenario added after it must account for a memory-only store.
 */
let blockedStorageMethods: {
  getItem: typeof Storage.prototype.getItem;
  setItem: typeof Storage.prototype.setItem;
  removeItem: typeof Storage.prototype.removeItem;
} | null = null;

function blockStorage(): void {
  const blocked = () => {
    throw new DOMException("blocked", "SecurityError");
  };
  blockedStorageMethods = {
    getItem: Storage.prototype.getItem,
    setItem: Storage.prototype.setItem,
    removeItem: Storage.prototype.removeItem,
  };
  Storage.prototype.getItem = blocked;
  Storage.prototype.setItem = blocked;
  Storage.prototype.removeItem = blocked;
}

function unblockStorage(): void {
  if (blockedStorageMethods === null) return;
  Storage.prototype.getItem = blockedStorageMethods.getItem;
  Storage.prototype.setItem = blockedStorageMethods.setItem;
  Storage.prototype.removeItem = blockedStorageMethods.removeItem;
  blockedStorageMethods = null;
}

function storedRecord() {
  return parseProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).state;
}

const SECOND_PATH_ID = "skills/e2e-fixture-alpha";

/**
 * The path page the store's own scenarios render: the backend-track fixture's three-course order,
 * the same manifest `lesson-fixtures.ts` gives the lesson-page helpers, so a unit assertion and its
 * browser binding describe one reader experience.
 */
function backendTrackManifest(): PathManifest {
  return manifestFixture({
    pathId: PATH_ID,
    arc: "immediately-effective",
    title: "Backend Track",
    description: "Write shell scripts, serve an HTTP backend, and store its data.",
    phases: [
      {
        id: "fixture-core",
        title: "Fixture core",
        kind: "core",
        outcome: { can: "complete this fixture path" },
        courses: ["just-enough-bash", "backend-essentials", "sql-essentials"],
      },
    ],
  });
}

/** A second path that lists the same course — S3's "every path that contains the course". */
function sharedCourseManifest(): PathManifest {
  return manifestFixture({
    pathId: SECOND_PATH_ID,
    arc: "e2e-fixture-alpha-track",
    title: "E2E Fixture Alpha Skills Path",
    description: "A second path that lists the same course.",
    phases: [
      {
        id: "fixture-core",
        title: "Fixture core",
        kind: "core",
        outcome: { can: "complete this fixture path" },
        courses: ["just-enough-bash"],
      },
    ],
  });
}

const PATH_COURSE_TITLES: Record<string, string> = {
  "just-enough-bash": "Just Enough Bash",
  "backend-essentials": "Backend Essentials",
  "sql-essentials": "SQL Essentials",
};

/** Every course's lesson page paths, so a course counts as done only when all of them are done. */
const PATH_SEQUENCES = { "just-enough-bash": BASH_SEQUENCE.map((page) => page.pagePath) };

/**
 * Render `copies` of one path page — one per "tab". Every render starts from a clean tree; a
 * scenario that needs two tabs renders both into the same document, because the store is
 * app-wide, exactly as it is across the tabs of one browser.
 */
function renderPathPage(manifest: PathManifest = backendTrackManifest(), copies = 1): ReturnType<typeof render> {
  cleanup();
  return render(
    <>
      {Array.from({ length: copies }, (_, index) => (
        <PathLanding
          key={index}
          locale="en"
          manifest={manifest}
          courseTitles={PATH_COURSE_TITLES}
          sequences={PATH_SEQUENCES}
        />
      ))}
    </>,
  );
}

/** Every path headline in `container`, in document order — one per rendered path page. */
function headlinesIn(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>("p")).filter((element) =>
    /^\d+ of \d+ core courses done$/u.test(element.textContent ?? ""),
  );
}

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {
      stopWatchingNetwork();
      unblockStorage();
      noSavedProgress();
    });
  });

  Scenario("Marking a page complete is saved in this browser only", ({ Given, When, Then, And }) => {
    Given("a reader has no saved progress", () => {
      noSavedProgress();
      expect(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();
      watchNetwork();
    });

    When("the reader marks a learning page as complete", () => {
      openLessonPage({ pagePath: "learning/beginner", pathParam: PATH_ID });
      fireEvent.click(completionToggle());
    });

    And("the reader reloads the page", () => {
      // A reload re-reads the same key through the same store: the visit writes a record, and the
      // completion must survive it.
      openLessonPage({ pagePath: "learning/beginner", pathParam: PATH_ID });
    });

    Then("the page is still shown as completed", () => {
      expect(completionToggle().getAttribute("aria-pressed")).toBe("true");
      expect(completedPages()).toEqual(["learning/beginner"]);
    });

    And("no network request sent while marking carries the progress data", () => {
      expect(networkCalls).toEqual([]);
      expect(JSON.stringify(storedRecord())).toContain("learning/beginner");
      stopWatchingNetwork();
    });
  });

  Scenario("A completed page can be un-checked", ({ Given, When, Then, And }) => {
    Given("a reader has marked a learning page as complete", () => {
      noSavedProgress();
      openLessonPage({ pagePath: "learning/beginner", pathParam: PATH_ID });
      fireEvent.click(completionToggle());
      expect(completionToggle().getAttribute("aria-pressed")).toBe("true");
      expect(contextBar().textContent).toContain("1 of 3 pages done");
    });

    When("the reader activates the completed control again", () => {
      fireEvent.click(completionToggle());
    });

    Then("the page is shown as not completed", () => {
      expect(completionToggle().getAttribute("aria-pressed")).toBe("false");
      expect(completionToggle().textContent).toContain("Mark as complete");
    });

    And("the course's pages-done count goes down by one", () => {
      expect(contextBar().textContent).toContain("0 of 3 pages done");
      expect(completedPages()).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // S3, S5, and S9 are bound here, and deliberately BEFORE S4: S4's blocked-storage scenario leaves
  // the app-wide store in memory mode for the life of the "tab" (tech-docs/002), and every scenario
  // below reads the shared key, or re-reads it on a `storage` event.
  // -------------------------------------------------------------------------

  Scenario("Progress is shared by every path that contains the course", ({ Given, When, Then, And }) => {
    let secondPath: PathManifest;

    Given("a course belongs to two paths", () => {
      secondPath = sharedCourseManifest();
      expect(backendTrackManifest().courseOrder).toContain("just-enough-bash");
      expect(secondPath.courseOrder).toContain("just-enough-bash");
    });

    And("the reader completed every learning page of that course while following the first path", () => {
      // Every page of the course, through the lesson page's own completion control, with the first
      // path in context — the record carries no path, which is why the second path sees it too.
      for (const page of BASH_SEQUENCE) {
        openLessonPage({ pagePath: page.pagePath, pathParam: PATH_ID });
        fireEvent.click(completionToggle());
      }

      expect(completedPages()).toHaveLength(BASH_SEQUENCE.length);
      expect(storedRecord().completed["just-enough-bash"]?.length).toBe(BASH_SEQUENCE.length);
    });

    When("the reader opens the second path's page", () => {
      renderPathPage(secondPath);
    });

    Then('that course\'s card shows "Done"', () => {
      const row = screen.getByRole("link", { name: "Just Enough Bash" }).closest("li");
      expect(row).not.toBeNull();
      expect(within(row as HTMLElement).getByText("Done", { exact: true })).toBeTruthy();
    });
  });

  Scenario("Unreadable saved progress is ignored and replaced", ({ Given, When, Then, And }) => {
    Given("the saved progress record cannot be read as valid progress", () => {
      window.localStorage.setItem(PROGRESS_STORAGE_KEY, "not json");
      // What another tab's write to the same key says to this one: re-read it. The store finds the
      // record unreadable and starts from empty progress rather than trusting the bytes.
      window.dispatchEvent(new StorageEvent("storage", { key: PROGRESS_STORAGE_KEY }));
      expect(parseProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).recovered).toBe(true);
    });

    When("the reader opens a path page", () => {
      renderPathPage();
    });

    Then('every course card shows "Not started"', () => {
      const nav = screen.getByRole("navigation", { name: "Backend Track syllabus" });
      const rows = within(nav).getAllByRole("listitem");
      expect(rows).toHaveLength(3);

      for (const row of rows) {
        expect(within(row).getByText("Not started", { exact: true })).toBeTruthy();
      }
    });

    And("marking a learning page as complete saves a valid progress record", () => {
      openLessonPage({ pagePath: "learning/beginner", pathParam: PATH_ID });
      fireEvent.click(completionToggle());

      const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
      expect(raw).not.toBeNull();
      expect(raw).not.toBe("not json");

      const { state, recovered } = parseProgress(raw);
      expect(recovered).toBe(false);
      expect(state.completed["just-enough-bash"]).toEqual(["learning/beginner"]);
    });
  });

  Scenario("Progress updates in another open tab", ({ Given, When, Then }) => {
    let container: HTMLElement;
    let firstHeadline: HTMLElement;

    Given("the same path page is open in two tabs", () => {
      container = renderPathPage(backendTrackManifest(), 2).container;

      const headlines = headlinesIn(container);
      expect(headlines.map((element) => element.textContent)).toEqual([
        "0 of 3 core courses done",
        "0 of 3 core courses done",
      ]);
      firstHeadline = headlines[0] as HTMLElement;
    });

    When("the reader marks a learning page as complete in a third tab", () => {
      // A third tab is another document on the same origin: it writes the shared record itself, and
      // the browser tells the open tabs about it through the `storage` event — nothing reloads.
      const thirdTab = BASH_SEQUENCE.reduce(
        (state, page) => setPageComplete(state, "just-enough-bash", page.pagePath, true),
        emptyProgress(),
      );
      window.localStorage.setItem(PROGRESS_STORAGE_KEY, serializeProgress(thirdTab));
      window.dispatchEvent(new StorageEvent("storage", { key: PROGRESS_STORAGE_KEY }));
    });

    Then("both open tabs show the new count without a reload", () => {
      const headlines = headlinesIn(container);
      expect(headlines.map((element) => element.textContent)).toEqual([
        "1 of 3 core courses done",
        "1 of 3 core courses done",
      ]);
      // The very element the first tab rendered is the one that changed: neither tab was re-mounted
      // (a reload builds a new tree) — the count arrived through the store's own notification.
      expect(headlines[0]).toBe(firstHeadline);
    });
  });

  Scenario("The site still works when browser storage is blocked", ({ Given, When, Then, And }) => {
    Given("the browser refuses to read or write site storage", () => {
      noSavedProgress();
      blockStorage();
    });

    When("the reader opens a learning page and marks it as complete", () => {
      openLessonPage({ pagePath: "learning/beginner", pathParam: PATH_ID });
      fireEvent.click(completionToggle());
    });

    Then("the page is shown as completed for the rest of the visit", () => {
      expect(completionToggle().getAttribute("aria-pressed")).toBe("true");
      expect(contextBar().textContent).toContain("1 of 3 pages done");
    });

    And("a notice says progress cannot be saved in this browser", () => {
      expect(
        screen.getByText("Progress can't be saved in this browser. It lasts until you close this tab."),
      ).toBeTruthy();
    });

    And("the page shows no error", () => {
      expect(screen.queryByRole("alert")).toBeNull();
      unblockStorage();
    });
  });
});
