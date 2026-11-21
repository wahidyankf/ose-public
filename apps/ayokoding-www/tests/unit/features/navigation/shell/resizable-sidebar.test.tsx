import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/learn",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/trpc/client", () => ({
  trpcClient: {
    content: {
      getTree: { query: vi.fn().mockResolvedValue([]) },
    },
  },
}));

// eslint-disable-next-line import/first
import { ResizableSidebar } from "../../../../../src/features/navigation/shell/resizable-sidebar";
// eslint-disable-next-line import/first
import { SidebarTree } from "../../../../../src/features/navigation/shell/sidebar-tree";
// eslint-disable-next-line import/first
import { MobileNav } from "@/features/app-shell/shell/mobile-nav";
// eslint-disable-next-line import/first
import { t } from "@/features/i18n/core/translations";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/navigation/resizable-sidebar.feature",
  ),
);

// @amiceli/vitest-cucumber registers each Given/When/Then/And as its own vitest test, so a
// file-level afterEach(cleanup) would unmount a scenario's own render before its later steps
// run. Instead, each scenario calls cleanup() itself immediately before its own render() —
// matching the established convention in test/unit/fe-steps/ia-navigation-revamp.steps.tsx.

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {
      expect(window.localStorage).toBeInstanceOf(Storage);
      expect(ResizableSidebar).toBeTypeOf("function");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/resizable-sidebar.feature: Persist the chosen width across a reload
  Scenario("Persist the chosen width across a reload", ({ Given, When, Then }) => {
    Given("the reader has resized the docs sidebar to 320 pixels on a desktop viewport", () => {
      // Mirrors useResizableWidth's commitWidth persistence: an integer-px string
      // written to the storageKey ResizableSidebar wires (ayokoding-sidebar-width).
      localStorage.clear();
      localStorage.setItem("ayokoding-sidebar-width", "320");
    });

    When("the reader reloads the page", () => {
      // Clean up any previous renders to isolate this scenario.
      cleanup();
      // A fresh render simulates the mount-effect read that follows a reload.
      render(
        <ResizableSidebar locale="en">
          <div>Sidebar content</div>
        </ResizableSidebar>,
      );
    });

    Then("the docs sidebar renders at 320 pixels", () => {
      const panel = document.querySelector('[data-slot="resizable-panel"]');
      expect(panel).toBeInstanceOf(HTMLElement);
      expect((panel as HTMLElement).style.width).toBe("320px");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/resizable-sidebar.feature: On a phone the sidebar rail is replaced by the navigation drawer
  Scenario("On a phone the sidebar rail is replaced by the navigation drawer", ({ Given, When, Then, And }) => {
    Given("the docs page is open at a 375 pixel viewport", () => {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });
      expect(window.innerWidth).toBe(375);
    });

    When("the layout renders", () => {
      // Clean up any previous renders to isolate this scenario.
      cleanup();
      render(
        <ResizableSidebar locale="en">
          <div>Sidebar content</div>
        </ResizableSidebar>,
      );
    });

    Then("the resizable aside is not displayed", () => {
      const aside = document.querySelector("aside");
      expect(aside?.className).toContain("hidden");
      expect(aside?.className).toContain("md:block");
    });

    And("navigation is available through the mobile drawer", () => {
      cleanup();
      render(<MobileNav locale="en" open={true} onOpenChange={vi.fn()} />);
      expect(document.querySelector('[data-slot="sheet-content"]')).toBeInstanceOf(HTMLElement);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/resizable-sidebar.feature: Scroll the sidebar horizontally when a label overflows
  Scenario("Scroll the sidebar horizontally when a label overflows", ({ Given, When, Then, And }) => {
    const longLabel = "A very long navigation label that overflows a narrow one hundred fifty pixel sidebar";
    let container: HTMLElement;

    Given("a docs sidebar narrowed to 150 pixels containing a nav label wider than 150 pixels", () => {
      expect(longLabel.length).toBeGreaterThan(70);
    });

    When("the reader views the sidebar", () => {
      // Clean up any previous renders to isolate this scenario.
      cleanup();
      const result = render(
        <SidebarTree
          nodes={[{ slug: "learn", title: longLabel, weight: 0, isSection: true, children: [] }]}
          locale="en"
        />,
      );
      container = result.container;
    });

    Then("the sidebar content area is horizontally scrollable", () => {
      expect(container.querySelector(".overflow-x-auto")).toBeTruthy();
    });

    And("the label is not clipped or wrapped", () => {
      const link = screen.getByRole("link", { name: longLabel });
      expect(link.className).not.toContain("truncate");
      expect(link.className).toContain("whitespace-nowrap");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/resizable-sidebar.feature: Overflowing nav labels signal that more content is scrollable
  Scenario("Overflowing nav labels signal that more content is scrollable", ({ Given, When, Then, And }) => {
    const longLabel = "A very long navigation label that overflows a narrow docs sidebar rail";
    let container: HTMLElement;
    let scrollWidthSpy: ReturnType<typeof vi.spyOn>;
    let clientWidthSpy: ReturnType<typeof vi.spyOn>;

    Given("the docs sidebar is narrowed enough that a nav label's text exceeds the visible rail width", () => {
      // jsdom has no real layout engine (no scrollWidth/clientWidth measurement), so the overflow
      // condition ScrollableTree derives from those two properties is forced directly here — unlike
      // the "Scroll the sidebar horizontally..." scenario above (which only asserts static classes),
      // this scenario needs the derived isOverflowing state to actually flip true.
      scrollWidthSpy = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(300);
      clientWidthSpy = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(100);
    });

    When("the reader views the sidebar without scrolling it", () => {
      // Clean up any previous renders to isolate this scenario.
      cleanup();
      const result = render(
        <SidebarTree
          nodes={[
            {
              slug: "wide-section",
              title: longLabel,
              weight: 0,
              isSection: true,
              children: [{ slug: "wide-section-child", title: "Child", weight: 0, isSection: true, children: [] }],
            },
          ]}
          locale="en"
        />,
      );
      container = result.container;
    });

    Then("a visible cue indicates the label continues off-screen", () => {
      const scrollContainer = container.querySelector(".overflow-x-auto") as HTMLElement;
      // `data-overflowing` and the mask-image fade gradient are driven by the exact same
      // `isOverflowing` boolean in sidebar-tree.tsx (see `ScrollableTree`), so asserting the
      // attribute pins the fade-cue behaviour too. The inline style itself isn't asserted
      // directly here: jsdom's `cssstyle` package (as vendored by this repo's jsdom version)
      // silently clears the whole `style` attribute when both the `maskImage` and
      // `WebkitMaskImage` camelCase properties are set on the same element, regardless of
      // assignment order — an environment quirk, not an app defect (confirmed against the raw
      // `jsdom` package directly, outside React, while writing this test).
      expect(scrollContainer.getAttribute("data-overflowing")).toBe("true");
    });

    And("the item's expand-or-collapse chevron remains visible", () => {
      const chevronButton = screen.getByRole("button", { name: "Expand section" });
      expect(chevronButton.className).toContain("sticky");
      expect(chevronButton.className).toContain("right-0");
      scrollWidthSpy.mockRestore();
      clientWidthSpy.mockRestore();
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/resizable-sidebar.feature: Scroll the sidebar vertically when the nav tree is taller than the viewport
  Scenario(
    "Scroll the sidebar vertically when the nav tree is taller than the viewport",
    ({ Given, When, Then, And }) => {
      let container: HTMLElement;
      let manyNodes: Array<{
        slug: string;
        title: string;
        weight: number;
        isSection: boolean;
        children: never[];
      }>;

      Given("a docs sidebar whose nav tree is taller than the visible rail height", () => {
        manyNodes = Array.from({ length: 40 }, (_, i) => ({
          slug: `topic-${i}`,
          title: `Topic ${i}`,
          weight: i,
          isSection: true,
          children: [],
        }));
        expect(manyNodes).toHaveLength(40);
      });

      When("the reader views the sidebar", () => {
        // Clean up any previous renders to isolate this scenario.
        cleanup();
        const result = render(
          <ResizableSidebar locale="en">
            <SidebarTree nodes={manyNodes} locale="en" />
          </ResizableSidebar>,
        );
        container = result.container;
      });

      Then("the sidebar content area is vertically scrollable", () => {
        // The wrapper is the immediate child of ResizablePanel's content slot — the element
        // resizable-sidebar.tsx renders directly inside `<ResizablePanel>`, matching the "new
        // wrapper" this scenario exercises regardless of its exact className contents.
        const wrapper = container.querySelector('[data-slot="resizable-panel-content"] > div') as HTMLElement;
        expect(wrapper).toBeInstanceOf(HTMLElement);
        expect(wrapper.className).toContain("overflow-y-auto");
        // `overflow-x-hidden` is the crux of this fix: it stops the CSS overflow spec from
        // computing `overflow-x: auto` and duplicating sidebar-tree.tsx's horizontal scroll one
        // level deeper. Pin it explicitly, not just `overflow-y-auto`.
        expect(wrapper.className).toContain("overflow-x-hidden");
      });

      And("the horizontal scroll behaviour is unaffected", () => {
        expect(container.querySelector(".overflow-x-auto")).toBeTruthy();
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/resizable-sidebar.feature: Apply a preset width to the mobile nav drawer
  Scenario("Apply a preset width to the mobile nav drawer", ({ Given, When, Then }) => {
    Given("the mobile nav drawer is open at a 375 pixel viewport", () => {
      // jsdom does not evaluate @media rules, so the 375px viewport itself is not
      // simulated here — the drawer's own rendering is viewport-independent (it is
      // an overlay, not the resizable rail); the breakpoint is exercised at E2E level
      // (Phase 6). What matters for this scenario is that the drawer is open.
      localStorage.clear();
      cleanup();
      render(<MobileNav locale="en" open={true} onOpenChange={() => {}} />);
    });

    When("the reader selects the wider preset", () => {
      const wideButton = screen.getByRole("button", { name: t("en", "mobileNavWidthWide") });
      fireEvent.click(wideButton);
    });

    Then("the drawer renders at the wider preset width", () => {
      const content = document.querySelector('[data-slot="sheet-content"]');
      expect(content).toBeInstanceOf(HTMLElement);
      expect((content as HTMLElement).style.width).toBe("360px");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/resizable-sidebar.feature: The resize handle's accessible label is localized
  Scenario("The resize handle's accessible label is localized", ({ Given, When, Then }) => {
    Given('the docs page is open in the "id" locale', () => {
      expect(t("id", "resizableSidebarHandleLabel")).not.toBe(t("en", "resizableSidebarHandleLabel"));
    });

    When("the layout renders", () => {
      cleanup();
      render(
        <ResizableSidebar locale="id">
          <div>Sidebar content</div>
        </ResizableSidebar>,
      );
    });

    Then('the resize handle\'s aria-label is the "id" translation of "Resize panel"', () => {
      const handle = document.querySelector('[data-slot="resizable-panel-handle"]');
      expect(handle).toBeInstanceOf(HTMLElement);
      expect((handle as HTMLElement).getAttribute("aria-label")).toBe(t("id", "resizableSidebarHandleLabel"));
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/resizable-sidebar.feature: An invalid persisted preset width falls back to the mobile drawer's default
  Scenario("An invalid persisted preset width falls back to the mobile drawer's default", ({ Given, When, Then }) => {
    Given("the mobile nav drawer has a corrupted persisted preset width", () => {
      localStorage.clear();
      localStorage.setItem("ayokoding-mobilenav-width", "999999");
    });

    When("the mobile nav drawer opens at a 375 pixel viewport", () => {
      cleanup();
      render(<MobileNav locale="en" open={true} onOpenChange={() => {}} />);
    });

    Then("the drawer renders at the default preset width", () => {
      const content = document.querySelector('[data-slot="sheet-content"]');
      expect(content).toBeInstanceOf(HTMLElement);
      expect((content as HTMLElement).style.width).toBe("280px");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/resizable-sidebar.feature: The drawer's width-preset control shows a visible caption
  Scenario("The drawer's width-preset control shows a visible caption", ({ Given, When, Then }) => {
    Given("the mobile nav drawer is open at a 375 pixel viewport", () => {
      localStorage.clear();
      cleanup();
      render(<MobileNav locale="en" open={true} onOpenChange={() => {}} />);
    });

    When("the reader looks at the width-preset buttons", () => {
      expect(screen.getByRole("button", { name: t("en", "mobileNavWidthDefault") })).toBeVisible();
      expect(screen.getByRole("button", { name: t("en", "mobileNavWidthWide") })).toBeVisible();
    });

    Then("a visible caption explains that the buttons control the drawer's width", () => {
      const legend = screen.getByText(t("en", "mobileNavWidthLabel"));
      expect(legend.className).not.toContain("sr-only");
    });
  });
});
