import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { expect, vi } from "vitest";

const getTree = vi.hoisted(() => vi.fn().mockResolvedValue([]));
vi.mock("@/lib/trpc/client", () => ({
  trpcClient: {
    content: { getTree: { query: getTree } },
    coursePaths: {
      getRouteData: {
        query: vi.fn().mockResolvedValue({
          manifests: [],
          prerequisitesByCourse: {},
          libraryCourseIds: [],
          outlineCourseIds: [],
          courseLinks: {},
        }),
      },
    },
  },
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/en/learn/example",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

import "./helpers/test-setup";
import { CoursePageContent } from "@/features/course-paths/shell/course-page-content";
import { ResizableSidebar } from "@/features/navigation/shell/resizable-sidebar";
import { Header } from "@/features/app-shell/shell/header";
import { MobileNavOpenProvider } from "@/features/app-shell/shell/mobile-nav-open-provider";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/app-shell/responsive.feature"),
);

const renderData = {
  activeContext: null,
  prerequisiteLinks: [],
  pathBadges: [],
  prev: null,
  next: null,
};

function renderContentLayout() {
  render(
    <div className="flex">
      <ResizableSidebar locale="en">
        <nav aria-label="Section navigation">Sections</nav>
      </ResizableSidebar>
      <CoursePageContent
        locale="en"
        slug="learn/example"
        title="Example"
        html="<p>Article body</p>"
        headings={[{ id: "intro", text: "Introduction", level: 2 }]}
        breadcrumbSegments={[{ label: "Learn", slug: "learn" }]}
        renderData={renderData}
      />
    </div>,
  );
}

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
  AfterEachScenario(cleanup);

  Background(({ Given }) => {
    Given("the app is running", () => {
      expect(Header).toBeTypeOf("function");
    });
  });

  Scenario("Desktop viewport shows sidebar, content, and table of contents", ({ Given, When, Then, And }) => {
    Given('the viewport is set to "desktop" (1280x800)', () => {
      Object.defineProperties(window, {
        innerWidth: { configurable: true, value: 1280 },
        innerHeight: { configurable: true, value: 800 },
      });
    });

    When("a visitor opens a content page", renderContentLayout);

    Then("the sidebar navigation should be visible", () => {
      expect(screen.getByRole("navigation", { name: "Section navigation" }).closest("aside")?.className).toContain(
        "md:block",
      );
    });

    And("the main content area should be visible", () => {
      expect(screen.getByRole("article").className).toContain("flex-1");
    });

    And("the table of contents should be visible", () => {
      const toc = screen.getByRole("navigation", { name: "Table of contents" });
      expect(toc.closest("aside")?.className).toContain("xl:block");
      expect(window.innerWidth).toBeGreaterThanOrEqual(1280);
    });
  });

  Scenario("Laptop viewport shows sidebar and content but hides table of contents", ({ Given, When, Then, And }) => {
    Given('the viewport is set to "laptop" (1024x768)', () => {
      Object.defineProperties(window, {
        innerWidth: { configurable: true, value: 1024 },
        innerHeight: { configurable: true, value: 768 },
      });
    });

    When("a visitor opens a content page", renderContentLayout);

    Then("the sidebar navigation should be visible", () => {
      expect(screen.getByRole("navigation", { name: "Section navigation" }).closest("aside")?.className).toContain(
        "md:block",
      );
    });

    And("the main content area should be visible", () => {
      expect(screen.getByRole("article")).toBeTruthy();
    });

    And("the table of contents should not be visible", () => {
      expect(screen.getByRole("navigation", { name: "Table of contents" }).closest("aside")?.className).toMatch(
        /hidden.*xl:block/,
      );
      expect(window.innerWidth).toBeLessThan(1280);
    });
  });

  Scenario("Mobile viewport shows hamburger menu and hides sidebar", ({ Given, When, Then, And }) => {
    Given('the viewport is set to "mobile" (375x667)', () => {
      Object.defineProperties(window, {
        innerWidth: { configurable: true, value: 375 },
        innerHeight: { configurable: true, value: 667 },
      });
    });

    When("a visitor opens a content page", () => {
      render(
        <MobileNavOpenProvider>
          <Header locale="en" />
          <ResizableSidebar locale="en">Sections</ResizableSidebar>
        </MobileNavOpenProvider>,
      );
    });

    Then("a hamburger menu button should be visible in the header", () => {
      expect(screen.getByRole("button", { name: "Open navigation menu" }).className).toContain("md:hidden");
    });

    And("the sidebar navigation should not be visible", () => {
      expect(document.querySelector("aside")?.className).toMatch(/hidden.*md:block/);
    });
  });

  Scenario("Mobile hamburger menu opens the sidebar drawer", ({ Given, When, Then, And }) => {
    Given('the viewport is set to "mobile" (375x667)', () => {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });
    });

    And("a visitor is on a content page", () => {
      render(
        <MobileNavOpenProvider>
          <Header locale="en" />
        </MobileNavOpenProvider>,
      );
    });

    When("the visitor taps the hamburger menu button", () => {
      fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    });

    Then("a sidebar drawer should slide into view", async () => {
      await act(async () => Promise.resolve());
      expect(screen.getByRole("dialog", { name: "AyoKoding" }).getAttribute("data-state")).toBe("open");
    });

    And("the sidebar navigation links should be visible inside the drawer", () => {
      const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
      expect(nav.querySelector('a[href="/en/browse"]')?.textContent).toBe("Learn");
      expect(nav.querySelector('a[href="/en/tools"]')?.textContent).toBe("Tools");
    });
  });
});
