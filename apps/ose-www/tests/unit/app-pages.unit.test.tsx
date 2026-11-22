import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ContentMeta, Heading, PageLink } from "@/features/content/core/types";
import Home from "@/app/page";
import RootLayout, { DEFAULT_THEME, metadata as layoutMetadata } from "@/app/layout";
import AboutPage, { generateMetadata as aboutMetadata } from "@/app/about/page";
import UpdateDetailPage, {
  dynamicParams,
  generateMetadata as updateMetadata,
  generateStaticParams,
} from "@/app/updates/[slug]/page";

type PageFixture = ContentMeta & {
  html: string;
  headings: Heading[];
  prev?: PageLink;
  next?: PageLink;
};

const getBySlug = vi.hoisted(() => vi.fn<(input: { slug: string }) => Promise<PageFixture | null>>());
const listUpdates = vi.hoisted(() => vi.fn<() => Promise<ContentMeta[]>>());

vi.mock("@/lib/trpc/server", () => ({
  serverCaller: { content: { getBySlug, listUpdates } },
}));

// next/navigation's notFound() throws a sentinel outside Next; Next turns that sentinel into a 404.
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  useRouter: () => ({ push: () => {} }),
}));

// next/link rewrites trailing slashes according to the Next config, which this unit run does not load.
vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: ({ href, children, ...rest }: { href: string; children?: ReactNode; [key: string]: unknown }) =>
      createElement("a", { href, ...rest }, children),
  };
});

// The chrome has its own tests; these tests check what each page composes.
vi.mock("@/features/app-shell/shell/header", async () => {
  const { createElement } = await import("react");
  return { Header: () => createElement("header", { "data-testid": "chrome-header" }) };
});
vi.mock("@/features/app-shell/shell/footer", async () => {
  const { createElement } = await import("react");
  return { Footer: () => createElement("footer", { "data-testid": "chrome-footer" }) };
});
vi.mock("@/features/landing/shell/social-icons", async () => {
  const { createElement } = await import("react");
  return { SocialIcons: () => createElement("div", { "data-testid": "social" }) };
});

const ABOUT: PageFixture = {
  title: "About OSE Platform",
  slug: "about",
  description: "About the platform",
  summary: "Learn about the platform",
  draft: false,
  tags: [],
  weight: 0,
  isSection: false,
  filePath: "/content/about.md",
  readingTime: 3,
  html: '<h2 id="scope">Scope</h2><p>Synthetic content.</p>',
  headings: [{ id: "scope", text: "Scope", level: 2 }],
};

const PHASE_FOUR: PageFixture = {
  title: "Phase 4 Fixture",
  slug: "updates/2026-02-04-phase-4",
  date: new Date("2026-02-04T12:00:00Z"),
  summary: "Synthetic Phase 4 update",
  draft: false,
  tags: ["phase"],
  weight: 0,
  isSection: false,
  filePath: "/content/updates/2026-02-04-phase-4.md",
  readingTime: 2,
  category: "updates",
  html: "<p>Phase four.</p>",
  headings: [],
  prev: { title: "Phase 3", slug: "updates/2026-02-03-phase-3" },
  next: { title: "Phase 5", slug: "updates/2026-02-05-phase-5" },
};

describe("root layout", () => {
  it("renders the document with its language and the page content", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <p>Visible child</p>
      </RootLayout>,
    );

    expect(html).toContain('<html lang="en"');
    expect(html).toContain("<p>Visible child</p>");
  });

  it("uses the light theme by default and sets the site metadata", () => {
    expect(DEFAULT_THEME).toBe("light");
    expect(layoutMetadata.title).toEqual({ default: "OSE Platform", template: "%s | OSE Platform" });
  });
});

describe("home page", () => {
  it("composes the header, the hero, the social links, and the footer", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('data-testid="chrome-header"');
    expect(html).toContain("Open Sharia Enterprise Platform");
    expect(html).toContain('data-testid="social"');
    expect(html).toContain('data-testid="chrome-footer"');
  });
});

describe("about page", () => {
  it("takes its metadata from the about page", async () => {
    getBySlug.mockResolvedValueOnce(ABOUT);

    await expect(aboutMetadata()).resolves.toEqual({
      title: "About OSE Platform",
      description: "About the platform",
    });
    expect(getBySlug).toHaveBeenCalledWith({ slug: "about" });
  });

  it("falls back to the summary when the page has no description", async () => {
    getBySlug.mockResolvedValueOnce({ ...ABOUT, description: undefined });

    await expect(aboutMetadata()).resolves.toMatchObject({ description: "Learn about the platform" });
  });

  it("sets no metadata when the about page is missing", async () => {
    getBySlug.mockResolvedValueOnce(null);

    await expect(aboutMetadata()).resolves.toEqual({});
  });

  it("renders the title, the reading time, the body, and the table of contents", async () => {
    getBySlug.mockResolvedValueOnce(ABOUT);

    const html = renderToStaticMarkup(await AboutPage());

    expect(html).toContain('<h1 class="mb-4 text-3xl font-bold">About OSE Platform</h1>');
    expect(html).toContain("3 min read");
    expect(html).toContain("Synthetic content.");
    expect(html).toContain('aria-label="Table of contents"');
  });

  it("leaves out the table of contents when the page has no headings", async () => {
    getBySlug.mockResolvedValueOnce({ ...ABOUT, headings: [] });

    const html = renderToStaticMarkup(await AboutPage());

    expect(html).not.toContain('aria-label="Table of contents"');
  });

  it("answers not found when the about page is missing", async () => {
    getBySlug.mockResolvedValueOnce(null);

    await expect(AboutPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("update detail page", () => {
  it("prebuilds one route per update, named by its slug without the section prefix", async () => {
    listUpdates.mockResolvedValueOnce([PHASE_FOUR]);

    await expect(generateStaticParams()).resolves.toEqual([{ slug: "2026-02-04-phase-4" }]);
  });

  it("answers only the prebuilt routes", () => {
    expect(dynamicParams).toBe(false);
  });

  it("takes its metadata from the update it names", async () => {
    getBySlug.mockResolvedValueOnce(PHASE_FOUR);

    await expect(updateMetadata({ params: Promise.resolve({ slug: "2026-02-04-phase-4" }) })).resolves.toEqual({
      title: "Phase 4 Fixture",
      description: "Synthetic Phase 4 update",
    });
    expect(getBySlug).toHaveBeenCalledWith({ slug: "updates/2026-02-04-phase-4" });
  });

  it("sets no metadata for an unknown update", async () => {
    getBySlug.mockResolvedValueOnce(null);

    await expect(updateMetadata({ params: Promise.resolve({ slug: "missing" }) })).resolves.toEqual({});
  });

  it("renders the date, the reading time, the tags, the body, and the neighbouring links", async () => {
    getBySlug.mockResolvedValueOnce(PHASE_FOUR);

    const html = renderToStaticMarkup(
      await UpdateDetailPage({ params: Promise.resolve({ slug: "2026-02-04-phase-4" }) }),
    );

    expect(html).toContain("February 4, 2026");
    expect(html).toContain("2 min read");
    expect(html).toContain(">phase<");
    expect(html).toContain("Phase four.");
    expect(html).toContain('href="/updates/2026-02-03-phase-3/"');
    expect(html).not.toContain('aria-label="Table of contents"');
  });

  it("omits the date and tags an update does not have", async () => {
    getBySlug.mockResolvedValueOnce({ ...PHASE_FOUR, date: undefined, tags: [], prev: undefined, next: undefined });

    const html = renderToStaticMarkup(
      await UpdateDetailPage({ params: Promise.resolve({ slug: "2026-02-04-phase-4" }) }),
    );

    expect(html).not.toContain("February 4, 2026");
    expect(html).not.toContain("font-mono text-sm text-muted-foreground");
    expect(html).not.toContain('aria-label="Page navigation"');
  });

  it("answers not found for an unknown update", async () => {
    getBySlug.mockResolvedValueOnce(null);

    await expect(UpdateDetailPage({ params: Promise.resolve({ slug: "missing" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
