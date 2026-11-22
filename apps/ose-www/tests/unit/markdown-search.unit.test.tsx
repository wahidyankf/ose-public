// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MarkdownRenderer } from "@/features/content/shell/markdown-renderer";
import { MermaidDiagram } from "@/features/content/shell/mermaid";
import { SearchProvider } from "@/features/search/shell/search-provider";
import { useSearchOpen } from "@/features/search/shell/use-search";

const mermaid = vi.hoisted(() => ({
  initialize: vi.fn<(options: unknown) => void>(),
  render: vi.fn<(id: string, chart: string) => Promise<{ svg: string }>>(),
}));
const router = vi.hoisted(() => ({ push: vi.fn<(href: string) => void>() }));
const searchQuery = vi.hoisted(() => vi.fn<(input: { query: string; limit: number }) => Promise<unknown[]>>());

vi.mock("mermaid", () => ({ default: mermaid }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/trpc/client", () => ({
  trpcClient: { search: { query: { query: searchQuery } } },
}));

// next/link rewrites trailing slashes according to the Next config, which this unit run does not load.
vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: ({ href, children, ...rest }: { href: string; children?: ReactNode; [key: string]: unknown }) =>
      createElement("a", { href, ...rest }, children),
  };
});

beforeEach(() => {
  mermaid.render.mockResolvedValue({ svg: '<svg data-testid="rendered"></svg>' });
  // The command palette measures its list and scrolls the active item into view; jsdom has neither.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Element.prototype.scrollIntoView = vi.fn<(options?: boolean | ScrollIntoViewOptions) => void>();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function noopFinish(): void {}

function OpenSearchOnKey() {
  const { open } = useSearchOpen();
  return <p>{open ? "search open" : "search closed"}</p>;
}

describe("MarkdownRenderer", () => {
  it("routes internal links through the framework link and leaves external links alone", () => {
    render(
      <MarkdownRenderer html='<p><a href="/about/" class="nav">About us</a> and <a href="https://example.com">outside</a>.</p>' />,
    );

    expect(screen.getByRole("link", { name: "About us" })).toHaveAttribute("href", "/about/");
    expect(screen.getByRole("link", { name: "About us" })).toHaveClass("nav");
    expect(screen.getByRole("link", { name: "outside" })).toHaveAttribute("href", "https://example.com");
  });

  it("draws a mermaid figure as a diagram", async () => {
    render(
      <MarkdownRenderer html='<figure data-rehype-pretty-code-figure=""><pre data-language="mermaid"><code>graph TD; A--&gt;B;</code></pre></figure>' />,
    );

    await waitFor(() => expect(mermaid.render).toHaveBeenCalledWith(expect.any(String), "graph TD; A-->B;"));
  });

  it("draws a mermaid code block that has no highlighting wrapper the same way", async () => {
    render(<MarkdownRenderer html='<pre><code class="language-mermaid">graph LR; X--&gt;Y;</code></pre>' />);

    await waitFor(() => expect(mermaid.render).toHaveBeenCalledWith(expect.any(String), "graph LR; X-->Y;"));
  });

  it("keeps other highlighted code and offers it a copy control", () => {
    render(
      <MarkdownRenderer
        html={'<figure data-rehype-pretty-code-figure=""><pre data-language="bash"><code>echo hi</code></pre></figure>'}
      />,
    );

    expect(screen.getByText("echo hi")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});

describe("MermaidDiagram", () => {
  it("shows the source until the diagram is drawn, then the drawing", async () => {
    const { container } = render(<MermaidDiagram chart="graph TD; A-->B;" />);

    expect(screen.getByText("graph TD; A-->B;")).toBeInTheDocument();
    await waitFor(() => expect(container.querySelector('[data-testid="rendered"]')).not.toBeNull());
    expect(mermaid.initialize).toHaveBeenCalledWith(expect.objectContaining({ startOnLoad: false }));
  });

  it("keeps the source on screen when the diagram is invalid", async () => {
    mermaid.render.mockRejectedValueOnce(new Error("Parse error"));
    render(<MermaidDiagram chart="not a diagram" />);

    await waitFor(() => expect(mermaid.render).toHaveBeenCalled());
    await act(async () => {});

    expect(screen.getByText("not a diagram")).toBeInTheDocument();
  });

  it("does not draw into a page it has already left", async () => {
    let finish: (value: { svg: string }) => void = noopFinish;
    mermaid.render.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
    const { unmount, container } = render(<MermaidDiagram chart="graph TD; A-->B;" />);

    await waitFor(() => expect(mermaid.render).toHaveBeenCalled());
    unmount();
    finish({ svg: '<svg data-testid="late"></svg>' });
    await act(async () => {});

    expect(container.querySelector('[data-testid="late"]')).toBeNull();
  });
});

describe("search", () => {
  it("opens the search dialog with the platform shortcut", () => {
    render(
      <SearchProvider>
        <OpenSearchOnKey />
      </SearchProvider>,
    );

    expect(screen.getByText("search closed")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "k", ctrlKey: true });

    expect(screen.getByText("search open")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search pages...")).toBeInTheDocument();
  });

  it("asks for at least two characters before it searches", async () => {
    render(
      <SearchProvider>
        <OpenSearchOnKey />
      </SearchProvider>,
    );
    fireEvent.keyDown(document, { key: "k", metaKey: true });

    fireEvent.change(screen.getByPlaceholderText("Search pages..."), { target: { value: "e" } });

    expect(screen.getByText("Type to search...")).toBeInTheDocument();
    expect(searchQuery).not.toHaveBeenCalled();
  });

  it("lists the matches and opens the chosen page", async () => {
    searchQuery.mockResolvedValueOnce([{ title: "Enterprise Compliance", slug: "about", excerpt: "Compliance notes" }]);
    render(
      <SearchProvider>
        <OpenSearchOnKey />
      </SearchProvider>,
    );
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });

    // The palette filters its items by their slug, so the query has to match the slug "about".
    fireEvent.change(screen.getByPlaceholderText("Search pages..."), { target: { value: "ab" } });
    const match = await screen.findByText("Enterprise Compliance", undefined, { timeout: 2000 });
    expect(searchQuery).toHaveBeenCalledWith({ query: "ab", limit: 10 });
    expect(within(match.parentElement!).getByText("Compliance notes")).toBeInTheDocument();

    fireEvent.click(match);

    expect(router.push).toHaveBeenCalledWith("/about/");
    expect(screen.getByText("search closed")).toBeInTheDocument();
  });

  it("reports no results when the search fails", async () => {
    searchQuery.mockRejectedValueOnce(new Error("offline"));
    render(
      <SearchProvider>
        <OpenSearchOnKey />
      </SearchProvider>,
    );
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });

    fireEvent.change(screen.getByPlaceholderText("Search pages..."), { target: { value: "xy" } });

    expect(await screen.findByText("No results found.", undefined, { timeout: 2000 })).toBeInTheDocument();
  });

  it("answers closed and does nothing when no provider wraps it", () => {
    render(<OpenSearchOnKey />);

    expect(screen.getByText("search closed")).toBeInTheDocument();
  });
});
