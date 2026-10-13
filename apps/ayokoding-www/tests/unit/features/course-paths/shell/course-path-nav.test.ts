import { describe, expect, it } from "vitest";
import {
  courseIdFromSlug,
  slugForCourseId,
  resolveActiveCoursePathContext,
  pageLinkForCourseId,
  derivePathBadges,
  resolveCoursePathRenderData,
  toCoursePathClientData,
  EMPTY_COURSE_PATH_CLIENT_DATA,
  buildCourseTitleIndex,
  courseTitlesFromClientData,
  humanizeKebabSlug,
  buildArcTitleIndex,
  slugFromPathname,
  resolveActiveCourseFromLocation,
  coursePositionInManifest,
} from "../../../../../src/features/course-paths/shell/course-path-nav";
import type { PathManifest } from "../../../../../src/features/course-paths/core/schemas";
import type { ContentMeta } from "@/features/content/core/types";
import { manifestFixture } from "../manifest-fixture";

const fixtureManifest: PathManifest = manifestFixture({
  pathId: "careers/interview-ready/software-engineer",
  arc: "interview-ready",
  title: "Interview-Ready Software Engineer",
  description: "Interview-first track for an experienced engineer re-entering the market.",
  courses: ["just-enough-python", "data-structures-and-algorithms-essentials", "capstone-forge-ready"],
});

const secondFixtureManifest: PathManifest = manifestFixture({
  pathId: "careers/fundamentally-strong/software-engineer",
  arc: "fundamentally-strong",
  title: "Fundamentally Strong Software Engineer",
  description: "Bottom-up CS foundations first.",
  courses: ["computer-science-foundations", "just-enough-python"],
});

describe("courseIdFromSlug / slugForCourseId", () => {
  it("extracts the course ID from a course slug", () => {
    expect(courseIdFromSlug("learn/courses/just-enough-python")).toBe("just-enough-python");
  });

  it("returns null for a non-course slug", () => {
    expect(courseIdFromSlug("learn/paths/careers/interview-ready/software-engineer")).toBeNull();
  });

  it("round-trips courseIdFromSlug(slugForCourseId(id)) === id", () => {
    expect(courseIdFromSlug(slugForCourseId("just-enough-python"))).toBe("just-enough-python");
  });
});

describe("resolveActiveCoursePathContext", () => {
  it("resolves the active manifest and prev/next when ?path= names a loaded manifest containing the course", () => {
    const searchParams = new URLSearchParams({ path: fixtureManifest.pathId });

    const result = resolveActiveCoursePathContext(
      searchParams,
      [fixtureManifest],
      "data-structures-and-algorithms-essentials",
    );

    expect(result).not.toBeNull();
    expect(result?.pathId).toBe(fixtureManifest.pathId);
    expect(result?.nav).toEqual({
      prev: { id: "just-enough-python" },
      next: { id: "capstone-forge-ready" },
    });
  });

  it("returns null when no ?path= is present", () => {
    const result = resolveActiveCoursePathContext(new URLSearchParams(), [fixtureManifest], "just-enough-python");

    expect(result).toBeNull();
  });

  it("returns null when ?path= names no loaded manifest (Cycle 2.6 — invalid path falls back)", () => {
    const searchParams = new URLSearchParams({ path: "careers/does-not-exist/anywhere" });

    const result = resolveActiveCoursePathContext(searchParams, [fixtureManifest], "just-enough-python");

    expect(result).toBeNull();
  });

  it("returns null when the course is absent from a valid path's courseOrder (Cycle 2.7 — omitted course)", () => {
    const searchParams = new URLSearchParams({ path: fixtureManifest.pathId });

    const result = resolveActiveCoursePathContext(searchParams, [fixtureManifest], "a-course-this-path-omits");

    expect(result).toBeNull();
  });

  it("resolves against the correct manifest when multiple manifests are loaded", () => {
    const searchParams = new URLSearchParams({ path: secondFixtureManifest.pathId });

    const result = resolveActiveCoursePathContext(
      searchParams,
      [fixtureManifest, secondFixtureManifest],
      "just-enough-python",
    );

    expect(result?.pathId).toBe(secondFixtureManifest.pathId);
    expect(result?.nav).toEqual({ prev: { id: "computer-science-foundations" }, next: null });
  });
});

function courseMeta(slug: string, title: string): ContentMeta {
  return {
    title,
    slug,
    locale: "en",
    weight: 0,
    tags: [],
    draft: false,
    isSection: false,
    filePath: "/tmp/x.md",
  };
}

describe("pageLinkForCourseId", () => {
  const contentMap = new Map<string, ContentMeta>([
    ["en:learn/courses/just-enough-python", courseMeta("learn/courses/just-enough-python", "Just Enough Python")],
  ]);

  it("resolves a course ID to its PageLink via the content map", () => {
    const link = pageLinkForCourseId(contentMap, "en", "just-enough-python");
    expect(link).toEqual({ title: "Just Enough Python", slug: "learn/courses/just-enough-python" });
  });

  it("returns null when the course ID has no matching content page", () => {
    expect(pageLinkForCourseId(contentMap, "en", "does-not-exist")).toBeNull();
  });

  it("returns null when the course ID exists but for a different locale", () => {
    expect(pageLinkForCourseId(contentMap, "id", "just-enough-python")).toBeNull();
  });
});

describe("derivePathBadges", () => {
  const manifestA: PathManifest = manifestFixture({
    pathId: "skills/python-fundamentals",
    arc: "python-fundamentals",
    title: "Python Fundamentals",
    description: "Learn Python from the ground up.",
    courses: ["just-enough-python", "data-structures-and-algorithms-essentials"],
  });
  const manifestB: PathManifest = manifestFixture({
    pathId: "careers/interview-ready/software-engineer",
    arc: "interview-ready",
    title: "Interview-Ready Software Engineer",
    description: "Interview-first track.",
    courses: ["data-structures-and-algorithms-essentials", "capstone-forge-ready"],
  });

  it("returns one badge per manifest whose courseOrder lists the course", () => {
    const badges = derivePathBadges([manifestA, manifestB], "data-structures-and-algorithms-essentials");
    expect(badges).toEqual([
      { pathId: "skills/python-fundamentals", title: "Python Fundamentals" },
      { pathId: "careers/interview-ready/software-engineer", title: "Interview-Ready Software Engineer" },
    ]);
  });

  it("returns an empty array when no manifest lists the course", () => {
    expect(derivePathBadges([manifestA, manifestB], "some-other-course")).toEqual([]);
  });

  // No-forked-body acceptance clause (Cycle 2.5): a course ID shared by two manifests always
  // resolves to exactly one canonical body slug — badges point at each path's own landing page,
  // never at a per-path copy of the course body.
  it("no-forked-body: a course shared by two manifests still has exactly one canonical body slug", () => {
    const sharedCourseId = "data-structures-and-algorithms-essentials";
    const badges = derivePathBadges([manifestA, manifestB], sharedCourseId);

    expect(badges).toHaveLength(2);
    expect(new Set(badges.map((b) => b.pathId)).size).toBe(2);
    // The body itself lives at exactly one slug regardless of how many manifests reference it.
    expect(slugForCourseId(sharedCourseId)).toBe("learn/courses/data-structures-and-algorithms-essentials");
  });
});

describe("resolveCoursePathRenderData", () => {
  const manifest: PathManifest = manifestFixture({
    pathId: "skills/python-fundamentals",
    arc: "python-fundamentals",
    title: "Python Fundamentals",
    description: "Learn Python from the ground up.",
    courses: ["version-control-and-git", "just-enough-python", "data-structures-and-algorithms-essentials"],
  });
  const contentMap = new Map<string, ContentMeta>([
    ["en:learn/courses/version-control-and-git", courseMeta("learn/courses/version-control-and-git", "Git")],
    ["en:learn/courses/just-enough-python", courseMeta("learn/courses/just-enough-python", "Just Enough Python")],
    [
      "en:learn/courses/data-structures-and-algorithms-essentials",
      courseMeta("learn/courses/data-structures-and-algorithms-essentials", "Data Structures & Algorithms"),
    ],
  ]);
  const fallbackPrev = { title: "Fallback Prev", slug: "learn/courses/fallback-prev" };
  const fallbackNext = { title: "Fallback Next", slug: "learn/courses/fallback-next" };

  it("with an active path context, resolves prev/next from the manifest neighbours, not the fallback", () => {
    const searchParams = new URLSearchParams({ path: manifest.pathId });

    const result = resolveCoursePathRenderData(
      searchParams,
      { contentMap, manifests: [manifest], prerequisitesByCourse: {}, libraryCourseIds: [], outlineCourseIds: [] },
      "just-enough-python",
      "en",
      fallbackPrev,
      fallbackNext,
    );

    expect(result.activeContext?.pathId).toBe(manifest.pathId);
    expect(result.prev).toEqual({ title: "Git", slug: "learn/courses/version-control-and-git" });
    expect(result.next).toEqual({
      title: "Data Structures & Algorithms",
      slug: "learn/courses/data-structures-and-algorithms-essentials",
    });
  });

  it("with no path context, falls back to the supplied prev/next unchanged", () => {
    const result = resolveCoursePathRenderData(
      new URLSearchParams(),
      { contentMap, manifests: [manifest], prerequisitesByCourse: {}, libraryCourseIds: [], outlineCourseIds: [] },
      "just-enough-python",
      "en",
      fallbackPrev,
      fallbackNext,
    );

    expect(result.activeContext).toBeNull();
    expect(result.prev).toEqual(fallbackPrev);
    expect(result.next).toEqual(fallbackNext);
  });

  it("resolves declared, in-library prerequisite links regardless of path context", () => {
    const result = resolveCoursePathRenderData(
      new URLSearchParams(),
      {
        contentMap,
        manifests: [manifest],
        prerequisitesByCourse: { "just-enough-python": ["version-control-and-git"] },
        libraryCourseIds: ["version-control-and-git", "just-enough-python"],
        outlineCourseIds: [],
      },
      "just-enough-python",
      "en",
      fallbackPrev,
      fallbackNext,
    );

    expect(result.prerequisiteLinks).toEqual([{ title: "Git", slug: "learn/courses/version-control-and-git" }]);
  });

  it("attaches the active pathId only to a prerequisite link that is ITSELF a member of the active manifest — a prerequisite the manifest omits gets a plain canonical link, never a misleading ?path= (EWT-002 fix)", () => {
    const searchParams = new URLSearchParams({ path: manifest.pathId });
    const contentMapWithCapstone = new Map(contentMap).set(
      "en:learn/courses/capstone-forge-ready",
      courseMeta("learn/courses/capstone-forge-ready", "Capstone: Forge Ready"),
    );

    const result = resolveCoursePathRenderData(
      searchParams,
      {
        contentMap: contentMapWithCapstone,
        manifests: [manifest],
        // "data-structures-and-algorithms-essentials" declares two prerequisites: one IS a member
        // of `manifest.courseOrder` ("version-control-and-git"), one is NOT ("capstone-forge-ready"
        // — OI-4's link-don't-walk case).
        prerequisitesByCourse: {
          "data-structures-and-algorithms-essentials": ["version-control-and-git", "capstone-forge-ready"],
        },
        libraryCourseIds: ["version-control-and-git", "capstone-forge-ready"],
        outlineCourseIds: [],
      },
      "data-structures-and-algorithms-essentials",
      "en",
      fallbackPrev,
      fallbackNext,
    );

    expect(result.prerequisiteLinks).toEqual([
      { title: "Git", slug: "learn/courses/version-control-and-git", pathId: manifest.pathId },
      { title: "Capstone: Forge Ready", slug: "learn/courses/capstone-forge-ready", pathId: undefined },
    ]);
  });

  it("derives path badges only when there is no active context (canonical branch only)", () => {
    const withoutContext = resolveCoursePathRenderData(
      new URLSearchParams(),
      { contentMap, manifests: [manifest], prerequisitesByCourse: {}, libraryCourseIds: [], outlineCourseIds: [] },
      "just-enough-python",
      "en",
      fallbackPrev,
      fallbackNext,
    );
    expect(withoutContext.pathBadges).toEqual([{ pathId: manifest.pathId, title: manifest.title }]);

    const withContext = resolveCoursePathRenderData(
      new URLSearchParams({ path: manifest.pathId }),
      { contentMap, manifests: [manifest], prerequisitesByCourse: {}, libraryCourseIds: [], outlineCourseIds: [] },
      "just-enough-python",
      "en",
      fallbackPrev,
      fallbackNext,
    );
    expect(withContext.pathBadges).toEqual([]);
  });

  it("at a path boundary (no prev/next neighbour), resolves null rather than falling back", () => {
    const searchParams = new URLSearchParams({ path: manifest.pathId });

    const result = resolveCoursePathRenderData(
      searchParams,
      { contentMap, manifests: [manifest], prerequisitesByCourse: {}, libraryCourseIds: [], outlineCourseIds: [] },
      "version-control-and-git",
      "en",
      fallbackPrev,
      fallbackNext,
    );

    expect(result.prev).toBeNull();
  });
});

describe("buildCourseTitleIndex", () => {
  const manifest: PathManifest = manifestFixture({
    pathId: "skills/python-fundamentals",
    arc: "python-fundamentals",
    title: "Python Fundamentals",
    description: "Learn Python from the ground up.",
    courses: ["version-control-and-git", "just-enough-python"],
  });
  const contentMap = new Map<string, ContentMeta>([
    ["en:learn/courses/version-control-and-git", courseMeta("learn/courses/version-control-and-git", "Git")],
    ["en:learn/courses/just-enough-python", courseMeta("learn/courses/just-enough-python", "Just Enough Python")],
    // Not in any manifest's courseOrder — must not appear in the returned index.
    [
      "en:learn/courses/capstone-forge-ready",
      courseMeta("learn/courses/capstone-forge-ready", "Capstone: Forge Ready"),
    ],
  ]);

  it("maps every course ID appearing in any manifest's courseOrder to its title", () => {
    const index = buildCourseTitleIndex(contentMap, "en", [manifest]);

    expect(index).toEqual({
      "version-control-and-git": "Git",
      "just-enough-python": "Just Enough Python",
    });
  });

  it("falls back to a humanized slug — never omits, never the raw slug — for a course ID with no resolvable content page (DWT-004 fix, phase-5 rule-15 design-tester retest)", () => {
    const extended = manifestFixture({
      pathId: "skills/python-fundamentals",
      arc: "python-fundamentals",
      title: "Python Fundamentals",
      description: "Learn Python from the ground up.",
      courses: ["version-control-and-git", "does-not-exist"],
    });
    const index = buildCourseTitleIndex(contentMap, "en", [extended]);

    expect(index).toEqual({ "version-control-and-git": "Git", "does-not-exist": "Does Not Exist" });
  });
});

describe("courseTitlesFromClientData", () => {
  it("preserves humanized titles for manifest-only course IDs after hydration", () => {
    const extended = manifestFixture({
      pathId: "careers/interview-ready/software-engineer",
      arc: "interview-ready",
      title: "Interview-Ready Software Engineer",
      description: "Interview-first track for an experienced engineer re-entering the market.",
      courses: ["just-enough-python", "does-not-exist"],
    });
    const titles = courseTitlesFromClientData({
      manifests: [extended],
      prerequisitesByCourse: {},
      libraryCourseIds: ["just-enough-python"],
      outlineCourseIds: [],
      courseLinks: {
        "just-enough-python": { title: "Just Enough Python", slug: "learn/courses/just-enough-python" },
      },
    });

    expect(titles).toEqual({
      "just-enough-python": "Just Enough Python",
      "does-not-exist": "Does Not Exist",
    });
  });
});

describe("toCoursePathClientData — outlineCourseIds (AC-4.1 RED)", () => {
  it("passes outlineCourseIds through from route data", () => {
    const data = toCoursePathClientData(
      {
        contentMap: new Map(),
        manifests: [],
        prerequisitesByCourse: {},
        libraryCourseIds: [],
        outlineCourseIds: ["capstone-secure-service"],
      },
      "en",
    );

    expect(data.outlineCourseIds).toEqual(["capstone-secure-service"]);
  });

  it("EMPTY_COURSE_PATH_CLIENT_DATA carries no outline courses", () => {
    expect(EMPTY_COURSE_PATH_CLIENT_DATA.outlineCourseIds).toEqual([]);
  });
});

describe("humanizeKebabSlug (UWT-001 fix)", () => {
  it("title-cases each hyphen-separated word and joins with a space", () => {
    expect(humanizeKebabSlug("generalist-track")).toBe("Generalist Track");
    expect(humanizeKebabSlug("immediately-effective")).toBe("Immediately Effective");
  });

  it("handles a single-word slug", () => {
    expect(humanizeKebabSlug("careers")).toBe("Careers");
  });
});

describe("buildArcTitleIndex (UWT-001 fix)", () => {
  function arcMeta(slug: string, title: string): ContentMeta {
    return courseMeta(slug, title);
  }

  it("resolves an arc's title from its own _index.md content entry", () => {
    const contentMap = new Map<string, ContentMeta>([
      ["en:learn/paths/careers/interview-ready", arcMeta("learn/paths/careers/interview-ready", "Interview-Ready")],
    ]);

    const index = buildArcTitleIndex(contentMap, "en", ["interview-ready"]);

    expect(index).toEqual({ "interview-ready": "Interview-Ready" });
  });

  it("falls back to a humanized slug when the arc has no _index.md content entry", () => {
    const index = buildArcTitleIndex(new Map(), "en", ["generalist-track"]);

    expect(index).toEqual({ "generalist-track": "Generalist Track" });
  });
});

describe("slugFromPathname", () => {
  it("strips the /{locale}/ prefix from a pathname", () => {
    expect(slugFromPathname("/en/learn/courses/just-enough-python", "en")).toBe("learn/courses/just-enough-python");
  });

  it("returns '' for the bare locale root", () => {
    expect(slugFromPathname("/en", "en")).toBe("");
  });

  it("returns null when the pathname does not start with the given locale", () => {
    expect(slugFromPathname("/id/learn/courses/just-enough-python", "en")).toBeNull();
  });
});

describe("resolveActiveCourseFromLocation", () => {
  const manifest: PathManifest = manifestFixture({
    pathId: "skills/python-fundamentals",
    arc: "python-fundamentals",
    title: "Python Fundamentals",
    description: "Learn Python from the ground up.",
    courses: ["version-control-and-git", "just-enough-python"],
  });

  it("resolves the course ID and active context from a course pathname + valid ?path=", () => {
    const result = resolveActiveCourseFromLocation(
      "/en/learn/courses/just-enough-python",
      new URLSearchParams({ path: manifest.pathId }),
      "en",
      [manifest],
    );

    expect(result?.courseId).toBe("just-enough-python");
    expect(result?.context.pathId).toBe(manifest.pathId);
  });

  it("returns null for a non-course pathname (e.g. /browse)", () => {
    const result = resolveActiveCourseFromLocation("/en/browse", new URLSearchParams({ path: manifest.pathId }), "en", [
      manifest,
    ]);

    expect(result).toBeNull();
  });

  it("returns null for a course pathname with no ?path=", () => {
    const result = resolveActiveCourseFromLocation(
      "/en/learn/courses/just-enough-python",
      new URLSearchParams(),
      "en",
      [manifest],
    );

    expect(result).toBeNull();
  });

  it("returns null for a pathname under a different locale", () => {
    const result = resolveActiveCourseFromLocation(
      "/id/belajar/courses/just-enough-python",
      new URLSearchParams({ path: manifest.pathId }),
      "en",
      [manifest],
    );

    expect(result).toBeNull();
  });
});

describe("coursePositionInManifest", () => {
  const manifest: PathManifest = manifestFixture({
    pathId: "skills/python-fundamentals",
    arc: "python-fundamentals",
    title: "Python Fundamentals",
    description: "Learn Python from the ground up.",
    courses: ["version-control-and-git", "just-enough-python", "data-structures-and-algorithms-essentials"],
  });

  it("returns the 1-based position and the total course count (PathBanner's 'course k of N')", () => {
    expect(coursePositionInManifest(manifest, "just-enough-python")).toEqual({ index: 2, total: 3 });
  });

  it("returns index 1 for the first course", () => {
    expect(coursePositionInManifest(manifest, "version-control-and-git")).toEqual({ index: 1, total: 3 });
  });
});

describe("courseRootIdFromSlug / COURSE_CATALOG_SLUG (plan 03)", () => {
  it("returns the id only for an exact course root", async () => {
    const { courseRootIdFromSlug: rootId, COURSE_CATALOG_SLUG: catalogSlug } =
      await import("../../../../../src/features/course-paths/shell/course-path-nav");
    expect(catalogSlug).toBe("learn/courses");
    expect(rootId("learn/courses/sql-essentials")).toBe("sql-essentials");
    expect(rootId("learn/courses/sql-essentials/learning/beginner")).toBeNull();
    expect(rootId("learn/courses")).toBeNull();
    expect(rootId("learn/paths/careers/x")).toBeNull();
  });
});
