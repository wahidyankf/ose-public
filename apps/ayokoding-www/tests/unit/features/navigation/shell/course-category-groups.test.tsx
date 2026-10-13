import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/en/learn/courses/sql-essentials" }));

// eslint-disable-next-line import/first
import { CourseCategoryGroups } from "../../../../../src/features/navigation/shell/course-category-groups";
import type { TreeNode } from "@/features/content/core/types";

afterEach(cleanup);

function node(slug: string, category?: string): TreeNode {
  return {
    title: slug.split("/").pop() ?? slug,
    slug,
    weight: 1,
    isSection: true,
    children: [],
    ...(category ? { category } : {}),
  };
}

describe("CourseCategoryGroups", () => {
  it("opens only the current group and toggles with aria state", () => {
    render(
      <CourseCategoryGroups
        locale="en"
        depth={2}
        nodes={[
          node("learn/courses/sql-essentials", "data-and-databases"),
          node("learn/courses/git", "tools-and-practices"),
        ]}
      />,
    );
    const dataBtn = screen.getByRole("button", { name: /Data and databases/ });
    const toolsBtn = screen.getByRole("button", { name: /Tools and practices/ });
    expect(dataBtn.getAttribute("aria-expanded")).toBe("true");
    expect(toolsBtn.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById(dataBtn.getAttribute("aria-controls")!)).toBeTruthy();
    fireEvent.click(toolsBtn);
    expect(toolsBtn.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(toolsBtn);
    expect(toolsBtn.getAttribute("aria-expanded")).toBe("false");
  });
});
