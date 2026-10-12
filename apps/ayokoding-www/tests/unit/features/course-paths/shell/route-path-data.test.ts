import { describe, expect, it, vi } from "vitest";
import type { ContentMeta } from "@/features/content/core/types";

const { fixtureManifest, contentMap } = vi.hoisted(() => {
  const manifest = {
    pathId: "skills/python-fundamentals",
    arc: "python-fundamentals",
    title: "Python Fundamentals",
    description: "Learn Python from the ground up.",
    courseOrder: ["just-enough-python"],
  };
  const map: Map<string, ContentMeta> = new Map([
    [
      "en:learn/courses/just-enough-python",
      {
        title: "Just Enough Python",
        slug: "learn/courses/just-enough-python",
        locale: "en",
        weight: 0,
        tags: [],
        draft: false,
        isSection: false,
        filePath: "/tmp/x.md",
      },
    ],
  ]);
  return { fixtureManifest: manifest, contentMap: map };
});

vi.mock("@/features/app-shell/shell/trpc-init", () => ({
  createTRPCContext: () => ({
    contentService: { getIndex: async () => ({ contentMap, trees: {}, prevNext: new Map() }) },
  }),
}));

vi.mock("../../../../../src/features/course-paths/shell/manifest-repository", () => ({
  loadManifests: vi.fn().mockResolvedValue([fixtureManifest]),
  defaultManifestsDir: () => "unused-in-test",
}));

// eslint-disable-next-line import/first
import { loadRoutePathData } from "../../../../../src/features/course-paths/shell/route-path-data";
// eslint-disable-next-line import/first
import { loadManifests } from "../../../../../src/features/course-paths/shell/manifest-repository";

describe("loadRoutePathData", () => {
  it("builds the course library from the content index and loads manifests scoped to it", async () => {
    const data = await loadRoutePathData("en");

    expect(data.contentMap).toBe(contentMap);
    expect(data.libraryCourseIds).toEqual(["just-enough-python"]);
    expect(data.manifests).toEqual([fixtureManifest]);
  });

  it("passes the derived library course IDs to loadManifests, not an empty/unscoped list", async () => {
    await loadRoutePathData("en");

    expect(loadManifests).toHaveBeenCalledWith("unused-in-test", ["just-enough-python"]);
  });
});

/**
 * Regression: `loadRoutePathData` used to pass the locale-scoped `libraryCourseIds` to
 * `loadManifests`, so a manifest naming a course not yet translated into the locale being rendered
 * threw for every page in that locale. It must pass a locale-independent course-ID list instead
 * (`deriveAllCourseIds`) — see `course-library.test.ts` for the underlying derivation's own tests.
 */
describe("loadRoutePathData — manifest-integrity course IDs are locale-independent", () => {
  it("passes loadManifests a course ID present only in a different locale than the one being rendered", async () => {
    contentMap.set("id:learn/courses/only-in-indonesian", {
      title: "Hanya Dalam Bahasa Indonesia",
      slug: "learn/courses/only-in-indonesian",
      locale: "id",
      weight: 0,
      tags: [],
      draft: false,
      isSection: false,
      filePath: "/tmp/y.md",
    });

    await loadRoutePathData("en");

    const [, passedCourseIds] = vi.mocked(loadManifests).mock.calls.at(-1) ?? [];
    expect(passedCourseIds).toContain("only-in-indonesian");
    expect(passedCourseIds).toContain("just-enough-python");
  });
});

describe("loadRoutePathData — outlineCourseIds is locale-independent (AC-4.1)", () => {
  it("reports an outline course declared in en for both the en and the id request", async () => {
    contentMap.set("en:learn/courses/capstone-secure-service", {
      title: "Capstone: Secure Service",
      slug: "learn/courses/capstone-secure-service",
      locale: "en",
      weight: 0,
      tags: [],
      draft: false,
      isSection: false,
      filePath: "/tmp/z.md",
      status: "outline",
    });

    expect((await loadRoutePathData("en")).outlineCourseIds).toContain("capstone-secure-service");
    expect((await loadRoutePathData("id")).outlineCourseIds).toContain("capstone-secure-service");
  });
});
