import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HighlightText } from "../../../../src/components/highlight-text/highlight-text";

describe("HighlightText scenarios", () => {
  // @scenario specs/libs/web-ui/behaviours/highlight-text/highlight-text.feature: Every case-insensitive match is marked
  it("marks every case-insensitive match", () => {
    const { container } = render(<HighlightText text="Salt and salt, not pepper" searchTerm="salt" />);

    const marks = Array.from(container.querySelectorAll("mark"), (mark) => mark.textContent);

    expect(marks).toEqual(["Salt", "salt"]);
  });
});
