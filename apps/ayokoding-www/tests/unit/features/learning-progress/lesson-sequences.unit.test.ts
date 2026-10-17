import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContentMeta, TreeNode } from "@/features/content/core/types";

const getTreeMock = vi.hoisted(() => vi.fn());
const loadRoutePathDataMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/trpc/server", () => ({
  serverCaller: { content: { getTree: getTreeMock } },
}));

vi.mock("@/features/course-paths/shell/route-path-data", () => ({
  loadRoutePathData: loadRoutePathDataMock,
}));

// eslint-disable-next-line import/first
import { loadLessonPagePaths, loadLessonSequence } from "@/features/learning-progress/shell/lesson-sequences";

interface FakePage {
  pagePath: string;
  title: string;
  weight: number;
}

/** `just-enough-bash`-shaped course: a course-root overview before the Start page, then learning. */
const BASH_PAGES: FakePage[] = [
  { pagePath: "overview", title: "Overview", weight: 1 },
  { pagePath: "learning/overview", title: "Overview", weight: 105 },
  { pagePath: "learning/beginner", title: "Beginner Examples", weight: 110 },
  { pagePath: "learning/advanced", title: "Advanced Examples", weight: 130 },
];

const SQL_PAGES: FakePage[] = [
  { pagePath: "learning/overview", title: "Overview", weight: 105 },
  { pagePath: "learning/beginner", title: "Beginner Examples", weight: 110 },
];

/** Build one course subtree: intermediate page-path segments become section nodes, as on disk. */
function courseNode(courseId: string, title: string, pages: FakePage[]): TreeNode {
  const root: TreeNode = { title, slug: `learn/courses/${courseId}`, weight: 0, isSection: true, children: [] };

  for (const page of pages) {
    const segments = page.pagePath.split("/");
    let parent = root;
    for (const segment of segments.slice(0, -1)) {
      const slug = `${parent.slug}/${segment}`;
      const existing = parent.children.find((child) => child.slug === slug);
      const section = existing ?? { title: segment, slug, weight: 100, isSection: true, children: [] };
      if (existing === undefined) {
        parent.children.push(section);
      }
      parent = section;
    }
    parent.children.push({
      title: page.title,
      slug: `${parent.slug}/${segments[segments.length - 1]}`,
      weight: page.weight,
      isSection: false,
      children: [],
    });
  }

  return root;
}

function treeWith(courses: TreeNode[]): TreeNode[] {
  return [
    {
      title: "",
      slug: "",
      weight: 0,
      isSection: true,
      children: [
        {
          title: "Learn",
          slug: "learn",
          weight: 10,
          isSection: true,
          children: [{ title: "Courses", slug: "learn/courses", weight: 20, isSection: true, children: courses }],
        },
      ],
    },
  ];
}

const TREE = treeWith([
  courseNode("just-enough-bash", "Just Enough Bash", BASH_PAGES),
  courseNode("sql-essentials", "SQL Essentials", SQL_PAGES),
]);

/** A tree with no `learn/courses` section at all — the `id` locale's real shape. */
const TRANSLATED_TREE = [
  {
    title: "",
    slug: "",
    weight: 0,
    isSection: true,
    children: [{ title: "Belajar", slug: "belajar", weight: 10, isSection: true, children: [] }],
  },
];

/** Every tree node is a real page in its locale's content map, exactly as the real index is. */
function contentMapFor(locale: string, tree: TreeNode[]): Map<string, ContentMeta> {
  const map = new Map<string, ContentMeta>();

  const walk = (nodes: TreeNode[]): void => {
    for (const node of nodes) {
      map.set(`${locale}:${node.slug}`, {
        title: node.title,
        slug: node.slug,
        locale,
        weight: node.weight,
        tags: [],
        draft: false,
        isSection: node.isSection,
        filePath: `/content/${locale}/${node.slug}.md`,
      });
      walk(node.children);
    }
  };

  walk(tree);
  return map;
}

beforeEach(() => {
  getTreeMock.mockReset();
  loadRoutePathDataMock.mockReset();
  loadRoutePathDataMock.mockImplementation(async (locale: string) => ({
    contentMap: contentMapFor(locale, TREE),
    manifests: [],
    prerequisitesByCourse: {},
    libraryCourseIds: [],
    outlineCourseIds: [],
  }));
  getTreeMock.mockResolvedValue(TREE);
});

describe("loadLessonSequence", () => {
  it("returns a course's ordered pages, starting at its Start page and dropping what comes before it", async () => {
    const sequence = await loadLessonSequence("en", "just-enough-bash");

    expect(sequence.map((page) => page.pagePath)).toEqual([
      "learning/overview",
      "learning/beginner",
      "learning/advanced",
    ]);
    expect(sequence.map((page) => page.title)).toEqual(["Overview", "Beginner Examples", "Advanced Examples"]);
    expect(sequence[0]?.slug).toBe("learn/courses/just-enough-bash/learning/overview");
    expect(sequence.every((page) => page.slug.startsWith("learn/courses/just-enough-bash/"))).toBe(true);
  });

  it("returns an empty sequence for a course the tree does not hold", async () => {
    expect(await loadLessonSequence("en", "not-a-course")).toEqual([]);
  });

  it("returns no sequence for a locale with no courses section", async () => {
    getTreeMock.mockResolvedValue(TRANSLATED_TREE);

    expect(await loadLessonSequence("id-locale", "just-enough-bash")).toEqual([]);
  });

  it("reads the content tree once per locale", async () => {
    await loadLessonSequence("memo-locale", "just-enough-bash");
    await loadLessonSequence("memo-locale", "sql-essentials");

    expect(getTreeMock).toHaveBeenCalledTimes(1);
    expect(getTreeMock).toHaveBeenCalledWith({ locale: "memo-locale" });
    expect(loadRoutePathDataMock).toHaveBeenCalledTimes(1);

    getTreeMock.mockResolvedValue(TRANSLATED_TREE);
    await loadLessonSequence("memo-other-locale", "just-enough-bash");

    expect(getTreeMock).toHaveBeenCalledTimes(2);
  });
});

describe("loadLessonPagePaths", () => {
  it("returns page paths only, for every course of the locale", async () => {
    const pagePaths = await loadLessonPagePaths("paths-locale");

    expect(pagePaths).toEqual({
      "just-enough-bash": ["learning/overview", "learning/beginner", "learning/advanced"],
      "sql-essentials": ["learning/overview", "learning/beginner"],
    });
    expect(Object.keys(pagePaths).sort()).toEqual(["just-enough-bash", "sql-essentials"]);
  });

  it("returns no page paths for a locale with no courses section", async () => {
    getTreeMock.mockResolvedValue(TRANSLATED_TREE);

    expect(await loadLessonPagePaths("paths-translated-locale")).toEqual({});
  });
});
