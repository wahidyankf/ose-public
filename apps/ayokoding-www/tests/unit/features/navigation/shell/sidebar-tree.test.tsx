import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/learn",
}));

// eslint-disable-next-line import/first
import { SidebarTree } from "../../../../../src/features/navigation/shell/sidebar-tree";

afterEach(cleanup);

const nodes = [
  { slug: "learn", title: "Learn", weight: 0, isSection: true, children: [] },
  { slug: "rants", title: "Rants", weight: 1, isSection: true, children: [] },
];

describe("SidebarTree", () => {
  it("emits bare hrefs for content nodes (contentUrl uniform join, DD-48)", () => {
    render(<SidebarTree nodes={nodes} locale="en" />);
    expect(screen.getByRole("link", { name: "Learn" }).getAttribute("href")).toBe("/en/learn");
    expect(screen.getByRole("link", { name: "Rants" }).getAttribute("href")).toBe("/en/rants");
  });

  it("emits bare hrefs for Indonesian locale", () => {
    render(
      <SidebarTree
        nodes={[{ slug: "belajar", title: "Belajar", weight: 0, isSection: true, children: [] }]}
        locale="id"
      />,
    );
    expect(screen.getByRole("link", { name: "Belajar" }).getAttribute("href")).toBe("/id/belajar");
  });

  it("carries a title attribute with the node's full label, so a long, visually clipped label is always recoverable on hover (UWT-002 fix, phase-5 rule-15 retest)", () => {
    render(
      <SidebarTree
        nodes={[
          { slug: "immediately-effective", title: "Immediately-Effective", weight: 0, isSection: true, children: [] },
        ]}
        locale="en"
      />,
    );
    expect(screen.getByRole("link", { name: "Immediately-Effective" }).getAttribute("title")).toBe(
      "Immediately-Effective",
    );
  });
});

describe("SidebarTree — Courses category grouping (plan 03)", () => {
  it("renders CourseCategoryGroups under learn/courses and plain recursion elsewhere", () => {
    const tree = [
      {
        slug: "learn",
        title: "Learn",
        weight: 0,
        isSection: true,
        children: [
          {
            slug: "learn/courses",
            title: "Courses",
            weight: 1,
            isSection: true,
            children: [
              {
                slug: "learn/courses/sql-essentials",
                title: "SQL Essentials",
                weight: 1,
                isSection: true,
                category: "data-and-databases",
                children: [],
              },
            ],
          },
          { slug: "learn/paths", title: "Paths", weight: 2, isSection: true, children: [] },
        ],
      },
    ];
    render(<SidebarTree nodes={tree} locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Expand section" }));
    expect(screen.getByRole("button", { name: /Data and databases/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Paths" })).toBeTruthy();
  });
});
