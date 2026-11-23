import { cleanup, render, screen, fireEvent, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/features/i18n/shell/use-locale", () => ({
  useLocale: () => "en",
}));

vi.mock("@/features/search/shell/use-search", () => ({
  useSearchOpen: () => ({ open: true, setOpen: vi.fn() }),
}));

vi.mock("@/lib/trpc/client", () => ({
  trpcClient: {
    search: {
      query: {
        query: vi
          .fn()
          .mockResolvedValue([{ slug: "learn/software-engineering", title: "Software Engineering", excerpt: "" }]),
      },
    },
  },
}));

vi.mock("@open-sharia-enterprise/web-ui", () => ({
  CommandDialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div role="dialog">{children}</div> : null,
  CommandInput: ({ onValueChange }: { onValueChange: (v: string) => void }) => (
    <input data-testid="search-input" onChange={(e) => onValueChange(e.target.value)} />
  ),
  CommandList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandEmpty: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandItem: ({ children, onSelect, value }: { children: React.ReactNode; onSelect: () => void; value: string }) => (
    <button data-value={value} onClick={onSelect}>
      {children}
    </button>
  ),
}));

// eslint-disable-next-line import/first
import { SearchDialog } from "../../../../../src/features/search/shell/search-dialog";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.clearAllMocks();
});

describe("SearchDialog", () => {
  it("navigates to the bare content URL when a search result is selected (DD-48)", async () => {
    render(<SearchDialog />);

    // Trigger debounced search
    fireEvent.change(screen.getByTestId("search-input"), { target: { value: "soft" } });

    // Advance past the 200ms debounce and flush the resolved promise
    await act(async () => {
      vi.advanceTimersByTime(300);
      // Flush microtasks so the mocked trpc resolves and setState runs
      await Promise.resolve();
    });

    const btn = screen.getByRole("button", { name: /Software Engineering/i });
    fireEvent.click(btn);

    expect(mockPush).toHaveBeenCalledWith("/en/learn/software-engineering");
  });

  // Rule-15 e2e regression (surfaced by USS-001): cmdk's own client-side fuzzy filter matches
  // against `CommandItem`'s `value` prop. When `value` carried only the slug, a query matching a
  // result's title but not its slug (e.g. "AI Model Benchmark" vs. slug `tools/ai-benchmark`) got
  // hidden by cmdk even though the server already returned it as a match.
  it("gives each result a value that includes its title, so cmdk's own filter agrees with the server's", async () => {
    render(<SearchDialog />);

    fireEvent.change(screen.getByTestId("search-input"), { target: { value: "soft" } });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    const btn = screen.getByRole("button", { name: /Software Engineering/i });
    expect(btn.getAttribute("data-value")).toBe("Software Engineering learn/software-engineering");
  });

  it("shows no results when the query fails", async () => {
    const { trpcClient } = await import("@/lib/trpc/client");
    const query = trpcClient.search.query.query as unknown as {
      mockRejectedValueOnce: (error: unknown) => void;
    };
    query.mockRejectedValueOnce(new Error("down"));
    render(<SearchDialog />);

    fireEvent.change(screen.getByTestId("search-input"), { target: { value: "soft" } });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(screen.queryByRole("button", { name: /Software Engineering/i })).toBeNull();
  });
});

describe("formatSectionPath", () => {
  it("returns empty for a top-level slug", async () => {
    const { formatSectionPath } = await import("../../../../../src/features/search/shell/search-dialog");
    expect(formatSectionPath("learn")).toBe("");
  });

  it("title-cases each ancestor segment", async () => {
    const { formatSectionPath } = await import("../../../../../src/features/search/shell/search-dialog");
    expect(formatSectionPath("learn/my-topic/deep-dive")).toBe("Learn / My Topic");
  });
});
