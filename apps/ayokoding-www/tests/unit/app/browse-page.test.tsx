import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BrowsePage, { generateMetadata } from "@/app/[locale]/(content)/browse/page";

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

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("browse page", () => {
  it("builds localized metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });
    expect(metadata.title).toBe("Browse");
    expect(metadata.alternates?.canonical).toBe("/en/browse");
  });

  it("renders sections from the content tree", async () => {
    render(await BrowsePage({ params: Promise.resolve({ locale: "en" }) }));
    expect(screen.getByText("Learn")).not.toBeNull();
  });
});
