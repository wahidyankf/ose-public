import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock declarations
const mockPush = vi.fn();
const mockGet = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

vi.mock("@/components/Navigation", () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

vi.mock("@/components/SearchComponent", () => ({
  SearchComponent: ({
    searchTerm,
    setSearchTerm,
    updateURL,
    placeholder,
  }: {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    updateURL: (term: string) => void;
    placeholder: string;
  }) => (
    <input
      data-testid="search-component"
      value={searchTerm}
      onChange={(e) => {
        setSearchTerm(e.target.value);
        updateURL(e.target.value);
      }}
      placeholder={placeholder}
    />
  ),
}));

vi.mock("@/components/HighlightText", () => ({
  HighlightText: ({ text }: { text: string }) => <span>{text}</span>,
}));

// Define a type for the project items
type ProjectItem = {
  title: string;
  description: string;
  details: string[];
  links: Record<string, string>;
};

vi.mock("@/utils/search", () => ({
  filterItems: vi.fn((items: ProjectItem[], searchTerm: string) =>
    items.filter((item) => item.title.toLowerCase().includes(searchTerm.toLowerCase())),
  ),
}));

describe("Personal Projects component", () => {
  beforeEach(() => {
    mockGet.mockReturnValue("");
    vi.clearAllMocks();
  });

  it("renders the main sections", async () => {
    const Projects = (await import("./page")).default;
    render(<Projects />);
    expect(screen.getByText("Personal Projects")).toBeInTheDocument();
    expect(screen.getByTestId("search-component")).toBeInTheDocument();
    expect(screen.getByTestId("navigation")).toBeInTheDocument();
  });

  it("renders all projects initially", async () => {
    const Projects = (await import("./page")).default;
    render(<Projects />);
    expect(screen.getByText("AyoKoding")).toBeInTheDocument();
    expect(screen.getByText("Organic Lever")).toBeInTheDocument();
    expect(screen.getByText("The Organic")).toBeInTheDocument();
  });

  it("filters projects based on search term", async () => {
    const Projects = (await import("./page")).default;
    render(<Projects />);
    const searchInput = screen.getByTestId("search-component");
    fireEvent.change(searchInput, { target: { value: "AyoKoding" } });

    await waitFor(() => {
      expect(screen.getByText("AyoKoding")).toBeInTheDocument();
      expect(screen.queryByText("Organic Lever")).not.toBeInTheDocument();
      expect(screen.queryByText("The Organic")).not.toBeInTheDocument();
    });
  });

  it("displays 'No projects found' message when no matches", async () => {
    const Projects = (await import("./page")).default;
    render(<Projects />);
    const searchInput = screen.getByTestId("search-component");
    fireEvent.change(searchInput, { target: { value: "NonexistentProject" } });

    await waitFor(() => {
      expect(screen.getByText("No projects found matching your search.")).toBeInTheDocument();
    });
  });

  it("updates URL when searching", async () => {
    const Projects = (await import("./page")).default;
    render(<Projects />);
    const searchInput = screen.getByTestId("search-component");
    fireEvent.change(searchInput, { target: { value: "AyoKoding" } });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/personal-projects?search=AyoKoding", { scroll: false });
    });
  });

  it("renders project links correctly", async () => {
    const Projects = (await import("./page")).default;
    render(<Projects />);

    const repositoryLinks = screen.getAllByRole("link", {
      name: /Repository/i,
    });
    expect(repositoryLinks[0]).toHaveAttribute("href", "https://github.com/organiclever/ayokoding");

    const websiteLinks = screen.getAllByRole("link", { name: /Website/i });
    expect(websiteLinks[0]).toHaveAttribute("href", "https://ayokoding.com/");

    const youtubeLink = screen.getByRole("link", { name: /YouTube/i });
    expect(youtubeLink).toHaveAttribute("href", "https://www.youtube.com/@AyoKoding");
  });
});
