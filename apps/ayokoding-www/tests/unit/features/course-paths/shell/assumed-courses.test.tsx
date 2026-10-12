import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { AssumedCourses } from "../../../../../src/features/course-paths/shell/assumed-courses";

afterEach(cleanup);

const courseTitles = {
  "just-enough-python": "Just Enough Python",
  "data-structures-and-algorithms-essentials": "Data Structures & Algorithms Essentials",
};

describe("AssumedCourses (AC-4.2 RED)", () => {
  it("titles the note 'Before you start' and lists every assumed course as a canonical link", () => {
    render(
      <AssumedCourses
        locale="en"
        assumes={["just-enough-python", "data-structures-and-algorithms-essentials"]}
        courseTitles={courseTitles}
      />,
    );

    expect(screen.getByText("Before you start")).toBeTruthy();
    const python = screen.getByRole("link", { name: "Just Enough Python" });
    expect(python.getAttribute("href")).toBe("/en/learn/courses/just-enough-python");
    const dsa = screen.getByRole("link", { name: "Data Structures & Algorithms Essentials" });
    expect(dsa.getAttribute("href")).toBe("/en/learn/courses/data-structures-and-algorithms-essentials");
  });

  it("never carries the path context query parameter on an assumed-course link", () => {
    render(<AssumedCourses locale="en" assumes={["just-enough-python"]} courseTitles={courseTitles} />);

    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute("href")).not.toContain("?path=");
    }
  });

  it("renders nothing when the path assumes nothing", () => {
    const { container } = render(<AssumedCourses locale="en" assumes={[]} courseTitles={courseTitles} />);

    expect(container.textContent).toBe("");
    expect(screen.queryByText("Before you start")).toBeNull();
  });

  it("falls back to a humanized title for an assumed course with no resolved title", () => {
    render(<AssumedCourses locale="en" assumes={["unresolved-course"]} courseTitles={courseTitles} />);

    expect(screen.getByRole("link", { name: "Unresolved Course" })).toBeTruthy();
  });

  it("localizes the note title and intro on the id locale", () => {
    render(<AssumedCourses locale="id" assumes={["just-enough-python"]} courseTitles={courseTitles} />);

    expect(screen.getByText("Sebelum memulai")).toBeTruthy();
    expect(screen.getByText("Jalur ini mengasumsikan Anda sudah menguasai:")).toBeTruthy();
  });

  it("lists the assumed courses in a single unordered list", () => {
    render(
      <AssumedCourses
        locale="en"
        assumes={["just-enough-python", "data-structures-and-algorithms-essentials"]}
        courseTitles={courseTitles}
      />,
    );

    const list = screen.getByRole("list");
    expect(list.tagName).toBe("UL");
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
  });
});
