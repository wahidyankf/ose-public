import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { fireEvent, screen } from "@testing-library/react";
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
import { parseProgress } from "@/features/learning-progress/core/progress-state";
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
