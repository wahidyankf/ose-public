import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { SearchComponent } from "./SearchComponent";

describe("SearchComponent", () => {
  const mockSetSearchTerm = vi.fn();
  const mockUpdateURL = vi.fn();
  const placeholder = "Search...";

  const renderComponent = (searchTerm = "") => {
    return render(
      <SearchComponent
        searchTerm={searchTerm}
        setSearchTerm={mockSetSearchTerm}
        updateURL={mockUpdateURL}
        placeholder={placeholder}
      />,
    );
  };

  it("renders with correct placeholder", () => {
    renderComponent();
    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
  });

  it("updates search term on input change", () => {
    renderComponent();
    const input = screen.getByPlaceholderText(placeholder);
    fireEvent.change(input, { target: { value: "test" } });
    expect(mockSetSearchTerm).toHaveBeenCalledWith("test");
    expect(mockUpdateURL).toHaveBeenCalledWith("test");
  });

  it("clears search when clear button is clicked", () => {
    renderComponent("initial search");
    const clearButton = screen.getByLabelText("Clear search");
    fireEvent.click(clearButton);
    expect(mockSetSearchTerm).toHaveBeenCalledWith("");
    expect(mockUpdateURL).toHaveBeenCalledWith("");
  });

  it("does not show clear button when search term is empty", () => {
    renderComponent();
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });

  it("shows clear button when search term is not empty", () => {
    renderComponent("test");
    expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
  });

  it("has correct accessibility attributes", () => {
    renderComponent("test");
    const clearButton = screen.getByLabelText("Clear search");
    expect(clearButton).toHaveAttribute("aria-label", "Clear search");
  });
});
