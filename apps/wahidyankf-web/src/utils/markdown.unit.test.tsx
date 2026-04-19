import React from "react";
import { render, screen } from "@testing-library/react";
import { parseMarkdownLinks } from "./markdown";
import { describe, it, expect, vi } from "vitest";

// Mock HighlightText component
vi.mock("@/components/HighlightText", () => ({
  HighlightText: ({ text }: { text: string }) => <span>{text}</span>,
}));

describe("parseMarkdownLinks", () => {
  it("should return an array with HighlightText components when no links are present", () => {
    const text = "This is a plain text without any links";
    const result = parseMarkdownLinks(text, "");
    render(<>{result}</>);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("should parse a single markdown link correctly", () => {
    const text = "Check out [Google](https://www.google.com)";
    const result = parseMarkdownLinks(text, "");
    render(<>{result}</>);

    const link = screen.getByRole("link", { name: "Google" });
    expect(link).toHaveAttribute("href", "https://www.google.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("Check out", { exact: false })).toBeInTheDocument();
  });

  it("should parse multiple markdown links correctly", () => {
    const text = "Visit [Google](https://www.google.com) or [GitHub](https://github.com)";
    const result = parseMarkdownLinks(text, "");
    render(<>{result}</>);

    const googleLink = screen.getByRole("link", { name: "Google" });
    const githubLink = screen.getByRole("link", { name: "GitHub" });

    expect(googleLink).toHaveAttribute("href", "https://www.google.com");
    expect(githubLink).toHaveAttribute("href", "https://github.com");

    expect(screen.getByText("Visit")).toBeInTheDocument();
    expect(screen.getByText("or")).toBeInTheDocument();
  });

  it("should handle links with spaces in the URL", () => {
    const text = "Check [My Profile](https://example.com/my profile)";
    const result = parseMarkdownLinks(text, "");
    render(<>{result}</>);

    const link = screen.getByRole("link", { name: "My Profile" });
    expect(link).toHaveAttribute("href", "https://example.com/my profile");
  });

  it("should apply the correct CSS class to links", () => {
    const text = "[Styled Link](https://example.com)";
    const result = parseMarkdownLinks(text, "");
    render(<>{result}</>);

    const link = screen.getByRole("link", { name: "Styled Link" });
    expect(link).toHaveClass("content-link");
  });

  it("should highlight search terms in both link text and regular text", () => {
    const text = "Check out [Google Search](https://www.google.com) for searching";
    const searchTerm = "search";
    const result = parseMarkdownLinks(text, searchTerm);
    render(<>{result}</>);

    const highlightedTexts = screen.getAllByText((content) => content.toLowerCase().includes(searchTerm));
    expect(highlightedTexts).toHaveLength(2); // "Search" in link text and "searching" in regular text
  });
});
