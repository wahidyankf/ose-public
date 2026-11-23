import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { buildTrees } from "@/features/content/core/tree-builder";
import type { ContentMeta } from "@/features/content/core/types";
import { FileSystemContentRepository } from "@/features/content/shell/repository-fs";

const getTreeMock = vi.hoisted(() => vi.fn());
const loadRoutePathDataMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/trpc/server", () => ({ serverCaller: { content: { getTree: getTreeMock } } }));
vi.mock("@/features/course-paths/shell/route-path-data", () => ({ loadRoutePathData: loadRoutePathDataMock }));

// eslint-disable-next-line import/first
import { loadLessonPagePaths } from "@/features/learning-progress/shell/lesson-sequences";

/**
 * The real English library, read once off disk and handed to the real loader through the two
 * boundaries the loader reads from. `src/lib/trpc/server.ts` is a `server-only` module, so the
 * corpus comes in through the same mocks the loader's own unit test uses — the function under
 * test, the content, and the walk are all the shipped ones.
 */
const content: ContentMeta[] = await new FileSystemContentRepository(
  path.join(process.cwd(), "content"),
).readAllContent();
const contentMap = new Map(content.map((meta) => [`${meta.locale}:${meta.slug}`, meta] as const));

getTreeMock.mockResolvedValue(buildTrees(content)["en"] ?? []);
loadRoutePathDataMock.mockResolvedValue({
  contentMap,
  manifests: [],
  prerequisitesByCourse: {},
  libraryCourseIds: [],
  outlineCourseIds: [],
});

/**
 * The Learn home, the path cards, and the roadmap pass every course's lesson page paths from the
 * server to the browser. tech-docs/001 "Where Progress Is Read" measures that payload and
 * tech-docs/006 bounds it at 64 KiB, so a growing library cannot silently push it past what the
 * page should ship (the whole-library index costs about 1,500 short strings today).
 */
describe("lesson page-path payload (corpus)", () => {
  it("stays under 64 KiB for the real English library, and prints its size", async () => {
    const pagePaths = await loadLessonPagePaths("en");
    const bytes = Buffer.byteLength(JSON.stringify(pagePaths), "utf8");

    console.log(`lesson page-path payload: ${bytes} bytes (under 65536), courses=${Object.keys(pagePaths).length}`);

    expect(Object.keys(pagePaths).length).toBeGreaterThan(0);
    expect(bytes).toBeLessThan(65536);
  });
});
