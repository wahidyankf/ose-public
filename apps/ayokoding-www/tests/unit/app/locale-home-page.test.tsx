import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LocaleHomePage from "@/app/[locale]/page";

vi.mock("@/lib/trpc/server", () => ({
  serverCaller: {
    content: {
      getTree: async () => [
        {
          slug: "",
          title: "Root",
          weight: 0,
          isSection: false,
          children: [{ slug: "learn", title: "Learn", weight: 0, isSection: true, children: [] }],
        },
      ],
    },
  },
}));

vi.mock("@/features/course-paths/shell/route-path-data", () => ({
  loadRoutePathData: async () => ({
    manifests: [],
    contentMap: new Map(),
    prerequisitesByCourse: {},
    libraryCourseIds: [],
    outlineCourseIds: [],
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("[locale] home page", () => {
  it("renders sections from the content tree", async () => {
    render(await LocaleHomePage({ params: Promise.resolve({ locale: "en" }) }));
    expect(screen.getByText("Learn")).not.toBeNull();
  });
});
