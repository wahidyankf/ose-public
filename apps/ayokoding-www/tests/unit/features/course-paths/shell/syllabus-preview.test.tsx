import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SyllabusPreview } from "../../../../../src/features/course-paths/shell/syllabus-preview";

afterEach(cleanup);

describe("SyllabusPreview (plan 02, Phase 4 — first-phase preview)", () => {
  it("renders a real <ol> so 'number is order' semantics carry over from path-landing's syllabus", () => {
    render(
      <SyllabusPreview
        locale="en"
        phaseTitle="Fixture core"
        courseTitles={["Just Enough Python", "Just Enough Bash", "Version Control & Git"]}
      />,
    );

    const list = screen.getByRole("list");
    expect(list.tagName).toBe("OL");
  });

  it("names the first phase and lists that phase's courses", () => {
    render(
      <SyllabusPreview
        locale="en"
        phaseTitle="Fixture core"
        courseTitles={[
          "Just Enough Python",
          "Just Enough Bash",
          "Version Control & Git",
          "Data Structures & Algorithms Essentials",
        ]}
      />,
    );

    expect(screen.getByText("Starts with Phase 1 · Fixture core:", { exact: false })).toBeTruthy();
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(4);
    expect(screen.getByText("Data Structures & Algorithms Essentials", { exact: false })).toBeTruthy();
  });

  it("localizes the 'Starts with Phase 1' label on the id locale", () => {
    render(<SyllabusPreview locale="id" phaseTitle="Fixture core" courseTitles={["Just Enough Python"]} />);

    expect(screen.getByText("Dimulai dengan Fase 1 · Fixture core:", { exact: false })).toBeTruthy();
  });

  it("numbers its courses by their path position, with the inline separator before each number (plan ayokoding-learn-revamp-01 §4.2)", () => {
    // Replaces the DWT-002 lock: titles no longer carry catalog numbers (Phase 3 strip), so the
    // rendered position number is now the ONLY number a preview item shows.
    render(
      <SyllabusPreview
        locale="en"
        phaseTitle="Fixture core"
        courseTitles={["Just Enough Python", "Data Structures & Algorithms Essentials"]}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0]?.textContent).toBe("1 Just Enough Python");
    expect(items[1]?.textContent).toBe(" · 2 Data Structures & Algorithms Essentials");
  });

  it("never nests the <ol> inside a <p> — invalid HTML that triggers a hydration mismatch (phase-5 EWT finding)", () => {
    // <p> only permits phrasing content per the HTML spec; a block-level <ol> descendant is
    // invalid nesting. Browsers silently close the <p> early to recover, so SSR output and the
    // hydrated client tree diverge, and React logs "In HTML, <ol> cannot be a descendant of <p>"
    // plus a hydration-mismatch error at every arc-landing single-role render (caught live via
    // Playwright MCP at http://localhost:3101/en/learn/paths/careers/interview-ready).
    const { container } = render(
      <SyllabusPreview locale="en" phaseTitle="Fixture core" courseTitles={["Just Enough Python"]} />,
    );

    const list = screen.getByRole("list");
    expect(list.closest("p")).toBeNull();

    const paragraphs = container.querySelectorAll("p");
    for (const paragraph of paragraphs) {
      expect(paragraph.querySelector("ol, ul, div, table, section, article")).toBeNull();
    }
  });
});
