import { renderToString } from "react-dom/server";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PROGRESS_STORAGE_KEY } from "@/features/learning-progress/core/progress-schema";
import { parseProgress, recordVisit } from "@/features/learning-progress/core/progress-state";
import type { LessonProps } from "@/features/learning-progress/shell/lesson-context-provider";
import { learningProgressStore } from "@/features/learning-progress/shell/progress-storage";

const getRouteDataMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/trpc/client", () => ({
  trpcClient: { coursePaths: { getRouteData: { query: getRouteDataMock } } },
}));

// eslint-disable-next-line import/first
import { LessonContextProvider, useLessonContext } from "@/features/learning-progress/shell/lesson-context-provider";
// eslint-disable-next-line import/first
import { BACKEND_TRACK, BACKEND_TRACK_PATH_DATA, BASH_SEQUENCE } from "./lesson-fixtures";

function Probe() {
  const { path, index, courseTitle, pagePath, snapshot } = useLessonContext();
  const unknown = snapshot.status !== "ready";

  return (
    <ul>
      <li data-testid="path">{path === null ? "canonical" : path.pathId}</li>
      <li data-testid="phase">{path?.phase == null ? "no-phase" : `${path.phase.index}:${path.phase.title}`}</li>
      <li data-testid="position">{path === null ? "no-position" : `${path.coursePosition}/${path.totalCourses}`}</li>
      <li data-testid="next">{path?.nextCourse == null ? "no-next-course" : path.nextCourse.title}</li>
      <li data-testid="index">{String(index)}</li>
      <li data-testid="page">{pagePath}</li>
      <li data-testid="course">{courseTitle}</li>
      <li data-testid="status">{unknown ? "unknown" : "ready"}</li>
    </ul>
  );
}

function lessonProps(overrides: Partial<LessonProps> = {}): LessonProps {
  return {
    locale: "en",
    courseId: "just-enough-bash",
    courseTitle: "Just Enough Bash",
    pagePath: "learning/beginner",
    sequence: BASH_SEQUENCE,
    initialPathData: BACKEND_TRACK_PATH_DATA,
    ...overrides,
  };
}

function renderLesson(overrides: Partial<LessonProps> = {}) {
  return render(
    <LessonContextProvider {...lessonProps(overrides)}>
      <Probe />
    </LessonContextProvider>,
  );
}

/** Let the mocked runtime request's already-resolved promise reach the component. */
async function settleRuntimeRequest(): Promise<void> {
  await waitFor(() => {
    expect(getRouteDataMock).toHaveBeenCalled();
  });
  await act(async () => {
    await Promise.resolve();
  });
}

function storedState() {
  return parseProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).state;
}

beforeEach(() => {
  learningProgressStore.reset();
  window.localStorage.clear();
  getRouteDataMock.mockReset();
  getRouteDataMock.mockResolvedValue(BACKEND_TRACK_PATH_DATA);
});

afterEach(cleanup);

describe("LessonContextProvider", () => {
  it("resolves the path context from the URL once the runtime manifests arrive", async () => {
    renderLesson({ locale: "context-url", pathParam: BACKEND_TRACK.pathId });

    await waitFor(() => {
      expect(screen.getByTestId("path")).toHaveTextContent(BACKEND_TRACK.pathId);
    });
    expect(screen.getByTestId("phase")).toHaveTextContent("1:Fixture core");
    expect(screen.getByTestId("position")).toHaveTextContent("1/3");
    expect(screen.getByTestId("next")).toHaveTextContent("Backend Essentials");
  });

  it("resolves the canonical view on the server, before any runtime manifest arrives", () => {
    const html = renderToString(
      <LessonContextProvider {...lessonProps({ locale: "context-server", pathParam: BACKEND_TRACK.pathId })}>
        <Probe />
      </LessonContextProvider>,
    );

    expect(html).toContain("canonical");
    expect(html).toContain("unknown");
    expect(html).not.toContain(BACKEND_TRACK.pathId);
    expect(getRouteDataMock).not.toHaveBeenCalled();
  });

  it("keeps the remembered path inside the same course when the URL carries none", async () => {
    learningProgressStore.update((state) => recordVisit(state, "just-enough-bash", BACKEND_TRACK.pathId));

    renderLesson({ locale: "context-remembered", pathParam: null });

    await waitFor(() => {
      expect(screen.getByTestId("path")).toHaveTextContent(BACKEND_TRACK.pathId);
    });
    expect(storedState().lastPath).toEqual({ pathId: BACKEND_TRACK.pathId, courseId: "just-enough-bash" });
  });

  it("never falls back to the remembered path for an unknown URL path", async () => {
    learningProgressStore.update((state) => recordVisit(state, "just-enough-bash", BACKEND_TRACK.pathId));

    renderLesson({ locale: "context-invalid", pathParam: "careers/immediately-effective/not-a-track" });

    await settleRuntimeRequest();
    expect(screen.getByTestId("path")).toHaveTextContent("canonical");
  });

  it("ignores a remembered path that belongs to another course", async () => {
    learningProgressStore.update((state) => recordVisit(state, "sql-essentials", BACKEND_TRACK.pathId));

    renderLesson({ locale: "context-other-course", pathParam: null });

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId("path")).toHaveTextContent("canonical");
    expect(getRouteDataMock).not.toHaveBeenCalled();
  });

  it("exposes the page location and its position in the sequence", async () => {
    renderLesson({ locale: "context-location", pathParam: null });

    expect(screen.getByTestId("index")).toHaveTextContent("1");
    expect(screen.getByTestId("page")).toHaveTextContent("learning/beginner");
    expect(screen.getByTestId("course")).toHaveTextContent("Just Enough Bash");
  });

  it("records the visit with the URL's validated path id", async () => {
    renderLesson({ locale: "context-visit-url", pathParam: BACKEND_TRACK.pathId });

    await waitFor(() => {
      expect(storedState().lastPath).toEqual({ pathId: BACKEND_TRACK.pathId, courseId: "just-enough-bash" });
    });
    expect(storedState().lastCourse).toEqual({ courseId: "just-enough-bash" });
  });

  it("records a visit without a path when the URL carries none and nothing is remembered", async () => {
    renderLesson({ locale: "context-visit-none", pathParam: null });

    await waitFor(() => {
      expect(storedState().lastCourse).toEqual({ courseId: "just-enough-bash" });
    });
    expect(storedState().lastPath).toBeNull();
  });

  it("throws when a lesson component reads the context outside the provider", () => {
    expect(() => render(<Probe />)).toThrow(/lesson context/i);
  });
});

describe("LessonContextProvider — a page outside the sequence", () => {
  it("reports no position and no page title", async () => {
    renderLesson({ locale: "context-outside", pagePath: "learning/capstone/overview" });

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId("index")).toHaveTextContent("-1");
    expect(screen.getByTestId("page")).toHaveTextContent("learning/capstone/overview");
  });
});
