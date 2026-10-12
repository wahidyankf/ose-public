import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const getRouteDataMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/trpc/client", () => ({
  trpcClient: {
    content: {
      getTree: { query: vi.fn().mockResolvedValue([]) },
    },
    coursePaths: {
      getRouteData: { query: getRouteDataMock },
    },
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/learn/overview",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { MobileNav } from "../../../../../src/features/app-shell/shell/mobile-nav";

afterEach(() => {
  cleanup();
  getRouteDataMock.mockReset();
});

describe("MobileNav runtime path data", () => {
  it("defers the runtime request until the drawer opens", async () => {
    getRouteDataMock.mockResolvedValue({
      manifests: [],
      prerequisitesByCourse: {},
      libraryCourseIds: [],
      outlineCourseIds: [],
      courseLinks: {},
    });

    const view = render(<MobileNav locale="id" open={false} onOpenChange={() => {}} />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(getRouteDataMock).not.toHaveBeenCalled();

    view.rerender(<MobileNav locale="id" open onOpenChange={() => {}} />);

    await waitFor(() => {
      expect(getRouteDataMock).toHaveBeenCalledWith("id");
    });
  });
});
