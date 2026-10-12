import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { act, cleanup, render, screen, within, fireEvent } from "@testing-library/react";
import { expect, vi, type MockInstance } from "vitest";

// course-paths plan (ayokoding-learning-path-03-navigation-ui), Cycles 2.2, 2.8, 2.9 — step
// bindings for path-order-nav.feature's 3 scenarios, reusing the fixtures and rendering
// approach already proven in route-path-context.test.tsx / path-rail.test.tsx / mobile-nav.test.tsx.

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/navigation/shell/toc", () => ({
  TableOfContents: () => null,
}));

let mockPathname = "/en/browse";
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// The Header (used only by the drawer-close regression's general-navigation branch) pulls the
// theme context; mirror responsive.steps.tsx's mock.
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

vi.mock("@/lib/trpc/client", () => ({
  trpcClient: {
    content: {
      getTree: { query: vi.fn().mockResolvedValue([]) },
    },
  },
}));

const { fixtureManifest, courseTitles, contentMap, pages } = vi.hoisted(() => {
  // Hand-expanded (not manifestFixture): vi.hoisted factories run before imports, so the
  // fixture helper is unreachable here. `phases` mirrors `courseOrder` exactly, the way the
  // schema's legacy normalization derives it.
  const manifest = {
    pathId: "skills/python-fundamentals",
    arc: "python-fundamentals",
    title: "Python Fundamentals",
    description: "Learn Python from the ground up.",
    assumes: [],
    phases: [
      {
        id: "phase-a",
        title: "Phase A",
        kind: "core" as const,
        outcome: { can: "complete this fixture path" },
        courses: ["version-control-and-git", "just-enough-python", "data-structures-and-algorithms-essentials"],
      },
    ],
    courseOrder: ["version-control-and-git", "just-enough-python", "data-structures-and-algorithms-essentials"],
  };

  function meta(slug: string, title: string) {
    return {
      title,
      slug,
      locale: "en",
      weight: 0,
      tags: [],
      draft: false,
      isSection: false,
      filePath: `/tmp/${slug}.md`,
    };
  }

  const map = new Map([
    ["en:learn/courses/version-control-and-git", meta("learn/courses/version-control-and-git", "Git")],
    ["en:learn/courses/just-enough-python", meta("learn/courses/just-enough-python", "Just Enough Python")],
    [
      "en:learn/courses/data-structures-and-algorithms-essentials",
      meta("learn/courses/data-structures-and-algorithms-essentials", "Data Structures & Algorithms"),
    ],
  ]);

  const pageBySlug = new Map<
    string,
    { title: string; html: string; headings: []; date: null; prev: null; next: null }
  >();
  for (const [, m] of map) {
    pageBySlug.set(m.slug, {
      title: m.title,
      html: `<p>${m.title}</p>`,
      headings: [],
      date: null,
      prev: null,
      next: null,
    });
  }

  return {
    fixtureManifest: manifest,
    courseTitles: {
      "version-control-and-git": "Git",
      "just-enough-python": "Just Enough Python",
      "data-structures-and-algorithms-essentials": "Data Structures & Algorithms",
    },
    contentMap: map,
    pages: pageBySlug,
  };
});

vi.mock("@/lib/trpc/server", () => ({
  serverCaller: {
    content: {
      getBySlug: vi.fn(async ({ slug }: { slug: string }) => {
        const page = pages.get(slug);
        if (!page) throw new Error(`no fixture page for slug ${slug}`);
        return page;
      }),
    },
  },
}));

vi.mock("@/features/app-shell/shell/trpc-init", () => ({
  createTRPCContext: () => ({
    contentService: { getIndex: async () => ({ contentMap, trees: {}, prevNext: new Map() }) },
  }),
}));

vi.mock("@/features/course-paths/shell/manifest-repository", () => ({
  loadManifests: vi.fn().mockResolvedValue([fixtureManifest]),
  defaultManifestsDir: () => "unused-in-test",
}));

// eslint-disable-next-line import/first
import { renderCoursePathPage } from "../render-course-path-page";
// eslint-disable-next-line import/first
import { PathRail } from "@/features/course-paths/shell/path-rail";
// eslint-disable-next-line import/first
import { MobileNav } from "@/features/app-shell/shell/mobile-nav";
import { Header } from "@/features/app-shell/shell/header";
// eslint-disable-next-line import/first
import { PathBanner } from "@/features/course-paths/shell/path-banner";
// eslint-disable-next-line import/first
import { MobileNavOpenProvider } from "@/features/app-shell/shell/mobile-nav-open-provider";
// eslint-disable-next-line import/first
import { useMobileNavOpen } from "@/features/app-shell/shell/use-mobile-nav-open";

function MobileNavConsumer() {
  const { open, setOpen } = useMobileNavOpen();
  return (
    <MobileNav
      locale="en"
      open={open}
      onOpenChange={setOpen}
      manifests={[fixtureManifest]}
      courseTitles={courseTitles}
    />
  );
}

// ---------------------------------------------------------------------------
// plan ayokoding-learn-revamp-01 §4.3 (Phase 5 RED) — scroll-geometry mocks for the S5 scenario.
// jsdom has no layout, so the rail's scroll container gets its `scrollHeight`/`clientHeight`
// pinned with Object.defineProperty and HTMLElement.prototype.getBoundingClientRect is patched
// per element (the container reports top 0 / height 300; every rail row reports top 900 /
// height 44, so the current row — course 3 of 3 — starts below the container's visible box).
// window.scrollTo is spied so the "page itself stays scrolled to the top" step can prove the
// helper never touches it (tech-docs §4.3: container `scrollTop` only).
// ---------------------------------------------------------------------------

let railScrollContainer: HTMLElement | null = null;
let railJsx: React.ReactElement | null = null;
let scrollToSpy: MockInstance | null = null;
let rectPatchInstalled = false;

function jsdomRect(top: number, height: number): DOMRect {
  return {
    top,
    height,
    bottom: top + height,
    left: 0,
    x: 0,
    y: top,
    width: 0,
    right: 0,
    toJSON: () => ({}),
  } as unknown as DOMRect;
}

function railRectMock(this: HTMLElement): DOMRect {
  if (this === railScrollContainer) return jsdomRect(0, 300);
  if (this instanceof HTMLLIElement) return jsdomRect(900, 44);
  return jsdomRect(0, 0);
}

function installRailScrollGeometry(): void {
  // @amiceli/vitest-cucumber runs every STEP as its own vitest test, so there is no per-scenario
  // afterEach to lean on: state lives in these module variables across a scenario's steps, the
  // installer re-cleans anything a previous (failed) run left behind, and the S5 And step restores
  // best-effort. S5 is this file's last scenario, and a leaked patch cannot outlive the worker.
  restoreRailScrollGeometry();

  railScrollContainer = document.createElement("div");
  document.body.append(railScrollContainer);
  Object.defineProperty(railScrollContainer, "scrollHeight", { configurable: true, value: 1200 });
  Object.defineProperty(railScrollContainer, "clientHeight", { configurable: true, value: 300 });
  railScrollContainer.style.overflowY = "auto";

  // An own property on HTMLElement.prototype shadows Element.prototype's method for HTML
  // elements; deleting it below restores the original without ever overwriting the descriptor.
  Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
    configurable: true,
    writable: true,
    value: railRectMock,
  });
  rectPatchInstalled = true;

  scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
}

function restoreRailScrollGeometry(): void {
  if (rectPatchInstalled) {
    delete (HTMLElement.prototype as unknown as { getBoundingClientRect?: unknown }).getBoundingClientRect;
    rectPatchInstalled = false;
  }
  scrollToSpy?.mockRestore();
  scrollToSpy = null;
  railScrollContainer?.remove();
  railScrollContainer = null;
  railJsx = null;
}

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/path-order-nav.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  Scenario("Prev and next follow the active path's order", ({ Given, When, Then, And }) => {
    let jsx: React.ReactElement;

    Given("a reader is on a course with an active path context", async () => {
      jsx = await renderCoursePathPage({
        locale: "en",
        slug: ["learn", "courses", "just-enough-python"],
        search: { path: fixtureManifest.pathId },
      });
    });

    When("the reader reads the prev/next navigation", () => {
      cleanup();
      render(jsx);
    });

    Then("prev and next are the neighboring courses in that path's manifest", () => {
      const pageNav = within(screen.getByRole("navigation", { name: "Page navigation" }));
      expect(pageNav.getByRole("link", { name: /Git/i })).toBeTruthy();
      expect(pageNav.getByRole("link", { name: /Data Structures/i })).toBeTruthy();
    });

    And("both links preserve the path context query parameter", () => {
      const pageNav = within(screen.getByRole("navigation", { name: "Page navigation" }));
      expect(pageNav.getByRole("link", { name: /Git/i }).getAttribute("href")).toBe(
        `/en/learn/courses/version-control-and-git?path=${fixtureManifest.pathId}`,
      );
      expect(pageNav.getByRole("link", { name: /Data Structures/i }).getAttribute("href")).toBe(
        `/en/learn/courses/data-structures-and-algorithms-essentials?path=${fixtureManifest.pathId}`,
      );
    });
  });

  Scenario(
    "The path rail shows the whole ordered arc beside a course at desktop width",
    ({ Given, When, Then, And }) => {
      Given("a reader opens a course in path context on a desktop-width viewport", () => {
        Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
        expect(window.innerWidth).toBeGreaterThanOrEqual(768);
      });

      // "the page renders" is shared with the S5 scenario below: each Given stages what this step
      // renders — the S5 Given also stages the scroll container the rail must render into.
      When("the page renders", () => {
        cleanup();
        render(
          railJsx ?? (
            <PathRail
              locale="en"
              manifest={fixtureManifest}
              currentCourseId="just-enough-python"
              courseTitles={courseTitles}
            />
          ),
          railScrollContainer ? { container: railScrollContainer } : undefined,
        );
      });

      Then(
        "the left rail lists that path's courses grouped under phase headings in manifest order with the current course marked",
        () => {
          const rail = screen.getByRole("navigation", { name: "Python Fundamentals course list" });
          expect(screen.getByText("Phase 1 · Phase A")).toBeTruthy();
          const items = rail.querySelectorAll("li");
          expect(items.length).toBe(3);
          expect(items[0]?.textContent).toContain("Git");
          expect(items[1]?.textContent).toContain("Just Enough Python");
          expect(items[2]?.textContent).toContain("Data Structures");
        },
      );

      And("the current course is distinguished by a marker and weight, not by colour alone", () => {
        const current = screen.getByRole("link", { name: /Just Enough Python/i });
        expect(current.getAttribute("aria-current")).toBe("page");
        expect(current.textContent).toContain("▸");
        expect(current.className).toContain("font-semibold");
      });

      And("the rail offers a link back to the full path and to the whole course library", () => {
        expect(screen.getByRole("link", { name: /view full path/i })).toBeTruthy();
        expect(screen.getByRole("link", { name: /browse all courses/i })).toBeTruthy();
      });
    },
  );

  Scenario("The path rail collapses into the existing navigation drawer on a phone", ({ Given, When, Then, And }) => {
    let trigger: HTMLElement;

    Given("a reader opens a course in path context on a phone-width viewport", () => {
      mockPathname = "/en/learn/courses/just-enough-python";
      mockSearchParams = new URLSearchParams({ path: fixtureManifest.pathId });
    });

    When('they activate the path readout\'s "open path course list" control', () => {
      cleanup();
      render(
        <MobileNavOpenProvider>
          <PathBanner locale="en" pathTitle="Python Fundamentals" courseIndex={2} totalCourses={3} />
          <MobileNavConsumer />
        </MobileNavOpenProvider>,
      );
      trigger = screen.getByRole("button", { name: /Open path course list/i });
      fireEvent.click(trigger);
    });

    Then("the existing left navigation drawer opens showing that path's ordered courses", () => {
      expect(screen.getByRole("navigation", { name: "Python Fundamentals course list" })).toBeTruthy();
    });

    And("focus moves into the drawer and returns to the control when the drawer is dismissed", async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(document.activeElement).not.toBe(trigger);
      fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(document.activeElement).toBe(trigger);
    });
  });

  // UWT-008 fix (phase-8 rule-15 retest): picking a course inside the pocket drawer must close
  // the drawer, matching the primary-navigation links' pre-existing behaviour. RED until the
  // drawer wraps its rail in a click handler that clears the open state.
  Scenario("Picking a course in the pocket drawer closes the drawer", ({ Given, When, Then, And }) => {
    Given("a reader has the pocket drawer open from a course's path readout", () => {
      mockPathname = "/en/learn/courses/just-enough-python";
      mockSearchParams = new URLSearchParams({ path: fixtureManifest.pathId });
      cleanup();
      render(
        <MobileNavOpenProvider>
          <PathBanner locale="en" pathTitle="Python Fundamentals" courseIndex={2} totalCourses={3} />
          <MobileNavConsumer />
        </MobileNavOpenProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: /Open path course list/i }));
    });

    When("they pick another course's row in the drawer", async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      const drawerNav = screen.getByRole("navigation", { name: /course list/ });
      const rows = drawerNav.querySelectorAll("a");
      expect(rows.length).toBeGreaterThanOrEqual(2);
      fireEvent.click(rows[1]!);
    });

    Then("the drawer closes and the drawer-open state is cleared", async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(screen.queryByRole("navigation", { name: /course list/ })).toBeNull();
    });

    And("the primary navigation links still close the drawer as before", async () => {
      // Exercise the untouched general-navigation branch the way the responsive steps do: the
      // header hamburger opens the drawer in menu mode (no path context, so `active` is null and
      // the drawer renders its primary-nav links).
      mockSearchParams = new URLSearchParams();
      cleanup();
      render(
        <MobileNavOpenProvider>
          <Header locale="en" />
          <MobileNavConsumer />
        </MobileNavOpenProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      // Radix marks the closed-sheet content `aria-hidden` in this mocked environment, so query
      // the raw links inside the drawer for this mechanical close-on-pick check.
      const drawer = document.querySelector("#mobile-nav-drawer");
      expect(drawer).toBeTruthy();
      fireEvent.click(drawer!.querySelectorAll("a")[0]!);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(document.querySelector("#mobile-nav-drawer")).toBeNull();
    });
  });

  // plan ayokoding-learn-revamp-01 §4.3 (Phase 5 RED) — S5. The rail renders inside a container
  // whose scroll geometry mocks a sidebar too short for the list (Decision D5/D11's hidden-row
  // state), so rendering must scroll that container — and never the page.
  Scenario(
    "The path rail scrolls the current course into view without moving the page",
    ({ Given, When, Then, And }) => {
      Given("a reader opens a course whose rail row starts below the visible part of the sidebar", () => {
        installRailScrollGeometry();
        railJsx = (
          <PathRail
            locale="en"
            manifest={fixtureManifest}
            // Course 3 of 3 — the row whose mocked rect (top 900) starts below the container's
            // visible box (top 0, height 300).
            currentCourseId="data-structures-and-algorithms-essentials"
            courseTitles={courseTitles}
          />
        );
      });

      When("the page renders", () => {
        cleanup();
        render(
          railJsx ?? (
            <PathRail
              locale="en"
              manifest={fixtureManifest}
              currentCourseId="just-enough-python"
              courseTitles={courseTitles}
            />
          ),
          railScrollContainer ? { container: railScrollContainer } : undefined,
        );
      });

      Then("the sidebar scrolls so the current course's row is fully visible", () => {
        expect(railScrollContainer, "the S5 Given must have installed a scroll container").not.toBeNull();
        // GREEN: the effect centres the hidden row → 0 + (900 - 0) - (300 - 44) / 2 = 772.
        // RED: the rail has no auto-scroll wiring yet, so scrollTop never leaves 0.
        expect(railScrollContainer!.scrollTop).toBeGreaterThan(0);
      });

      And("the page itself stays scrolled to the top", () => {
        expect(scrollToSpy, "the S5 Given must have spied window.scrollTo").not.toBeNull();
        expect(scrollToSpy).not.toHaveBeenCalled();
        expect(window.scrollY).toBe(0);

        // Best-effort teardown now that the scenario reached its last step; if an earlier step
        // failed first, the next installRailScrollGeometry() re-cleans instead.
        restoreRailScrollGeometry();
      });
    },
  );
});
