import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OutlineBadge } from "../../../../../src/features/course-paths/shell/outline-badge";

afterEach(cleanup);

describe("OutlineBadge (AC-4.2 RED)", () => {
  it("renders the Outline badge text in English", () => {
    render(<OutlineBadge locale="en" />);

    expect(screen.getByText("Outline")).toBeTruthy();
  });

  it("renders the Outline badge text in Indonesian", () => {
    render(<OutlineBadge locale="id" />);

    expect(screen.getByText("Kerangka")).toBeTruthy();
  });
});
