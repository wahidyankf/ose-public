import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import ContentPage from "@/app/[locale]/(content)/[...slug]/page";

const getBySlug = vi.hoisted(() => ({
  current: async (_input: unknown) => ({
    title: "Hello",
    html: "<p>Hello.</p>",
    headings: [],
    description: "First program",
    prev: null,
    next: null,
  }),
}));

vi.mock("@/lib/trpc/server", () => ({
  serverCaller: {
    content: {
      getBySlug: (...args: unknown[]) => getBySlug.current(args[0]),
    },
  },
}));

const routeData = vi.hoisted(() => ({
  current: {
    manifests: [] as unknown[],
    contentMap: new Map() as Map<string, unknown>,
    prerequisitesByCourse: {},
    libraryCourseIds: [],
    outlineCourseIds: [],
  },
}));

vi.mock("@/features/course-paths/shell/route-path-data", () => ({
  loadRoutePathData: async () => routeData.current,
}));

const lessonSequences = vi.hoisted(() => ({
  current: [] as Array<{ pagePath: string; slug: string; title: string }>,
}));

vi.mock("@/features/learning-progress/shell/lesson-sequences", () => ({
  loadLessonSequence: async () => lessonSequences.current,
  loadLessonPagePaths: async () => ({}),
}));

// The server context construction reads server env at import time, which has
// no meaning in jsdom; these render tests never call it (all data is mocked).
vi.mock("@/features/app-shell/shell/trpc-init", () => ({
  createTRPCContext: () => {
    throw new Error("not used in render tests");
  },
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  usePathname: () => "/en/learn/x",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/course-paths/shell/course-page-content", () => ({
  CoursePageContent: ({ title, html }: { title: string; html: string }) => (
    <article data-mock="CoursePageContent">
      <h1>{title}</h1>
      <div>{html}</div>
    </article>
  ),
}));

vi.mock("@/features/course-paths/shell/course-catalog", () => ({
  CourseCatalog: ({ title }: { title: string }) => <div data-mock="CourseCatalog">{title}</div>,
}));

vi.mock("@/features/learning-progress/shell/learn-home", () => ({
  LearnHome: ({ title }: { title: string }) => <div data-mock="LearnHome">{title}</div>,
}));

vi.mock("@/features/course-paths/shell/empty-path-list-state", () => ({
  EmptyPathListState: ({ fallbackLabel }: { fallbackLabel: string }) => (
    <div data-mock="EmptyPathListState">{fallbackLabel}</div>
  ),
}));

vi.mock("@/features/course-paths/shell/category-landing", () => ({
  CategoryLanding: ({ category }: { category: string }) => <div data-mock="CategoryLanding">{category}</div>,
}));

vi.mock("@/features/course-paths/shell/arc-landing", () => ({
  ArcLanding: ({ arc }: { arc: string }) => <div data-mock="ArcLanding">{arc}</div>,
}));

vi.mock("@/features/course-paths/shell/path-landing", () => ({
  PathLanding: ({ manifest }: { manifest: { title: string } }) => <div data-mock="PathLanding">{manifest.title}</div>,
}));

vi.mock("@/features/course-paths/shell/course-page-path-content", () => ({
  CoursePagePathContent: ({ title }: { title: string }) => <div data-mock="CoursePagePathContent">{title}</div>,
}));

vi.mock("@/features/course-paths/shell/path-card", () => ({
  CategorySection: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  ArcGroup: ({ arc, children }: { arc: string; children: React.ReactNode }) => (
    <div data-mock="ArcGroup">
      {arc}
      {children}
    </div>
  ),
}));

vi.mock("@/features/course-paths/shell/learn-path-card", () => ({
  LearnPathCard: ({ manifest }: { manifest: { title: string } }) => (
    <div data-mock="LearnPathCard">{manifest.title}</div>
  ),
  buildPathCardCourseData: () => ({}),
}));

const MANIFESTS = [
  {
    pathId: "careers/immediately-effective/backend-track",
    arc: "immediately-effective",
    title: "Backend Track",
    description: "Serve HTTP.",
    assumes: ["foundations"],
    courseOrder: [],
  },
  {
    pathId: "skills/just-enough-tools",
    arc: "just-enough-tools",
    title: "Just Enough Tools",
    description: "Everyday tools.",
    assumes: ["foundations"],
    courseOrder: ["foundations"],
  },
];

describe("catch-all content page", () => {
  it("renders a standard content page", async () => {
    getBySlug.current = async () => ({
      title: "Hello",
      html: "<p>Hello.</p>",
      headings: [],
      description: "First program",
      prev: null,
      next: null,
    });
    render(await ContentPage({ params: Promise.resolve({ locale: "en", slug: ["learn", "x"] }) }));
    expect(screen.getByText("Hello")).not.toBeNull();
  });

  it("renders the Learn home for the bare learn slug", async () => {
    getBySlug.current = async () => ({
      title: "Learn",
      html: "",
      headings: [],
      description: "Learn",
      prev: null,
      next: null,
    });
    const saved = routeData.current;
    routeData.current = {
      ...saved,
      manifests: MANIFESTS,
      contentMap: new Map([
        [
          "en:learn/courses/go-basics",
          {
            title: "Go Basics",
            slug: "learn/courses/go-basics",
            locale: "en",
            weight: 0,
            description: "Learn Go",
            tags: [],
            draft: false,
            isSection: false,
            filePath: "/virtual/en/learn/courses/go-basics/_index.md",
          },
        ],
      ]),
    };
    try {
      render(await ContentPage({ params: Promise.resolve({ locale: "en", slug: ["learn"] }) }));
      expect(screen.getByText("Learn")).not.toBeNull();
    } finally {
      routeData.current = saved;
    }
  });

  it("renders the paths hub for the paths root", async () => {
    getBySlug.current = async () => {
      throw new TRPCError({ code: "NOT_FOUND", message: "missing" });
    };
    render(await ContentPage({ params: Promise.resolve({ locale: "en", slug: ["learn", "paths"] }) }));
    expect(screen.getByText("Paths")).not.toBeNull();
  });

  it("not-found for a genuinely missing page", async () => {
    getBySlug.current = async () => {
      throw new TRPCError({ code: "NOT_FOUND", message: "missing" });
    };
    await expect(
      ContentPage({ params: Promise.resolve({ locale: "en", slug: ["learn", "missing"] }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("falls through to not-found when the Learn section has no index page", async () => {
    getBySlug.current = async () => {
      throw new TRPCError({ code: "NOT_FOUND", message: "missing" });
    };
    await expect(ContentPage({ params: Promise.resolve({ locale: "en", slug: ["learn"] }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("rethrows unexpected content errors", async () => {
    getBySlug.current = async () => {
      throw new Error("boom");
    };
    await expect(ContentPage({ params: Promise.resolve({ locale: "en", slug: ["learn", "x"] }) })).rejects.toThrow(
      "boom",
    );
  });

  it("rethrows unexpected errors from the paths loader", async () => {
    getBySlug.current = async () => {
      throw new Error("paths boom");
    };
    const saved = routeData.current;
    routeData.current = { ...saved, manifests: MANIFESTS };
    try {
      await expect(
        ContentPage({ params: Promise.resolve({ locale: "en", slug: ["learn", "paths", "careers"] }) }),
      ).rejects.toThrow("paths boom");
    } finally {
      routeData.current = saved;
    }
  });

  it("falls through a paths slug that names nothing published", async () => {
    getBySlug.current = async () => {
      throw new TRPCError({ code: "NOT_FOUND", message: "missing" });
    };
    await expect(
      ContentPage({ params: Promise.resolve({ locale: "en", slug: ["learn", "paths", "bogus"] }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("rethrows unexpected errors from the Learn home loader", async () => {
    getBySlug.current = async () => {
      throw new Error("learn boom");
    };
    await expect(ContentPage({ params: Promise.resolve({ locale: "en", slug: ["learn"] }) })).rejects.toThrow(
      "learn boom",
    );
  });

  it("skips empty segments when building breadcrumbs", async () => {
    getBySlug.current = async () => ({
      title: "X",
      html: "<p>X.</p>",
      headings: [],
      description: "X",
      prev: null,
      next: null,
    });
    render(await ContentPage({ params: Promise.resolve({ locale: "en", slug: ["learn", "", "x"] }) }));
    expect(screen.getByText("X")).not.toBeNull();
  });

  it("renders the course catalog section", async () => {
    getBySlug.current = async () => ({
      title: "Courses",
      html: "",
      headings: [],
      description: "All courses",
      prev: null,
      next: null,
    });
    render(await ContentPage({ params: Promise.resolve({ locale: "en", slug: ["learn", "courses"] }) }));
    expect(screen.getByText("Courses")).not.toBeNull();
  });

  it("renders a course lesson with its lesson chrome", async () => {
    getBySlug.current = async () => ({
      title: "Setup",
      html: "<p>Setup.</p>",
      headings: [],
      description: "Prepare",
      prev: null,
      next: null,
    });
    render(await ContentPage({ params: Promise.resolve({ locale: "en", slug: ["learn", "courses", "go-basics"] }) }));
    expect(screen.getByText("Setup")).not.toBeNull();
  });

  it("renders the course header when the course page exists", async () => {
    getBySlug.current = async () => ({
      title: "Go Basics",
      html: "<p>Go.</p>",
      headings: [],
      description: "Learn Go",
      prev: null,
      next: null,
    });
    const saved = routeData.current;
    const savedSequences = lessonSequences.current;
    routeData.current = {
      ...saved,
      contentMap: new Map([
        [
          "en:learn/courses/go-basics",
          {
            title: "Go Basics",
            slug: "learn/courses/go-basics",
            locale: "en",
            weight: 0,
            description: "Learn Go",
            tags: [],
            draft: false,
            isSection: false,
            filePath: "/virtual/en/learn/courses/go-basics/_index.md",
          },
        ],
      ]),
    };
    lessonSequences.current = [{ pagePath: "setup", slug: "learn/courses/go-basics/setup", title: "Setup" }];
    try {
      const { container } = render(
        await ContentPage({
          params: Promise.resolve({ locale: "en", slug: ["learn", "courses", "go-basics"] }),
        }),
      );
      expect(container.querySelector('[data-mock="CoursePagePathContent"]')).not.toBeNull();
    } finally {
      routeData.current = saved;
      lessonSequences.current = savedSequences;
    }
  });

  it("renders a course lesson page that is not in the lesson sequence", async () => {
    getBySlug.current = async () => ({
      title: "Setup",
      html: "<p>Setup.</p>",
      headings: [],
      description: "Prepare",
      prev: null,
      next: null,
    });
    lessonSequences.current = [{ pagePath: "other", slug: "learn/courses/go-basics/other", title: "Other" }];
    try {
      const { container } = render(
        await ContentPage({
          params: Promise.resolve({ locale: "en", slug: ["learn", "courses", "go-basics", "setup"] }),
        }),
      );
      expect(container.querySelector('[data-mock="CoursePagePathContent"]')).not.toBeNull();
    } finally {
      lessonSequences.current = [];
    }
  });

  it("attaches lesson props on a course lesson page", async () => {
    getBySlug.current = async () => ({
      title: "Setup",
      html: "<p>Setup.</p>",
      headings: [],
      description: "Prepare",
      prev: null,
      next: null,
    });
    lessonSequences.current = [{ pagePath: "setup", slug: "learn/courses/go-basics/setup", title: "Setup" }];
    try {
      const { container } = render(
        await ContentPage({
          params: Promise.resolve({ locale: "en", slug: ["learn", "courses", "go-basics", "setup"] }),
        }),
      );
      expect(container.querySelector('[data-mock="CoursePagePathContent"]')).not.toBeNull();
    } finally {
      lessonSequences.current = [];
    }
  });
});

describe("catch-all paths namespace", () => {
  it("renders a category landing", async () => {
    getBySlug.current = async () => {
      throw new TRPCError({ code: "NOT_FOUND", message: "missing" });
    };
    routeData.current = { ...routeData.current, manifests: MANIFESTS };
    render(await ContentPage({ params: Promise.resolve({ locale: "en", slug: ["learn", "paths", "careers"] }) }));
    expect(screen.getByText("careers")).not.toBeNull();
  });

  it("renders an arc landing", async () => {
    getBySlug.current = async () => {
      throw new TRPCError({ code: "NOT_FOUND", message: "missing" });
    };
    routeData.current = { ...routeData.current, manifests: MANIFESTS };
    const { container } = render(
      await ContentPage({
        params: Promise.resolve({ locale: "en", slug: ["learn", "paths", "careers", "immediately-effective"] }),
      }),
    );
    expect(container.querySelector('[data-mock="ArcLanding"]')).not.toBeNull();
  });

  it("renders a terminal path landing", async () => {
    getBySlug.current = async () => {
      throw new TRPCError({ code: "NOT_FOUND", message: "missing" });
    };
    routeData.current = { ...routeData.current, manifests: MANIFESTS };
    render(
      await ContentPage({
        params: Promise.resolve({
          locale: "en",
          slug: ["learn", "paths", "skills", "just-enough-tools"],
        }),
      }),
    );
    expect(screen.getByText("Just Enough Tools")).not.toBeNull();
  });

  it("renders the hub with its arc and skill groups when manifests exist", async () => {
    getBySlug.current = async () => {
      throw new TRPCError({ code: "NOT_FOUND", message: "missing" });
    };
    routeData.current = { ...routeData.current, manifests: MANIFESTS };
    const { container } = render(
      await ContentPage({ params: Promise.resolve({ locale: "en", slug: ["learn", "paths"] }) }),
    );
    expect(container.querySelectorAll('[data-mock="ArcGroup"]').length).toBe(1);
    expect(container.querySelectorAll('[data-mock="LearnPathCard"]').length).toBe(2);
  });

  it("rejects an arc segment that names no real arc", async () => {
    getBySlug.current = async () => {
      throw new TRPCError({ code: "NOT_FOUND", message: "missing" });
    };
    routeData.current = { ...routeData.current, manifests: MANIFESTS };
    await expect(
      ContentPage({
        params: Promise.resolve({ locale: "en", slug: ["learn", "paths", "careers", "bogus-arc"] }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
