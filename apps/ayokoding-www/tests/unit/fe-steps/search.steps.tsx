import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { expect, vi } from "vitest";
import "./helpers/test-setup";

const routerPush = vi.hoisted(() => vi.fn());
const searchQuery = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));
vi.mock("@/features/i18n/shell/use-locale", () => ({
  useLocale: () => "en",
}));
vi.mock("@/lib/trpc/client", () => ({
  trpcClient: { search: { query: { query: searchQuery } } },
}));

import { SearchDialog, formatSectionPath } from "@/features/search/shell/search-dialog";
import { SearchContext } from "@/features/search/shell/use-search";

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/search/search.feature"),
);

const programmingResult = {
  title: "Getting Started with Go",
  slug: "learn/software-engineering/programming-languages/golang/overview",
  excerpt: "Learn Go programming from its foundations.",
};

function SearchHarness({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <>
      <button type="button">Page trigger</button>
      <output data-testid="search-open">{String(open)}</output>
      <SearchContext.Provider value={{ open, setOpen }}>
        <SearchDialog />
      </SearchContext.Provider>
    </>
  );
}

function renderOpenSearch() {
  render(<SearchHarness initiallyOpen />);
  return screen.getByPlaceholderText("Search...");
}

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanup();
    searchQuery.mockReset();
    routerPush.mockReset();
  });

  Background(({ Given }) => {
    Given("the app is running", () => {
      expect(SearchDialog).toBeTypeOf("function");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/search/search.feature: Cmd+K keyboard shortcut opens the search dialog
  Scenario("Cmd+K keyboard shortcut opens the search dialog", ({ When, Then, And }) => {
    When("a visitor presses Cmd+K on the page", () => {
      render(<SearchHarness />);
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });

    Then("the search dialog should open", () => {
      expect(screen.getByTestId("search-open").textContent).toBe("true");
      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    And("the search input should have focus", async () => {
      await waitFor(() => expect(document.activeElement).toBe(screen.getByPlaceholderText("Search...")));
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/search/search.feature: Typing a query shows matching results that update as the query changes
  Scenario("Typing a query shows matching results that update as the query changes", ({ Given, When, Then, And }) => {
    let input: HTMLElement;
    Given("the search dialog is open", () => {
      searchQuery.mockResolvedValue([programmingResult]);
      input = renderOpenSearch();
    });

    When("the visitor types a query into the search input", () => {
      fireEvent.change(input, { target: { value: "Go" } });
    });

    Then("search results should appear after a debounce delay", async () => {
      await waitFor(() => expect(searchQuery).toHaveBeenCalledWith({ query: "Go", locale: "en", limit: 10 }));
      expect(await screen.findByText(programmingResult.title)).toBeTruthy();
    });

    And("results should update when the visitor changes the query", async () => {
      searchQuery.mockResolvedValue([{ ...programmingResult, title: "Advanced Go" }]);
      fireEvent.change(input, { target: { value: "Advanced" } });
      await waitFor(() => expect(searchQuery).toHaveBeenLastCalledWith({ query: "Advanced", locale: "en", limit: 10 }));
      expect(await screen.findByText("Advanced Go")).toBeTruthy();
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/search/search.feature: Clicking a search result navigates to that page
  Scenario("Clicking a search result navigates to that page", ({ Given, When, Then, And }) => {
    let input: HTMLElement;
    Given("the search dialog is open", () => {
      searchQuery.mockResolvedValue([programmingResult]);
      input = renderOpenSearch();
    });
    And("the visitor has typed a query that returns at least one result", async () => {
      fireEvent.change(input, { target: { value: "Go" } });
      expect(await screen.findByText(programmingResult.title)).toBeTruthy();
    });

    When("the visitor clicks a search result", () => {
      fireEvent.click(screen.getByText(programmingResult.title));
    });

    Then("the search dialog should close", () => {
      expect(screen.getByTestId("search-open").textContent).toBe("false");
    });

    And("the visitor should be navigated to the page for that result", () => {
      expect(routerPush).toHaveBeenCalledWith(`/en/${programmingResult.slug}`);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/search/search.feature: Escape key closes the search dialog
  Scenario("Escape key closes the search dialog", ({ Given, When, Then, And }) => {
    let trigger: HTMLElement;
    Given("the search dialog is open", async () => {
      render(<SearchHarness initiallyOpen />);
      trigger = screen.getByRole("button", { name: "Page trigger", hidden: true });
      trigger.focus();
      await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
    });

    When("the visitor presses Escape", () => {
      fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    });

    Then("the search dialog should close", async () => {
      await waitFor(() => expect(screen.getByTestId("search-open").textContent).toBe("false"));
    });

    And("focus should return to the page behind the dialog", async () => {
      await act(async () => Promise.resolve());
      expect(document.activeElement === trigger || document.activeElement === document.body).toBe(true);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/search/search.feature: Search results show title, section path, and excerpt
  Scenario("Search results show title, section path, and excerpt", ({ Given, When, Then, And }) => {
    let input: HTMLElement;
    Given("the search dialog is open", () => {
      searchQuery.mockResolvedValue([programmingResult]);
      input = renderOpenSearch();
    });

    When("the visitor types a query that returns results", () => {
      fireEvent.change(input, { target: { value: "programming" } });
    });

    Then("each result should display the page title", async () => {
      expect(await screen.findByText(programmingResult.title)).toBeTruthy();
    });

    And("each result should display the section path indicating where the page lives", () => {
      expect(screen.getByText(formatSectionPath(programmingResult.slug))).toBeTruthy();
    });

    And("each result should display a text excerpt showing the matching content", () => {
      expect(screen.getByText(programmingResult.excerpt)).toBeTruthy();
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/search/search.feature: Global search surfaces the Tools pages
  Scenario("Global search surfaces the Tools pages", ({ Given, When, Then }) => {
    let input: HTMLElement;
    Given("the search dialog is open", () => {
      searchQuery.mockResolvedValue([
        { title: "AI Model Benchmark", slug: "tools/ai-benchmark", excerpt: "Compare AI models." },
      ]);
      input = renderOpenSearch();
    });

    When("the visitor types a query naming the AI Model Benchmark tool", () => {
      fireEvent.change(input, { target: { value: "AI Model Benchmark" } });
    });

    Then("a result linking to the AI Model Benchmark tool page is shown", async () => {
      const result = await screen.findByText("AI Model Benchmark");
      expect(result.closest("[cmdk-item]")?.getAttribute("data-value")).toContain("tools/ai-benchmark");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/search/search.feature: Ctrl+K opens the search dialog on non-Mac platforms
  Scenario("Ctrl+K opens the search dialog on non-Mac platforms", ({ When, Then, And }) => {
    When("a visitor presses Ctrl+K on the page", () => {
      render(<SearchHarness />);
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });

    Then("the search dialog should open", () => {
      expect(screen.getByTestId("search-open").textContent).toBe("true");
      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    And("the search input should have focus", async () => {
      await waitFor(() => expect(document.activeElement).toBe(screen.getByPlaceholderText("Search...")));
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/search/search.feature: A query with no match shows a no-results message
  Scenario("A query with no match shows a no-results message", ({ Given, When, Then }) => {
    let input: HTMLElement;
    Given("the search dialog is open", () => {
      searchQuery.mockResolvedValue([]);
      input = renderOpenSearch();
    });

    When("the visitor types a query that matches no page", () => {
      fireEvent.change(input, { target: { value: "zzqxv" } });
    });

    Then("the search dialog should show a no-results message", async () => {
      await waitFor(() => expect(searchQuery).toHaveBeenCalledWith({ query: "zzqxv", locale: "en", limit: 10 }));
      expect(await screen.findByText("No results found")).toBeTruthy();
    });
  });
});
