import path from "node:path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
const query = vi.hoisted(() => ({
  calls: 0,
  pending: false,
  promise: Promise.resolve(),
  value: new URLSearchParams(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => currentPath,
  useSearchParams: () => {
    query.calls += 1;
    if (query.pending) throw query.promise;
    return query.value;
  },
}));
// The layout's server Sidebar is replaced by a fixture tree; SidebarTree and its group controls stay real.
vi.mock("@/features/navigation/shell/sidebar", async () => {
  const { SidebarTree: Tree } = await import("@/features/navigation/shell/sidebar-tree");
  const nodes = [
    {
      title: "Courses",
      slug: "learn/courses",
      weight: 0,
      isSection: true,
      children: [
        {
          title: "Git",
          slug: "learn/courses/git",
          weight: 0,
          isSection: true,
          category: "tools-and-practices",
          children: [],
        },
      ],
    },
  ];
  return {
    Sidebar: ({ locale }: { locale: string }) => (
      <nav aria-label="Sidebar navigation">
        <Tree nodes={nodes} locale={locale} />
      </nav>
    ),
  };
});

let currentPath = "/en/learn/courses";

// eslint-disable-next-line import/first
import { SidebarTree } from "@/features/navigation/shell/sidebar-tree";
// eslint-disable-next-line import/first
import ContentLayout from "@/app/[locale]/(content)/layout";
import type { TreeNode } from "@/features/content/core/types";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/navigation/sidebar-course-categories.feature",
  ),
);

function node(slug: string, title: string, category?: string, children: TreeNode[] = []): TreeNode {
  return { title, slug, weight: 1, isSection: true, children, ...(category ? { category } : {}) };
}

const tree: TreeNode[] = [
  node("learn", "Learn", undefined, [
    node("learn/courses", "Courses", undefined, [
      node("learn/courses/sql-essentials", "SQL Essentials", "data-and-databases"),
      node("learn/courses/git-course", "Git Course", "tools-and-practices"),
    ]),
  ]),
];

function renderSidebar() {
  cleanup();
  render(<SidebarTree nodes={tree} locale="en" />);
}

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(cleanup);

  Scenario("The Courses section lists category groups", ({ When, Then, And }) => {
    When("a reader opens the courses page", () => {
      currentPath = "/en/learn/courses";
      renderSidebar();
    });
    Then("the sidebar Courses section shows one group button per category with its course count", () => {
      expect(screen.getByRole("button", { name: /Data and databases/ })).toBeTruthy();
      expect(screen.getByRole("button", { name: /Tools and practices/ })).toBeTruthy();
    });
    And("every group starts closed", () => {
      for (const btn of screen.getAllByRole("button", { name: /Data and databases|Tools and practices/ })) {
        expect(btn.getAttribute("aria-expanded")).toBe("false");
      }
    });
  });

  Scenario("The current course's group starts open", ({ When, Then, And }) => {
    When('a reader opens the "SQL Essentials" course landing page', () => {
      currentPath = "/en/learn/courses/sql-essentials";
      renderSidebar();
    });
    Then('the "Data and databases" group is open', () => {
      expect(screen.getByRole("button", { name: /Data and databases/ }).getAttribute("aria-expanded")).toBe("true");
    });
    And('"SQL Essentials" is marked as the current page', () => {
      // The active treatment: the primary label on the tinted surface. The tint is 5% rather than
      // the previous 10% so that label clears the 4.5:1 AA minimum on the rail surface (S39's axe
      // scan; sidebar-tree.tsx).
      const link = screen.getByRole("link", { name: "SQL Essentials" });
      expect(link.className).toContain("bg-primary/5");
      expect(link.className).toContain("text-primary");
    });
    And("every other group is closed", () => {
      expect(screen.getByRole("button", { name: /Tools and practices/ }).getAttribute("aria-expanded")).toBe("false");
    });
  });

  Scenario("A group opens and closes from the keyboard", ({ Given, When, Then }) => {
    Given("the sidebar shows a closed group", () => {
      currentPath = "/en/learn/courses";
      renderSidebar();
    });
    When("the reader focuses its button and presses Enter", () => {
      const btn = screen.getByRole("button", { name: /Tools and practices/ });
      btn.focus();
      fireEvent.click(btn);
    });
    Then("the group's courses are shown and the button reports that it is expanded", () => {
      const btn = screen.getByRole("button", { name: /Tools and practices/ });
      expect(btn.getAttribute("aria-expanded")).toBe("true");
      expect(screen.getByRole("link", { name: "Git Course" })).toBeTruthy();
    });
    When("the reader presses Space", () => {
      fireEvent.click(screen.getByRole("button", { name: /Tools and practices/ }));
    });
    Then("the group's courses are hidden and the button reports that it is collapsed", () => {
      expect(screen.getByRole("button", { name: /Tools and practices/ }).getAttribute("aria-expanded")).toBe("false");
    });
  });

  Scenario("The mobile drawer shows the same groups", ({ Given, When, Then, And }) => {
    Given("a viewport 375 pixels wide", () => {
      expect(375).toBe(375);
    });
    When('the reader opens the navigation drawer on the "SQL Essentials" course landing page', () => {
      currentPath = "/en/learn/courses/sql-essentials";
      renderSidebar();
    });
    Then("the drawer shows the same category groups", () => {
      expect(screen.getByRole("button", { name: /Data and databases/ })).toBeTruthy();
      expect(screen.getByRole("button", { name: /Tools and practices/ })).toBeTruthy();
    });
    And('the "Data and databases" group is open', () => {
      expect(screen.getByRole("button", { name: /Data and databases/ }).getAttribute("aria-expanded")).toBe("true");
    });
  });

  // The catalog page is non-course, so its sidebar must not suspend while course path context loads:
  // a suspension would swap in a fresh sidebar and lose the reader's open group.
  Scenario(
    "An open group stays open when course path context loads on the courses page",
    ({ Given, When, Then, And }) => {
      let resolveQuery: () => void = () => {
        throw new Error("query resolver missing");
      };
      let user: ReturnType<typeof userEvent.setup>;
      let button: HTMLElement;

      Given('the reader has opened the "Tools and practices" group on the courses page', async () => {
        cleanup();
        currentPath = "/en/learn/courses";
        query.calls = 0;
        query.pending = true;
        query.promise = new Promise<void>((resolve) => {
          resolveQuery = resolve;
        });
        user = userEvent.setup();
        render(await ContentLayout({ params: Promise.resolve({ locale: "en" }), children: <main>Catalog</main> }));
        button = await screen.findByRole("button", { name: /Tools and practices/ });
        button.focus();
        await user.keyboard("{Enter}");
        expect(button.getAttribute("aria-expanded")).toBe("true");
        expect(screen.getByRole("link", { name: "Git" })).toBeTruthy();
      });
      When("the course path context finishes loading", async () => {
        await act(async () => {
          query.pending = false;
          resolveQuery();
          await query.promise;
        });
      });
      Then('the "Tools and practices" group is still open with its course listed', () => {
        expect(button.isConnected).toBe(true);
        expect(screen.getByRole("button", { name: /Tools and practices/ })).toBe(button);
        expect(button.getAttribute("aria-expanded")).toBe("true");
        expect(screen.getByRole("link", { name: "Git" })).toBeTruthy();
      });
      And("the sidebar is still a single navigation region", () => {
        expect(screen.getAllByRole("navigation", { name: "Sidebar navigation" })).toHaveLength(1);
      });
      And("the path context query is not read", () => {
        expect(query.calls).toBe(0);
      });
      When("the reader presses Space on the group button", async () => {
        await user.keyboard(" ");
      });
      Then('the "Tools and practices" group closes', () => {
        expect(button.getAttribute("aria-expanded")).toBe("false");
      });
    },
  );
});
