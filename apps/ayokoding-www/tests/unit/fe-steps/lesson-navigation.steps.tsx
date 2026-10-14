import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { fireEvent, within } from "@testing-library/react";
import { expect, vi } from "vitest";
import "./helpers/test-setup";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// The same shape as the real hook: `data` is the `initial` fallback until a runtime refresh lands,
// and the lesson chrome reads it as soon as it is ready.
vi.mock("@/features/course-paths/shell/use-runtime-course-path-data", () => ({
  useRuntimeCoursePathData: (_locale: string, initial: unknown) => ({ data: initial, isReady: true }),
}));

// eslint-disable-next-line import/first
import { PROGRESS_STORAGE_KEY } from "@/features/learning-progress/core/progress-schema";
// eslint-disable-next-line import/first
import { BACKEND_TRACK, BASH_SEQUENCE } from "../features/learning-progress/lesson-fixtures";
// eslint-disable-next-line import/first
import {
  actionRow,
  activatePrimary,
  completedPages,
  contextBar,
  noSavedProgress,
  openLessonPage,
} from "./helpers/lesson-page";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/learning-progress/lesson-navigation.feature",
  ),
);

const PATH_HREF = "/en/learn/paths/careers/immediately-effective/backend-track";
const PATH_ID = BACKEND_TRACK.pathId;

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {
      noSavedProgress();
    });
  });

  Scenario("The context bar shows where the reader is in a path", ({ When, Then, And }) => {
    When("a reader opens a learning page of a course in path context", () => {
      openLessonPage({ pagePath: "learning/beginner" });
    });

    Then("the context bar links to the path page", () => {
      expect(within(contextBar()).getByRole("link", { name: "Backend Track" }).getAttribute("href")).toBe(PATH_HREF);
    });

    And("it names the phase that contains the course", () => {
      expect(within(contextBar()).getByRole("link", { name: "Phase 1 · Fixture core" }).getAttribute("href")).toBe(
        `${PATH_HREF}#phase-fixture-core`,
      );
    });

    And('it shows "Course k of N" for the course\'s position in the path', () => {
      expect(within(contextBar()).getByRole("link", { name: "Course 1 of 3" }).getAttribute("href")).toBe(
        `/en/learn/courses/just-enough-bash?path=${PATH_ID}`,
      );
    });

    And('it shows "Page p of P" and how many pages of the course are done', () => {
      expect(contextBar().textContent).toContain("Page 2 of 3");
      expect(contextBar().textContent).toContain("0 of 3 pages done");
    });
  });

  Scenario("The context bar works without a path", ({ When, Then, And }) => {
    When("a reader opens a learning page with no path context and no remembered path for that course", () => {
      noSavedProgress();
      openLessonPage({ pagePath: "learning/beginner", pathParam: null });
    });

    Then('the context bar shows the course title, "Page p of P", and how many pages are done', () => {
      expect(within(contextBar()).getByRole("link", { name: "Just Enough Bash" }).getAttribute("href")).toBe(
        "/en/learn/courses/just-enough-bash",
      );
      expect(contextBar().textContent).toContain("Page 2 of 3");
      expect(contextBar().textContent).toContain("0 of 3 pages done");
    });

    And("it shows no path or phase link", () => {
      expect(within(contextBar()).getAllByRole("link")).toHaveLength(1);
      expect(contextBar().textContent).not.toContain("Backend Track");
      expect(contextBar().textContent).not.toContain("Phase 1");
    });
  });

  Scenario("Mark complete and continue opens the next learning page", ({ Given, When, Then, And }) => {
    let activated = { href: "", text: "" };

    Given("a reader is on a learning page that is not the course's last page", () => {
      openLessonPage({ pagePath: "learning/beginner" });
      expect(BASH_SEQUENCE.at(-1)?.pagePath).not.toBe("learning/beginner");
    });

    When('the reader activates "Mark complete & continue"', () => {
      activated = activatePrimary();
    });

    Then("the next learning page of the course opens", () => {
      expect(activated.href).toBe(`/en/learn/courses/just-enough-bash/learning/advanced?path=${PATH_ID}`);
      expect(activated.text).toContain("Next: Advanced Examples");
    });

    And("the previous page is counted as done", () => {
      expect(completedPages()).toContain("learning/beginner");
    });
  });

  Scenario("The last page of a course leads to the next course in the path", ({ Given, When, Then, And }) => {
    let activated = { href: "", text: "" };

    Given("a reader is on the last learning page of a course in path context", () => {
      openLessonPage({ pagePath: "learning/advanced" });
    });

    And("the path has a course after it", () => {
      expect(BACKEND_TRACK.courseOrder.indexOf("just-enough-bash")).toBeLessThan(BACKEND_TRACK.courseOrder.length - 1);
    });

    When('the reader activates "Mark complete & continue"', () => {
      activated = activatePrimary();
    });

    Then("the next course's landing page opens in the same path context", () => {
      expect(activated.href).toBe(`/en/learn/courses/backend-essentials?path=${PATH_ID}`);
      expect(activated.text).toContain("Next course: Backend Essentials");
    });
  });

  Scenario("The last page of the path leads back to the path page", ({ Given, When, Then }) => {
    let activated = { href: "", text: "" };

    Given("a reader is on the last learning page of the path's last course in path context", () => {
      openLessonPage({ courseId: "sql-essentials", pagePath: "learning/advanced" });
    });

    When('the reader activates "Mark complete & continue"', () => {
      activated = activatePrimary();
    });

    Then("the path page opens", () => {
      expect(activated.href).toBe(PATH_HREF);
      expect(activated.text).toContain("Back to the path");
    });
  });

  Scenario("Without a path, the last page leads back to the course landing page", ({ Given, When, Then }) => {
    let activated = { href: "", text: "" };

    Given("a reader is on a course's last learning page with no path context", () => {
      noSavedProgress();
      openLessonPage({ pagePath: "learning/advanced", pathParam: null });
    });

    When('the reader activates "Mark complete & continue"', () => {
      activated = activatePrimary();
    });

    Then("the course landing page opens", () => {
      expect(activated.href).toBe("/en/learn/courses/just-enough-bash");
      expect(activated.text).toContain("Back to the course");
    });
  });

  Scenario("Previous goes back one page, then to the course landing page", ({ Given, When, Then }) => {
    Given("a reader is on the first learning page of a course", () => {
      openLessonPage({ pagePath: "learning/overview" });
    });

    Then('"Previous" links to the course landing page', () => {
      expect(
        within(actionRow())
          .getByRole("link", { name: /Previous: Just Enough Bash/ })
          .getAttribute("href"),
      ).toBe(`/en/learn/courses/just-enough-bash?path=${PATH_ID}`);
    });

    When("the reader opens the second learning page", () => {
      openLessonPage({ pagePath: "learning/beginner" });
    });

    Then('"Previous" links to the first learning page', () => {
      expect(
        within(actionRow())
          .getByRole("link", { name: /Previous: Overview/ })
          .getAttribute("href"),
      ).toBe(`/en/learn/courses/just-enough-bash/learning/overview?path=${PATH_ID}`);
    });
  });

  Scenario("The path context is remembered inside the same course", ({ Given, When, Then, And }) => {
    Given("a reader opened a course's learning page in path context", () => {
      noSavedProgress();
      openLessonPage({ pagePath: "learning/overview" });
    });

    When("the reader opens another learning page of the same course from a link without path context", () => {
      openLessonPage({ pagePath: "learning/beginner", pathParam: null });
    });

    Then("the context bar still shows the same path and phase", () => {
      expect(within(contextBar()).getByRole("link", { name: "Backend Track" }).getAttribute("href")).toBe(PATH_HREF);
      expect(within(contextBar()).getByRole("link", { name: "Phase 1 · Fixture core" })).toBeTruthy();
    });

    And("the navigation links keep the path context", () => {
      const hrefs = within(actionRow())
        .getAllByRole("link")
        .map((link) => link.getAttribute("href"));
      expect(hrefs).toContain(`/en/learn/courses/just-enough-bash/learning/overview?path=${PATH_ID}`);
      expect(hrefs).toContain(`/en/learn/courses/just-enough-bash/learning/advanced?path=${PATH_ID}`);
    });
  });

  Scenario("Opening or scrolling a page never marks it complete", ({ Given, When, Then }) => {
    Given("a reader has no saved progress", () => {
      noSavedProgress();
      expect(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();
    });

    When("the reader opens a learning page and scrolls to its end", () => {
      openLessonPage({ pagePath: "learning/beginner" });
      fireEvent.scroll(window);
      fireEvent.scroll(document.documentElement);
    });

    Then("the page is not counted as done", () => {
      expect(completedPages()).toEqual([]);
      expect(contextBar().textContent).toContain("0 of 3 pages done");
      expect(
        within(actionRow())
          .getByRole("button", { name: /Mark as complete/ })
          .getAttribute("aria-pressed"),
      ).toBe("false");
    });
  });
});
