// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Hero } from "@/features/landing/shell/hero";
import { SocialIcons } from "@/features/landing/shell/social-icons";
import { Breadcrumb } from "@/features/content/shell/breadcrumb";
import { PrevNext } from "@/features/content/shell/prev-next";
import { TableOfContents } from "@/features/content/shell/toc";
import { UpdateCard } from "@/features/content/shell/update-card";
import type { ContentMeta } from "@/features/content/core/types";

// next/link rewrites trailing slashes according to the Next config, which this unit run does not load.
// The anchor it renders is the contract under test, so the double renders the href exactly as written.
vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: ({ href, children, ...rest }: { href: string; children?: ReactNode; [key: string]: unknown }) =>
      createElement("a", { href, ...rest }, children),
  };
});

const observer = vi.hoisted(() => ({
  callback: undefined as undefined | ((entries: { isIntersecting: boolean; target: { id: string } }[]) => void),
  observe: vi.fn<(element: Element) => void>(),
  disconnect: vi.fn<() => void>(),
}));

afterEach(cleanup);

describe("Hero", () => {
  it("states what the platform is and links to the about page and the source", () => {
    render(<Hero />);

    expect(screen.getByRole("heading", { level: 1, name: "Open Sharia Enterprise Platform" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Learn More/ })).toHaveAttribute("href", "/about/");
    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Currently in pre-alpha development.")).toBeInTheDocument();
  });
});

describe("SocialIcons", () => {
  it("links the repository and the RSS feed", () => {
    render(<SocialIcons />);

    expect(screen.getByRole("link", { name: "GitHub repository" })).toHaveAttribute(
      "href",
      "https://github.com/wahidyankf/ose-public",
    );
    expect(screen.getByRole("link", { name: "RSS feed" })).toHaveAttribute("href", "/feed.xml");
  });
});

describe("Breadcrumb", () => {
  it("lists the home link and the ancestors, leaving out the current page", () => {
    render(
      <Breadcrumb
        segments={[
          { label: "Updates", href: "/updates/" },
          { label: "Phase 4", href: "/updates/phase-4/" },
        ]}
      />,
    );

    const trail = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(trail).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(within(trail).getByRole("link", { name: "Updates" })).toHaveAttribute("href", "/updates/");
    expect(within(trail).queryByRole("link", { name: "Phase 4" })).not.toBeInTheDocument();
  });
});

describe("PrevNext", () => {
  it("renders nothing when there is no neighbouring page", () => {
    const { container } = render(<PrevNext />);

    expect(container).toBeEmptyDOMElement();
  });

  it("links the previous and next pages by title", () => {
    render(
      <PrevNext
        prev={{ title: "Phase 3", slug: "updates/phase-3" }}
        next={{ title: "Phase 5", slug: "updates/phase-5" }}
      />,
    );

    expect(screen.getByRole("link", { name: /Phase 3/ })).toHaveAttribute("href", "/updates/phase-3/");
    expect(screen.getByRole("link", { name: /Phase 5/ })).toHaveAttribute("href", "/updates/phase-5/");
  });

  it("keeps the layout with an empty slot when only one neighbour exists", () => {
    render(<PrevNext next={{ title: "Phase 5", slug: "updates/phase-5" }} />);

    const navigation = screen.getByRole("navigation", { name: "Page navigation" });
    expect(within(navigation).getAllByRole("link")).toHaveLength(1);
    expect(navigation.children).toHaveLength(2);
  });
});

describe("TableOfContents", () => {
  class FakeIntersectionObserver {
    constructor(callback: NonNullable<typeof observer.callback>) {
      observer.callback = callback;
    }
    observe = observer.observe;
    disconnect = observer.disconnect;
    unobserve() {}
  }

  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    observer.observe.mockClear();
    observer.disconnect.mockClear();
  });

  it("renders no table when the page has no headings", () => {
    const { container } = render(<TableOfContents headings={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("lists every heading and watches the ones on the page", () => {
    render(
      <>
        <h2 id="intro">Intro</h2>
        <h3 id="detail">Detail</h3>
        <TableOfContents
          headings={[
            { id: "intro", text: "Intro", level: 2 },
            { id: "detail", text: "Detail", level: 3 },
          ]}
        />
      </>,
    );

    const toc = screen.getByRole("navigation", { name: "Table of contents" });
    expect(within(toc).getByRole("link", { name: "Detail" })).toHaveAttribute("href", "#detail");
    expect(observer.observe).toHaveBeenCalledTimes(2);
  });

  it("marks the heading that scrolls into view as the current one", () => {
    render(
      <>
        <h2 id="intro">Intro</h2>
        <TableOfContents headings={[{ id: "intro", text: "Intro", level: 2 }]} />
      </>,
    );

    act(() => observer.callback?.([{ isIntersecting: true, target: { id: "intro" } }]));

    expect(screen.getByRole("link", { name: "Intro" })).toHaveClass("font-medium");
  });

  it("stops watching the headings when it leaves the page", () => {
    observer.disconnect.mockClear();
    const { unmount } = render(
      <>
        <h2 id="intro">Intro</h2>
        <TableOfContents headings={[{ id: "intro", text: "Intro", level: 2 }]} />
      </>,
    );

    unmount();

    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });
});

describe("UpdateCard", () => {
  const update: ContentMeta = {
    title: "Phase 4 Fixture",
    slug: "updates/2026-02-04-phase-4",
    date: new Date("2026-02-04T12:00:00Z"),
    draft: false,
    summary: "Synthetic Phase 4 update",
    tags: ["phase", "milestone"],
    weight: 0,
    isSection: false,
    filePath: "/content/updates/2026-02-04-phase-4.md",
    readingTime: 1,
    category: "updates",
  };

  it("shows the title, the long date, the summary, and every tag, linking to the page", () => {
    render(<UpdateCard update={update} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/updates/2026-02-04-phase-4/");
    expect(within(link).getByText("Phase 4 Fixture")).toBeInTheDocument();
    expect(within(link).getByText("February 4, 2026")).toBeInTheDocument();
    expect(within(link).getByText("Synthetic Phase 4 update")).toBeInTheDocument();
    expect(within(link).getByText("milestone")).toBeInTheDocument();
  });

  it("omits the date, summary, and tags it does not have", () => {
    render(<UpdateCard update={{ ...update, date: undefined, summary: undefined, tags: [] }} />);

    const link = screen.getByRole("link");
    expect(within(link).getByText("Phase 4 Fixture")).toBeInTheDocument();
    expect(within(link).queryByText("February 4, 2026")).not.toBeInTheDocument();
    expect(within(link).queryByText("milestone")).not.toBeInTheDocument();
  });
});
