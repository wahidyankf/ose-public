import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import ContentLayout from "@/app/[locale]/(content)/layout";

const query = vi.hoisted(() => ({
  calls: 0,
  pending: true,
  promise: Promise.resolve(),
  value: new URLSearchParams("filter=ordinary"),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/en/learn/courses",
  useSearchParams: () => {
    query.calls += 1;
    if (query.pending) throw query.promise;
    return query.value;
  },
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
// Replace the async server boundary with its tree fixture; SidebarTree and its controls are real.
vi.mock("@/features/navigation/shell/sidebar", async () => {
  const { SidebarTree } = await import("@/features/navigation/shell/sidebar-tree");
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
        <SidebarTree nodes={nodes} locale={locale} />
      </nav>
    ),
  };
});
afterEach(cleanup);

it("preserves the open catalog category when the query reader resolves", async () => {
  let resolveQuery: () => void = () => {
    throw new Error("query resolver missing");
  };
  query.calls = 0;
  query.pending = true;
  query.promise = new Promise<void>((resolve) => {
    resolveQuery = resolve;
  });
  const user = userEvent.setup();
  render(await ContentLayout({ params: Promise.resolve({ locale: "en" }), children: <main>Catalog</main> }));
  const button = await screen.findByRole("button", { name: /Tools and practices/ });
  button.focus();
  await user.keyboard("{Enter}");
  expect(button.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByRole("link", { name: "Git" })).toBeTruthy();
  await act(async () => {
    query.pending = false;
    resolveQuery();
    await query.promise;
  });
  expect(button.isConnected).toBe(true);
  expect(screen.getByRole("button", { name: /Tools and practices/ })).toBe(button);
  expect(button.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByRole("link", { name: "Git" })).toBeTruthy();
  expect(screen.getAllByRole("navigation", { name: "Sidebar navigation" })).toHaveLength(1);
  expect(query.calls).toBe(0);
  await user.keyboard(" ");
  expect(button.getAttribute("aria-expanded")).toBe("false");
});
