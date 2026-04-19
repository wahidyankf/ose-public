import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HighlightText, highlightText } from "./HighlightText";

describe("HighlightText", () => {
  it("renders text without highlighting when no search term is provided", () => {
    render(<HighlightText text="Hello, world!" searchTerm="" />);
    expect(screen.getByText("Hello, world!")).toBeInTheDocument();
    expect(screen.queryByRole("mark")).not.toBeInTheDocument();
  });

  it("highlights matching text when search term is provided", () => {
    render(<HighlightText text="Hello, world!" searchTerm="world" />);
    const highlightedText = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === "mark" && content === "world";
    });
    expect(highlightedText).toBeInTheDocument();
    expect(highlightedText).toHaveClass("bg-yellow-300", "text-gray-900");
  });

  it("is case-insensitive when highlighting", () => {
    render(<HighlightText text="Hello, World!" searchTerm="world" />);
    const highlightedText = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === "mark" && content === "World";
    });
    expect(highlightedText).toBeInTheDocument();
  });

  it("handles multiple occurrences of search term", () => {
    render(<HighlightText text="Hello, hello, hello!" searchTerm="hello" />);
    const highlightedTexts = screen.getAllByText((content, element) => {
      return element?.tagName.toLowerCase() === "mark" && content.toLowerCase() === "hello";
    });
    expect(highlightedTexts).toHaveLength(3);
  });
});

describe("highlightText", () => {
  it("returns original text when no search term is provided", () => {
    const result = highlightText("Hello, world!", "");
    expect(result).toBe("Hello, world!");
  });

  it("returns React elements with highlighted parts", () => {
    const result = highlightText("Hello, world!", "world");

    expect(Array.isArray(result)).toBe(true);

    if (Array.isArray(result)) {
      const highlightedPart = result[1] as React.ReactElement<{ children: string }>;

      expect(React.isValidElement(highlightedPart)).toBe(true);
      expect(highlightedPart.type).toBe("mark");
      expect(highlightedPart.props.children).toBe("world");
    }
  });
});
