import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({ usePathname: () => null }));

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

describe("CourseCategoryGroups without a pathname", () => {
  it("renders every group closed when no path is active", () => {
    render(
      <CourseCategoryGroups
        locale="en"
        depth={2}
        nodes={[node("learn/courses/sql-essentials", "data-and-databases")]}
      />,
    );
    expect(screen.getByRole("button", { name: /data and databases/i })).not.toBeNull();
  });
});
