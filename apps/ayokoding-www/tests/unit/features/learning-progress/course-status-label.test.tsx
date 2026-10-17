import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CourseStatus } from "@/features/learning-progress/core/progress-derivations";
import { CourseStatusLabel } from "@/features/learning-progress/shell/course-status-label";

afterEach(cleanup);

const CASES: ReadonlyArray<{ status: CourseStatus; en: string; id: string; icon: string }> = [
  { status: "done", en: "Done", id: "Selesai", icon: "lucide-circle-check" },
  { status: "in-progress", en: "In progress", id: "Sedang berjalan", icon: "lucide-circle-dashed" },
  { status: "not-started", en: "Not started", id: "Belum dimulai", icon: "lucide-circle" },
];

function iconOf(container: HTMLElement): HTMLElement {
  const icon = container.querySelector("span > svg");

  if (!icon) {
    throw new Error("no status icon rendered");
  }

  return icon as HTMLElement;
}

describe("CourseStatusLabel", () => {
  it("states each status in words and pairs it with a hidden icon in both locales", () => {
    for (const { status, en, id, icon } of CASES) {
      const english = render(<CourseStatusLabel status={status} locale="en" />);

      expect(screen.getByText(en)).toBeTruthy();
      expect(iconOf(english.container).getAttribute("aria-hidden")).toBe("true");
      expect(iconOf(english.container).getAttribute("class")?.split(" ")).toContain(icon);
      cleanup();

      const indonesian = render(<CourseStatusLabel status={status} locale="id" />);

      expect(screen.getByText(id)).toBeTruthy();
      expect(iconOf(indonesian.container).getAttribute("aria-hidden")).toBe("true");
      expect(iconOf(indonesian.container).getAttribute("class")?.split(" ")).toContain(icon);
      cleanup();
    }
  });

  it("sizes the icon by the size prop", () => {
    const small = render(<CourseStatusLabel status="done" locale="en" size="sm" />);
    expect(iconOf(small.container).getAttribute("class")?.split(" ")).toContain("h-3.5");
    cleanup();

    const medium = render(<CourseStatusLabel status="done" locale="en" />);
    expect(iconOf(medium.container).getAttribute("class")?.split(" ")).toContain("h-4");
  });
});
