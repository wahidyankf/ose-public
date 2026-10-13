import type { ContentMeta } from "@/features/content/core/types";
import { ContentService } from "@/features/content/shell/service";
import { InMemoryContentRepository } from "@/features/content/shell/repository-memory";

const mockContentMeta: ContentMeta[] = [
  {
    title: "Programming",
    slug: "programming",
    locale: "en",
    weight: 10,
    draft: false,
    isSection: true,
    tags: [],
    filePath: "/mock/en/programming/_index.md",
  },
  {
    title: "Artificial Intelligence",
    slug: "ai",
    locale: "en",
    weight: 20,
    draft: false,
    isSection: true,
    tags: [],
    filePath: "/mock/en/ai/_index.md",
  },
  {
    title: "Security",
    slug: "security",
    locale: "en",
    weight: 30,
    draft: false,
    isSection: true,
    tags: [],
    filePath: "/mock/en/security/_index.md",
  },
  {
    title: "Go",
    slug: "programming/golang",
    locale: "en",
    weight: 10,
    draft: false,
    isSection: true,
    tags: [],
    filePath: "/mock/en/programming/golang/_index.md",
  },
  {
    title: "Getting Started with Go",
    slug: "programming/golang/getting-started",
    locale: "en",
    weight: 10,
    draft: false,
    isSection: false,
    tags: ["golang", "programming"],
    filePath: "/mock/en/programming/golang/getting-started.md",
  },
  {
    title: "Go Variables",
    slug: "programming/golang/variables",
    locale: "en",
    weight: 20,
    draft: false,
    isSection: false,
    tags: ["golang", "programming"],
    filePath: "/mock/en/programming/golang/variables.md",
  },
  {
    title: "Advanced Go",
    slug: "programming/golang/advanced",
    locale: "en",
    weight: 30,
    draft: false,
    isSection: false,
    tags: ["golang", "programming"],
    filePath: "/mock/en/programming/golang/advanced.md",
  },
  {
    title: "Spring Security Basics",
    slug: "security/basics",
    locale: "en",
    weight: 10,
    draft: false,
    isSection: false,
    tags: ["security"],
    filePath: "/mock/en/security/basics.md",
  },
  {
    title: "Memulai dengan Go",
    slug: "programming/golang/memulai",
    locale: "id",
    weight: 10,
    draft: false,
    isSection: false,
    tags: ["golang", "pemrograman"],
    filePath: "/mock/id/programming/golang/memulai.md",
  },
  {
    title: "Learn",
    slug: "learn",
    locale: "en",
    weight: 10,
    draft: false,
    isSection: true,
    tags: [],
    filePath: "/mock/en/learn/_index.md",
  },
  {
    title: "About AyoKoding",
    slug: "about-ayokoding",
    locale: "en",
    weight: 5,
    draft: false,
    isSection: false,
    tags: [],
    filePath: "/mock/en/about-ayokoding.md",
  },
  {
    title: "Rants",
    slug: "rants",
    locale: "en",
    weight: 40,
    draft: false,
    isSection: true,
    tags: [],
    filePath: "/mock/en/rants/_index.md",
  },
  {
    title: "Courses",
    slug: "learn/courses",
    locale: "en",
    weight: 95,
    draft: false,
    isSection: true,
    tags: [],
    filePath: "/mock/en/learn/courses/_index.md",
  },
  {
    title: "SQL Essentials",
    slug: "learn/courses/sql-essentials",
    locale: "en",
    weight: 200,
    draft: false,
    isSection: true,
    tags: [],
    category: "data-and-databases",
    filePath: "/mock/en/learn/courses/sql-essentials/_index.md",
  },
  {
    title: "Just Enough Go",
    slug: "learn/courses/just-enough-go",
    locale: "en",
    weight: 260,
    draft: false,
    isSection: true,
    tags: ["go", "golang"],
    filePath: "/mock/en/learn/courses/just-enough-go/_index.md",
  },
  {
    title: "Learning",
    slug: "learn/courses/just-enough-go/learning",
    locale: "en",
    weight: 105,
    draft: false,
    isSection: true,
    tags: ["go", "golang"],
    filePath: "/mock/en/learn/courses/just-enough-go/learning/_index.md",
  },
  {
    title: "Overview",
    slug: "learn/courses/just-enough-go/overview",
    locale: "en",
    weight: 1,
    draft: false,
    isSection: false,
    tags: ["go", "golang"],
    filePath: "/mock/en/learn/courses/just-enough-go/overview.md",
  },
  ...[
    ["Overview", "overview", 1],
    ["Beginner Examples", "beginner", 10],
    ["Intermediate Examples", "intermediate", 20],
    ["Advanced Examples", "advanced", 30],
    ["Capstone", "capstone", 100],
  ].map(
    ([title, leaf, weight]) =>
      ({
        title: String(title),
        slug: `learn/courses/just-enough-go/learning/${String(leaf)}`,
        locale: "en",
        weight: Number(weight),
        draft: false,
        isSection: leaf === "capstone",
        tags: ["go", "golang"],
        filePath: `/mock/en/learn/courses/just-enough-go/learning/${String(leaf)}.md`,
      }) as ContentMeta,
  ),
  {
    title: "Overview",
    slug: "learn/overview",
    locale: "en",
    weight: 100000,
    description: "Learning path overview",
    draft: false,
    isSection: false,
    tags: ["learning"],
    filePath: "/mock/en/learn/overview.md",
  },
  {
    title: "Software Engineering",
    slug: "learn/software-engineering",
    locale: "en",
    weight: 200,
    draft: false,
    isSection: true,
    tags: [],
    filePath: "/mock/en/learn/software-engineering/_index.md",
  },
  {
    title: "Programming Languages",
    slug: "learn/software-engineering/programming-languages",
    locale: "en",
    weight: 100,
    draft: false,
    isSection: true,
    tags: [],
    filePath: "/mock/en/learn/software-engineering/programming-languages/_index.md",
  },
  {
    title: "Belajar",
    slug: "belajar",
    locale: "id",
    weight: 10,
    draft: false,
    isSection: true,
    tags: [],
    filePath: "/mock/id/belajar/_index.md",
  },
  {
    title: "Ikhtisar",
    slug: "belajar/ikhtisar",
    locale: "id",
    weight: 100000,
    draft: false,
    isSection: false,
    tags: [],
    filePath: "/mock/id/belajar/ikhtisar.md",
  },
];

const mockFiles = new Map<string, { content: string; frontmatter: Record<string, unknown> }>();

mockFiles.set("/mock/en/programming/_index.md", {
  content: "# Programming\n\nProgramming guides.",
  frontmatter: { title: "Programming", weight: 10 },
});
mockFiles.set("/mock/en/ai/_index.md", {
  content: "# Artificial Intelligence\n\nAI guides.",
  frontmatter: { title: "Artificial Intelligence", weight: 20 },
});
mockFiles.set("/mock/en/security/_index.md", {
  content: "# Security\n\nSecurity guides.",
  frontmatter: { title: "Security", weight: 30 },
});
mockFiles.set("/mock/en/programming/golang/_index.md", {
  content: "# Go\n\nGo programming guides.",
  frontmatter: { title: "Go", weight: 10 },
});
mockFiles.set("/mock/en/programming/golang/getting-started.md", {
  content: "## Install Go\n\nGetting started with golang programming.\n\n## Run the program\n\nUse `go run`.",
  frontmatter: { title: "Getting Started with Go", weight: 10 },
});
mockFiles.set("/mock/en/programming/golang/variables.md", {
  content: '## Variables\n\n```go\nname := "AyoKoding"\n```',
  frontmatter: { title: "Go Variables", weight: 20 },
});
mockFiles.set("/mock/en/programming/golang/advanced.md", {
  content: "## Advanced Go\n\nAdvanced golang programming patterns.",
  frontmatter: { title: "Advanced Go", weight: 30 },
});
mockFiles.set("/mock/en/security/basics.md", {
  content: "## Spring Security Basics\n\nSecurity fundamentals.",
  frontmatter: { title: "Spring Security Basics", weight: 10 },
});
mockFiles.set("/mock/id/programming/golang/memulai.md", {
  content: "## Memulai\n\nPanduan pemrograman Go dalam Bahasa Indonesia.",
  frontmatter: { title: "Memulai dengan Go", weight: 10 },
});

export const draftFixture = {
  title: "E2E Fixture Alpha Skills Path",
  slug: "learn/paths/skills/e2e-fixture-alpha",
  locale: "en",
  draft: true,
} as const;

mockFiles.set("/mock/en/learn/_index.md", {
  content: "# Learn\n\nWelcome to the learning path.",
  frontmatter: { title: "Learn", weight: 10 },
});
mockFiles.set("/mock/en/about-ayokoding.md", {
  content: "## About\n\nAbout AyoKoding.",
  frontmatter: { title: "About AyoKoding", weight: 5 },
});
mockFiles.set("/mock/en/rants/_index.md", {
  content: "# Rants\n\nEssays and opinions.",
  frontmatter: { title: "Rants", weight: 40 },
});
mockFiles.set("/mock/en/learn/courses/_index.md", {
  content: "# Courses\n\nCourse library.",
  frontmatter: { title: "Courses", weight: 95 },
});
mockFiles.set("/mock/en/learn/courses/just-enough-go/_index.md", {
  content: "# Just Enough Go\n\nLearn practical Go and goroutines.",
  frontmatter: { title: "Just Enough Go", weight: 260 },
});
mockFiles.set("/mock/en/learn/courses/just-enough-go/learning/_index.md", {
  content: "# Learning\n\nGo learning sequence.",
  frontmatter: { title: "Learning", weight: 105 },
});
mockFiles.set("/mock/en/learn/courses/just-enough-go/overview.md", {
  content: "## Prerequisites\n\nGo overview.\n\n## Scope boundary\n\nLearn the course scope.",
  frontmatter: { title: "Overview", weight: 1 },
});
for (const [title, leaf, weight] of [
  ["Overview", "overview", 1],
  ["Beginner Examples", "beginner", 10],
  ["Intermediate Examples", "intermediate", 20],
  ["Advanced Examples", "advanced", 30],
  ["Capstone", "capstone", 100],
] as const) {
  mockFiles.set(`/mock/en/learn/courses/just-enough-go/learning/${leaf}.md`, {
    content:
      leaf === "beginner"
        ? "## Beginner Go\n\nGoroutines come later.\n\n```go\npackage main\n\nfunc main() {}\n```"
        : `## ${title}\n\nGo programming and goroutines.`,
    frontmatter: { title, weight },
  });
}

mockFiles.set("/mock/en/learn/overview.md", {
  content:
    '## Getting Started\n\nThis is the overview page about golang programming.\n\n```go\npackage main\n\nfunc main() {\n    fmt.Println("Hello")\n}\n```',
  frontmatter: { title: "Overview", weight: 100000, description: "Learning path overview", tags: ["learning"] },
});

mockFiles.set("/mock/en/learn/software-engineering/_index.md", {
  content: "# Software Engineering\n\nSoftware engineering fundamentals.",
  frontmatter: { title: "Software Engineering", weight: 200 },
});

mockFiles.set("/mock/en/learn/software-engineering/programming-languages/_index.md", {
  content: "# Programming Languages\n\nLearn programming languages.",
  frontmatter: { title: "Programming Languages", weight: 100 },
});

mockFiles.set("/mock/id/belajar/_index.md", {
  content: "# Belajar\n\nSelamat datang di jalur pembelajaran.",
  frontmatter: { title: "Belajar", weight: 10 },
});

mockFiles.set("/mock/id/belajar/ikhtisar.md", {
  content: "## Memulai\n\nIni adalah halaman ikhtisar.",
  frontmatter: { title: "Ikhtisar", weight: 100000 },
});

const repository = new InMemoryContentRepository(mockContentMeta, mockFiles);

export const testContentService = new ContentService(repository);
