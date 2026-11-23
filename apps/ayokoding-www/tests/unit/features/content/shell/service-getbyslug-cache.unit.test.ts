import { describe, expect, it, vi } from "vitest";
import type { ContentRepository } from "../../../../../src/features/content/core/repository";

// React.cache is request/render scoped in an RSC render and deliberately a pass-through in Vitest.
// This deterministic stand-in verifies that ContentService sends the expensive slug lookup through
// that boundary; framework request scoping itself is covered by Next.js, not a Node unit runtime.
vi.mock("react", () => ({
  cache: <Args extends unknown[], Result>(lookup: (...args: Args) => Result) => {
    const results = new Map<string, Result>();
    return (...args: Args): Result => {
      const key = JSON.stringify(args);
      const existing = results.get(key);
      if (existing !== undefined) return existing;
      const created = lookup(...args);
      results.set(key, created);
      return created;
    };
  },
}));

const { ContentService } = await import("../../../../../src/features/content/shell/service");

describe("ContentService.getBySlug — render-scoped cache", () => {
  it("shares one Markdown read and parse for concurrent calls with the same locale and slug", async () => {
    let reads = 0;
    let releaseRead: () => void = () => undefined;
    const readGate = new Promise<void>((resolve) => {
      releaseRead = resolve;
    });
    const repository: ContentRepository = {
      readAllContent: async () => [
        {
          title: "Overview",
          slug: "learn/overview",
          locale: "en",
          weight: 0,
          tags: [],
          draft: false,
          isSection: false,
          filePath: "/content/en/learn/overview.md",
        },
      ],
      readFileContent: async () => {
        reads++;
        await readGate;
        return { content: "# Overview", frontmatter: {} };
      },
    };
    const service = new ContentService(repository);

    const callers = Promise.all([service.getBySlug("en", "learn/overview"), service.getBySlug("en", "learn/overview")]);
    releaseRead();
    const [first, second] = await callers;

    expect(reads).toBe(1);
    expect(first).toBe(second);
    expect(first?.title).toBe("Overview");
  });

  it("does not share a completed lookup with a new service instance", async () => {
    let reads = 0;
    const repository: ContentRepository = {
      readAllContent: async () => [
        {
          title: "Overview",
          slug: "learn/overview",
          locale: "en",
          weight: 0,
          tags: [],
          draft: false,
          isSection: false,
          filePath: "/content/en/learn/overview.md",
        },
      ],
      readFileContent: async () => {
        reads++;
        return { content: "# Overview", frontmatter: {} };
      },
    };

    await new ContentService(repository).getBySlug("en", "learn/overview");
    await new ContentService(repository).getBySlug("en", "learn/overview");

    expect(reads).toBe(2);
  });
});
