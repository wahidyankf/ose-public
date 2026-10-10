import fs from "node:fs";
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { expect, vi } from "vitest";
import matter from "gray-matter";

let mockPathname = "/en/unrelated";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));
import "./helpers/test-setup";
import { sortTreeByWeight } from "@/features/content/core/tree-builder";
import type { TreeNode } from "@/features/content/core/types";
import { Breadcrumb } from "@/features/navigation/shell/breadcrumb";
import { TableOfContents } from "@/features/navigation/shell/toc";
import { PrevNext } from "@/features/navigation/shell/prev-next";
import { SidebarTree } from "@/features/navigation/shell/sidebar-tree";
import { parseMarkdown } from "@/features/content/core/parser";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/navigation/navigation.feature"),
);

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanup();
    mockPathname = "/en/unrelated";
  });

  Background(({ Given }) => {
    Given("the app is running", () => {
      expect(Breadcrumb).toBeTypeOf("function");
    });
  });

  Scenario("Sidebar shows section tree with collapsible nodes", ({ When, Then, And }) => {
    When("a visitor opens a content page that has child sections", () => {
      render(
        <SidebarTree
          locale="en"
          nodes={[
            {
              slug: "learn",
              title: "Learn",
              isSection: true,
              weight: 0,
              children: [{ slug: "learn/typescript", title: "TypeScript", isSection: false, weight: 0, children: [] }],
            },
          ]}
        />,
      );
    });

    Then("the sidebar should display the section tree", () => {
      expect(screen.getByRole("link", { name: "Learn" })).toBeTruthy();
    });

    And("parent nodes should be expandable and collapsible", () => {
      expect(screen.getByRole("button", { name: "Expand section" })).toBeTruthy();
    });

    And("the visitor clicks a collapsed parent node", () => {
      fireEvent.click(screen.getByRole("button", { name: "Expand section" }));
    });

    And("its child items should become visible", () => {
      expect(screen.getByRole("link", { name: "TypeScript" })).toBeTruthy();
    });
  });

  Scenario("Breadcrumb shows ancestor path hierarchy without current page", ({ When, Then, And }) => {
    When("a visitor opens a nested content page", () => {
      render(
        <Breadcrumb
          locale="en"
          slug="learn/software-engineering/overview"
          segments={[
            { label: "Learn", slug: "learn" },
            { label: "Software Engineering", slug: "learn/software-engineering" },
            { label: "Overview", slug: "learn/software-engineering/overview" },
          ]}
        />,
      );
    });

    Then("a breadcrumb trail should be displayed above the page title", () => {
      expect(screen.getByLabelText("Breadcrumb")).toBeTruthy();
    });

    And("each breadcrumb segment should reflect an ancestor level of the URL hierarchy", () => {
      expect(screen.getByText("Learn")).toBeTruthy();
      expect(screen.getByText("Software Engineering")).toBeTruthy();
    });

    And("the current page should not appear in the breadcrumb", () => {
      expect(screen.queryByText("Overview")).toBeNull();
    });

    And("all breadcrumb segments should be clickable links", () => {
      const links = screen.getAllByRole("link");
      expect(links.length).toBe(2); // Learn and Software Engineering are both links
    });

    And("the breadcrumb should render on a single row without horizontally truncating link text", () => {
      const nav = screen.getByLabelText("Breadcrumb");
      const ol = nav.querySelector("ol");
      // DWT-001: the breadcrumb no longer wraps to multiple rows (bare `flex-wrap` removed);
      // deep breadcrumbs instead collapse middle crumbs to a single ellipsis at mobile width
      // (covered by breadcrumb.test.tsx). It must still never horizontally truncate link text.
      expect(ol?.className).toContain("flex");
      expect(ol?.className).not.toContain("flex-wrap");
      // Ensure no truncate class is used on any link
      const allLinks = nav.querySelectorAll("a");
      for (const link of allLinks) {
        expect(link.className).not.toContain("truncate");
      }
    });
  });

  Scenario("Table of contents shows heading links for H2 to H4", ({ When, Then, And }) => {
    When("a visitor opens a content page with multiple headings", () => {
      render(
        <TableOfContents
          headings={[
            { id: "intro", text: "Introduction", level: 2 },
            { id: "details", text: "Details", level: 3 },
            { id: "advanced", text: "Advanced", level: 4 },
          ]}
          label="On this page"
        />,
      );
    });

    Then("a table of contents should be visible on the page", () => {
      expect(screen.getByLabelText("Table of contents")).toBeTruthy();
    });

    And("the table of contents should list all H2, H3, and H4 headings as anchor links", () => {
      expect(screen.getByText("Introduction")).toBeTruthy();
      expect(screen.getByText("Details")).toBeTruthy();
      expect(screen.getByText("Advanced")).toBeTruthy();
    });

    And("H1 headings should not appear in the table of contents", () => {
      expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    });
  });

  Scenario("Previous and Next links navigate between siblings", ({ When, Then, And }) => {
    When("a visitor is on a content page that has sibling pages", () => {
      render(
        <PrevNext
          locale="en"
          prev={{ title: "Getting Started", slug: "learn/getting-started" }}
          next={{ title: "Advanced Topics", slug: "learn/advanced" }}
        />,
      );
    });

    Then("a previous link should point to the preceding sibling page", () => {
      expect(screen.getByText("Getting Started")).toBeTruthy();
    });

    And("a next link should point to the following sibling page", () => {
      expect(screen.getByText("Advanced Topics")).toBeTruthy();
    });

    And("the visitor clicks the next link", () => {
      fireEvent.click(screen.getByRole("link", { name: /Next Advanced Topics/i }));
    });

    And("they should be taken to the next sibling page", () => {
      const links = screen.getAllByRole("link");
      const nextLink = links.find((l) => l.getAttribute("href")?.includes("advanced"));
      expect(nextLink).toBeTruthy();
    });
  });

  Scenario("Active page is highlighted in the sidebar", ({ When, Then, And }) => {
    When("a visitor is on a specific content page", () => {
      mockPathname = "/en/learn/active";
      render(
        <SidebarTree
          locale="en"
          nodes={[
            { slug: "learn/active", title: "Active", isSection: false, weight: 0, children: [] },
            { slug: "learn/other", title: "Other", isSection: false, weight: 1, children: [] },
          ]}
        />,
      );
    });

    Then("the corresponding item in the sidebar should be visually highlighted as active", () => {
      const active = screen.getByRole("link", { name: "Active" });
      expect(active.className).toContain("bg-primary/10");
      expect(active.className).toContain("text-primary");
    });

    And("no other sidebar item should be highlighted as active", () => {
      const other = screen.getByRole("link", { name: "Other" });
      expect(other.className).not.toContain("bg-primary/10");
      expect(document.querySelectorAll("a.bg-primary\\/10")).toHaveLength(1);
    });
  });

  Scenario("In-body relative markdown links resolve to real site routes", ({ Given, When, Then, And }) => {
    const markdown = "[Overview (section)](../../overview.md)";
    let html = "";

    Given("a content page's markdown body contains a relative link to another content file", () => {
      expect(markdown).toContain("](../../overview.md)");
    });

    When("the page is rendered to HTML", async () => {
      const currentSlug = "learn/fundamentally-strong/software-engineer/just-enough-nvim/learning/overview";
      const result = await parseMarkdown(markdown, { locale: "en", slug: currentSlug });
      html = result.html;
    });

    Then("the rendered link's href should be the linked page's real site URL", () => {
      expect(html).toContain('href="/en/learn/fundamentally-strong/software-engineer/overview"');
    });

    And('the href should not contain a literal ".md" extension', () => {
      expect(html).not.toContain(".md");
    });

    And("the href should not be a raw filesystem-relative path", () => {
      expect(html).not.toContain('href="../');
      expect(html).not.toContain('href="./');
    });
  });

  Scenario(
    "In-body relative markdown links authored from a section index page resolve to real site routes",
    ({ Given, When, Then, And }) => {
      const markdown = "[Sibling Topic](./sibling.md)";
      let html = "";

      Given("a section index page's markdown body contains a relative link to a sibling content file", () => {
        expect(markdown).toContain("](./sibling.md)");
      });

      When("the page is rendered to HTML", async () => {
        // This slug's file is `.../just-enough-nvim/_index.md` (isSection: true), so the
        // page's own containing directory is the slug itself, not dirname(slug).
        const currentSlug = "learn/fundamentally-strong/software-engineer/just-enough-nvim";
        const result = await parseMarkdown(markdown, { locale: "en", slug: currentSlug, isSection: true });
        html = result.html;
      });

      Then("the rendered link's href should be resolved relative to the section's own directory", () => {
        expect(html).toContain('href="/en/learn/fundamentally-strong/software-engineer/just-enough-nvim/sibling"');
      });

      And('the href should not contain a literal ".md" extension', () => {
        expect(html).not.toContain(".md");
      });
    },
  );

  Scenario("The learn overview is the first entry under Learn in the sidebar", ({ When, Then, And }) => {
    // The real learn entries the sidebar lists under Learn, keyed to the files that back them.
    // Slugs and isSection flags mirror what the app derives from these paths
    // (src/features/content/shell/repository-fs.ts deriveSlug): `overview.md` is the learn
    // overview page itself; each `_index.md` is a section.
    const learnEntryFiles: Array<{ file: string; slug: string; isSection: boolean }> = [
      { file: "content/en/learn/overview.md", slug: "learn/overview", isSection: false },
      { file: "content/en/learn/paths/_index.md", slug: "learn/paths", isSection: true },
      { file: "content/en/learn/courses/_index.md", slug: "learn/courses", isSection: true },
      { file: "content/en/learn/legacy/_index.md", slug: "learn/legacy", isSection: true },
    ];
    let sidebarNodes: TreeNode[] = [];

    When("a visitor opens the learn overview page", () => {
      // Build the sidebar entries the way the app does: TreeNode nodes carrying the real
      // frontmatter title/weight read from the content files at the app root (process.cwd()).
      sidebarNodes = learnEntryFiles.map(({ file, slug, isSection }) => {
        const { data } = matter(fs.readFileSync(path.resolve(process.cwd(), file), "utf8"));
        return {
          title: String(data.title),
          slug,
          weight: Number(data.weight),
          isSection,
          children: [],
        };
      });
      // ...and ordered the way the app orders tree nodes (tree-builder.ts sortTreeByWeight).
      sortTreeByWeight(sidebarNodes);
    });

    Then('the first entry under Learn in the sidebar is "Overview"', () => {
      expect(sidebarNodes[0]?.title).toBe("Overview");
    });

    And("it is followed by Paths, Courses, and Legacy in that order", () => {
      expect(sidebarNodes.map((node) => node.title)).toEqual(["Overview", "Paths", "Courses", "Legacy"]);
    });
  });
});
