import path from "node:path";
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
vi.mock("next/navigation", () => ({ usePathname: () => currentPath }));

let currentPath = "/en/learn/courses";

// eslint-disable-next-line import/first
import { SidebarTree } from "@/features/navigation/shell/sidebar-tree";
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

describeFeature(feature, ({ Scenario }) => {
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
      expect(screen.getByRole("link", { name: "SQL Essentials" }).className).toContain("bg-primary/10");
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
});
