import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let searchParams = new URLSearchParams();
const useRuntimeCoursePathDataMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

vi.mock("../../../../../src/features/course-paths/shell/use-runtime-course-path-data", () => ({
  useRuntimeCoursePathData: useRuntimeCoursePathDataMock,
}));

vi.mock("../../../../../src/features/course-paths/shell/course-page-content", () => ({
  CoursePageContent: ({
    renderData,
  }: {
    renderData: {
      activeContext: { pathId: string } | null;
      prerequisiteLinks: readonly { title: string }[];
      pathBadges: readonly { title: string }[];
    };
  }) => (
    <div>
      <div data-testid="active-path">{renderData.activeContext?.pathId ?? "canonical"}</div>
      <div data-testid="prerequisites">{renderData.prerequisiteLinks.map(({ title }) => title).join(", ")}</div>
      <div data-testid="path-badges">{renderData.pathBadges.map(({ title }) => title).join(", ")}</div>
    </div>
  ),
}));

// eslint-disable-next-line import/first
import { CoursePagePathContent } from "../../../../../src/features/course-paths/shell/course-page-path-content";

const canonicalRenderData = {
  activeContext: null,
  prerequisiteLinks: [{ title: "Data Structures", slug: "learn/courses/data-structures" }],
  pathBadges: [{ pathId: "skills/algorithms", title: "Algorithms" }],
  prev: null,
  next: null,
} as const;

const runtimePathData = {
  manifests: [
    {
      pathId: "skills/algorithms",
      arc: "algorithms",
      title: "Algorithms",
      description: "Algorithms path",
      courseOrder: ["advanced-algorithms"],
    },
  ],
  prerequisitesByCourse: {},
  libraryCourseIds: ["advanced-algorithms"],
  outlineCourseIds: [],
  courseLinks: {},
};

function renderCoursePage() {
  return render(
    <CoursePagePathContent
      locale="en"
      slug="learn/courses/advanced-algorithms"
      title="Advanced Algorithms"
      html="<p>Algorithms</p>"
      headings={[]}
      breadcrumbSegments={[]}
      courseId="advanced-algorithms"
      canonicalRenderData={canonicalRenderData}
      fallbackPrev={null}
      fallbackNext={null}
    />,
  );
}

afterEach(() => {
  cleanup();
  searchParams = new URLSearchParams();
  useRuntimeCoursePathDataMock.mockReset();
});

describe("CoursePagePathContent", () => {
  it("keeps the compact canonical prerequisite links and path badges after ordinary-page hydration", () => {
    useRuntimeCoursePathDataMock.mockReturnValue({
      data: runtimePathData,
      isReady: false,
    });

    renderCoursePage();

    expect(screen.getByTestId("prerequisites")).toHaveTextContent("Data Structures");
    expect(screen.getByTestId("path-badges")).toHaveTextContent("Algorithms");
    expect(useRuntimeCoursePathDataMock).toHaveBeenCalledWith("en", expect.any(Object), false);
  });

  it("keeps canonical chrome while a valid path refresh is pending or unavailable", () => {
    searchParams = new URLSearchParams({ path: "skills/algorithms" });
    useRuntimeCoursePathDataMock.mockReturnValue({ data: runtimePathData, isReady: false });

    renderCoursePage();

    expect(screen.getByTestId("active-path")).toHaveTextContent("canonical");
    expect(screen.getByTestId("prerequisites")).toHaveTextContent("Data Structures");
    expect(screen.getByTestId("path-badges")).toHaveTextContent("Algorithms");
  });

  it("switches to valid runtime path chrome only after its data is ready", () => {
    searchParams = new URLSearchParams({ path: "skills/algorithms" });
    useRuntimeCoursePathDataMock.mockReturnValue({ data: runtimePathData, isReady: true });

    renderCoursePage();

    expect(screen.getByTestId("active-path")).toHaveTextContent("skills/algorithms");
    // Which paths include this course is a fact about the course, not about the URL: the statically
    // served page always carries the canonical badge list, so a ready path-aware render keeps it
    // too. Blanking it here is what would collapse the whole "part of paths" block below the header
    // — and move every line under it — the moment the runtime data arrived (S8).
    expect(screen.getByTestId("path-badges")).toHaveTextContent("Algorithms");
  });

  it("keeps canonical chrome for an invalid path after runtime data is ready", () => {
    searchParams = new URLSearchParams({ path: "skills/missing" });
    useRuntimeCoursePathDataMock.mockReturnValue({ data: runtimePathData, isReady: true });

    renderCoursePage();

    expect(screen.getByTestId("active-path")).toHaveTextContent("canonical");
    expect(screen.getByTestId("prerequisites")).toHaveTextContent("Data Structures");
    expect(screen.getByTestId("path-badges")).toHaveTextContent("Algorithms");
  });
});
