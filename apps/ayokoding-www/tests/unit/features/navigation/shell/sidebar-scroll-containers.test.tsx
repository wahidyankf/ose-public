import { cleanup, render } from "@testing-library/react";
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
  useSearchParams: () => new URLSearchParams(),
}));

// eslint-disable-next-line import/first
import { ResizableSidebar } from "../../../../../src/features/navigation/shell/resizable-sidebar";
// eslint-disable-next-line import/first
import { SidebarTree } from "../../../../../src/features/navigation/shell/sidebar-tree";

afterEach(cleanup);

const NODES = Array.from({ length: 5 }, (_, i) => ({
  slug: `topic-${i}`,
  title: `Topic ${i}`,
  weight: i,
  isSection: true,
  children: [],
}));

/**
 * Firefox tabs into scroll containers, so each sidebar scroller costs keyboard users a stop on
 * an element with no action — two wasted stops that also starve the keyboard-traversal E2E of
 * its final two links. Both scrollers stay scrollable and programmatically focusable; they are
 * simply removed from the sequential tab order.
 */
describe("Sidebar scroll containers stay out of the sequential tab order", () => {
  it("the tree's horizontal scroller carries tabindex -1", () => {
    const { container } = render(<SidebarTree nodes={NODES} locale="en" />);

    const scroller = container.querySelector(".overflow-x-auto") as HTMLElement;
    expect(scroller).toBeInstanceOf(HTMLElement);
    expect(scroller.getAttribute("tabindex")).toBe("-1");
  });

  it("the rail's vertical scroller carries tabindex -1", () => {
    const { container } = render(
      <ResizableSidebar locale="en">
        <SidebarTree nodes={NODES} locale="en" />
      </ResizableSidebar>,
    );

    const scroller = container.querySelector('[data-slot="resizable-panel-content"] > div') as HTMLElement;
    expect(scroller).toBeInstanceOf(HTMLElement);
    expect(scroller.className).toContain("overflow-y-auto");
    expect(scroller.getAttribute("tabindex")).toBe("-1");
  });
});
