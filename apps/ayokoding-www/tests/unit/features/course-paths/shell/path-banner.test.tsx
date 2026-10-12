import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const setOpenMock = vi.fn();
let mockOpen = false;

vi.mock("@/features/app-shell/shell/use-mobile-nav-open", () => ({
  useMobileNavOpen: () => ({ open: mockOpen, setOpen: setOpenMock }),
}));

// eslint-disable-next-line import/first
import { PathBanner } from "../../../../../src/features/course-paths/shell/path-banner";

afterEach(() => {
  cleanup();
  mockOpen = false;
});

describe("PathBanner (Cycle 2.9 — collapses the rail into the shipped drawer on a phone)", () => {
  it("has an accessible name 'View path: Open path course list — {Path}, course {k} of {N}' (contains the visible 'View path' label per WCAG 2.5.3 Label in Name)", () => {
    render(<PathBanner locale="en" pathTitle="Python Fundamentals" courseIndex={2} totalCourses={5} />);

    expect(
      screen.getByRole("button", {
        name: "View path: Open path course list — Python Fundamentals, course 2 of 5",
      }),
    ).toBeTruthy();
  });

  it("carries aria-expanded (mirroring the shared drawer's open state) and aria-controls", () => {
    render(<PathBanner locale="en" pathTitle="Python Fundamentals" courseIndex={2} totalCourses={5} />);

    const button = screen.getByRole("button", { name: /Open path course list/i });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.hasAttribute("aria-controls")).toBe(true);
  });

  // Cycle 4 regression fix — `aria-expanded` used to be a locally-toggled `useState`, which could
  // desync from the shared drawer's real `open` state (closing the drawer by any means other than
  // this control left the local flag stale). It is now derived directly from `useMobileNavOpen()`'s
  // `open`, so it always mirrors the drawer's actual visibility.
  it("aria-expanded mirrors the shared drawer's open state, not a locally-toggled value", () => {
    mockOpen = true;
    render(<PathBanner locale="en" pathTitle="Python Fundamentals" courseIndex={2} totalCourses={5} />);

    const button = screen.getByRole("button", { name: /Open path course list/i });
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  it("activating the trigger opens the shared mobile nav drawer (single sheet, not a second overlay)", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    render(<PathBanner locale="en" pathTitle="Python Fundamentals" courseIndex={2} totalCourses={5} />);
    const trigger = screen.getByRole("button", { name: /Open path course list/i });
    await user.click(trigger);

    // Passes the trigger element explicitly (Cycle 3.4 regression fix) — WebKit does not focus a
    // clicked <button> by default, so `document.activeElement` alone is not a reliable stand-in for
    // "the element the reader just activated" (see `use-mobile-nav-open.ts`).
    expect(setOpenMock).toHaveBeenCalledWith(true, trigger);
  });

  it("renders the compact 'on path · course k of N' readout", () => {
    render(<PathBanner locale="en" pathTitle="Python Fundamentals" courseIndex={2} totalCourses={5} />);

    expect(screen.getByText(/on path/i).textContent).toMatch(/2 of 5/);
  });

  it("is hidden at md: and up (md:hidden) — the rail itself covers that breakpoint", () => {
    const { container } = render(
      <PathBanner locale="en" pathTitle="Python Fundamentals" courseIndex={2} totalCourses={5} />,
    );

    expect(container.firstElementChild?.className).toContain("md:hidden");
  });

  it("localizes the 'on path · course k of N' readout and the 'View path' trigger text on the id locale (DWT-003 fix, phase-5 rule-15 design-tester retest)", () => {
    render(<PathBanner locale="id" pathTitle="Python Fundamentals" courseIndex={2} totalCourses={5} />);

    expect(screen.getByText(/pada jalur/i).textContent).toMatch(/2 dari 5/);
    expect(screen.getByRole("button", { name: /Buka daftar kursus/i }).textContent).toBe("Lihat jalur");
  });

  it("localizes the trigger's accessible name on the id locale (UWT-002)", () => {
    render(<PathBanner locale="id" pathTitle="Python Fundamentals" courseIndex={2} totalCourses={5} />);

    expect(
      screen.getByRole("button", {
        name: "Lihat jalur: Buka daftar kursus — Python Fundamentals, kursus 2 dari 5",
      }),
    ).toBeTruthy();
  });
});
