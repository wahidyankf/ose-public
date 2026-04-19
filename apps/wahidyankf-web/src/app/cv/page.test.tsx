import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock declarations
const mockPush = vi.fn();
const mockGet = vi.fn();

// Add this mock for window.scrollTo
vi.stubGlobal("scrollTo", vi.fn());

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
    placeholder,
  }: {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    placeholder: string;
  }) => (
    <input
      data-testid="search-component"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

vi.mock("@/components/HighlightText", () => ({
  HighlightText: ({ text }: { text: string }) => <span>{text}</span>,
}));

vi.mock("@/utils/search", () => ({
  filterItems: vi.fn((items) => items),
}));

describe("CV component", () => {
  beforeEach(() => {
    // Define mock data
    const mockCvData = [
      {
        type: "about",
        title: "About Me",
        details: ["Test about me"],
        links: {
          github: "https://github.com",
          linkedin: "https://linkedin.com",
          email: "test@example.com",
        },
      },
      {
        type: "work",
        title: "Software Engineer",
        organization: "Tech Company",
        period: "Jan 2020 - Present",
        details: ["Worked on various projects"],
        skills: ["React", "TypeScript"],
        programmingLanguages: ["JavaScript"],
        frameworks: ["Next.js"],
      },
      {
        type: "education",
        title: "Bachelor of Science in Computer Science",
        organization: "University of Example",
        period: "2015 - 2019",
        details: ["Graduated with honors"],
      },
    ];

    // Use vi.doMock for the data module
    vi.doMock("@/app/data", () => ({
      cvData: mockCvData,
      getTopSkillsLastFiveYears: () => [{ name: "React", duration: 60 }],
      getTopLanguagesLastFiveYears: () => [{ name: "JavaScript", duration: 60 }],
      getTopFrameworksLastFiveYears: () => [{ name: "Next.js", duration: 60 }],
      formatDuration: (duration: number) => `${duration} months`,
      parseDate: vi.fn(),
      calculateDuration: vi.fn(),
      calculateTotalDuration: vi.fn(),
    }));

    mockGet.mockReturnValue("");
    vi.clearAllMocks();

    // Reset the scrollTo mock
    vi.mocked(window.scrollTo).mockReset();
  });

  it("renders the main sections", async () => {
    const CV = (await import("./page")).default;
    render(<CV />);
    expect(screen.getByText("Curriculum Vitae")).toBeInTheDocument();
    expect(screen.getByText("Highlights")).toBeInTheDocument();
  });

  it("renders the Navigation component", async () => {
    const CV = (await import("./page")).default;
    render(<CV />);
    expect(screen.getByTestId("navigation")).toBeInTheDocument();
  });

  it("renders the SearchComponent", async () => {
    const CV = (await import("./page")).default;
    render(<CV />);
    expect(screen.getByTestId("search-component")).toBeInTheDocument();
  });

  it("renders the about section", async () => {
    const CV = (await import("./page")).default;
    render(<CV />);
    expect(screen.getByText("About Me")).toBeInTheDocument();
    expect(screen.getByText(/Test about me/)).toBeInTheDocument();
  });

  it("renders work experience", async () => {
    const CV = (await import("./page")).default;
    render(<CV />);
    expect(await screen.findByText("Work Experience")).toBeInTheDocument();
    const softwareElements = await screen.findAllByText(/Software/);
    expect(softwareElements.length).toBeGreaterThan(0);

    const workExperienceSection = screen.getByText("Work Experience").closest("div");
    expect(workExperienceSection).toBeInTheDocument();
    expect(workExperienceSection?.textContent).toMatch(/\w+/);
  });

  it("renders skills, languages, and frameworks", async () => {
    const CV = (await import("./page")).default;
    render(<CV />);
    expect(await screen.findByText("Top Skills Used in The Last 5 Years")).toBeInTheDocument();
    const reactElements = await screen.findAllByText(/React/);
    expect(reactElements.length).toBeGreaterThan(0);
  });

  it("updates search term when typing in the search component", async () => {
    const CV = (await import("./page")).default;
    render(<CV />);
    const searchInput = screen.getByTestId("search-component") as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: "React" } });
    expect(searchInput.value).toBe("React");
  });

  it("filters content based on search term", async () => {
    const CV = (await import("./page")).default;
    render(<CV />);
    const searchInput = screen.getByTestId("search-component");
    fireEvent.change(searchInput, { target: { value: "Software" } });
    await waitFor(() => {
      expect(screen.getAllByText(/Software/).length).toBeGreaterThan(0);
    });
  });

  it("handles item click and updates search", async () => {
    const CV = (await import("./page")).default;
    render(<CV />);
    const skillButtons = await screen.findAllByText("React");
    fireEvent.click(skillButtons[0]);
    expect(mockPush).toHaveBeenCalled();
    expect(mockPush.mock.calls[0][0]).toMatch(/^\/cv\?search=React/);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("renders education entries with organization", async () => {
    const CV = (await import("./page")).default;
    render(<CV />);

    expect(screen.getByText("Education")).toBeInTheDocument();
    expect(screen.getByText("Bachelor of Science in Computer Science")).toBeInTheDocument();
    expect(screen.getByText("University of Example")).toBeInTheDocument();
    expect(screen.getByText("2015 - 2019")).toBeInTheDocument();
    expect(screen.getByText("Graduated with honors")).toBeInTheDocument();
  });
});
