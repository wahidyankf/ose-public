import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
// eslint-disable-next-line import/first
import { PathPositionNumber } from "../../../../../src/features/course-paths/shell/path-position-number";

// plan ayokoding-learn-revamp-01 (tech-docs §4.2) — unit proof for the shared position-number
// component used by the path syllabus, the path rail, and (via `index + 1` spans) the arc preview.
// The number is plain visible text (never `aria-hidden`) in a right-aligned `tabular-nums` span so
// every digit lines up on the fixed 2rem gutter's right edge and screen readers keep announcing it.

afterEach(cleanup);

describe("PathPositionNumber (tech-docs §4.2 — shared right-aligned position number)", () => {
  it("renders the position as plain visible text, right-aligned with tabular numerals, not hidden from assistive tech", () => {
    render(<PathPositionNumber position={85} />);

    const number = screen.getByText("85");
    expect(number.textContent).toBe("85");
    expect(number.className).toContain("tabular-nums");
    expect(number.className).toContain("text-right");
    expect(number.getAttribute("aria-hidden")).toBeNull();
  });
});
