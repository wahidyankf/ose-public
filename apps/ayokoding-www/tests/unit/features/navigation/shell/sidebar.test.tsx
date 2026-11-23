import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "@/features/navigation/shell/sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/learn",
}));

vi.mock("@/lib/trpc/server", () => ({
  serverCaller: {
    content: {
      getTree: async () => [
        {
          slug: "",
          title: "Root",
          weight: 0,
          isSection: false,
          children: [
            { slug: "learn", title: "Learn", weight: 0, isSection: true, children: [] },
            { slug: "about", title: "About", weight: 1, isSection: false, children: [] },
          ],
        },
      ],
    },
  },
}));

describe("Sidebar", () => {
  it("lists section children and skips loose pages", async () => {
    render(await Sidebar({ locale: "en" }));
    expect(screen.getByText("Learn")).not.toBeNull();
    expect(screen.queryByText("About")).toBeNull();
  });
});
