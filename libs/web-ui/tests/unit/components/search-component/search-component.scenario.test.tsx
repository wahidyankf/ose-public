import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { SearchComponent } from "../../../../src/components/search-component/search-component";

function Search({ onUrlUpdate }: { onUrlUpdate: (term: string) => void }) {
  const [term, setTerm] = useState("");
  return (
    <SearchComponent searchTerm={term} setSearchTerm={setTerm} updateURL={onUrlUpdate} placeholder="Search posts" />
  );
}

describe("SearchComponent scenarios", () => {
  // @scenario specs/libs/web-ui/behaviours/search-component/search-component.feature: Typing updates the term and URL; Clear search empties both
  it("updates the term and the URL on typing, and empties both on Clear search", () => {
    const updateURL = vi.fn();
    render(<Search onUrlUpdate={updateURL} />);
    const input = screen.getByPlaceholderText("Search posts") as HTMLInputElement;
    expect(input.value).toBe("");

    fireEvent.change(input, { target: { value: "salt" } });

    expect(input.value).toBe("salt");
    expect(updateURL).toHaveBeenLastCalledWith("salt");

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect(input.value).toBe("");
    expect(updateURL).toHaveBeenLastCalledWith("");
  });
});
