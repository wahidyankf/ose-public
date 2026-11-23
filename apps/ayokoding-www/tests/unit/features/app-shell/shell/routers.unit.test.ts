import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { createCallerFactory } from "@/features/app-shell/shell/trpc-init";
import { appRouter } from "@/features/app-shell/shell/root-router";
import { ContentService } from "@/features/content/shell/service";
import { InMemoryContentRepository } from "@/features/content/shell/repository-memory";
import type { ContentMeta } from "@/features/content/core/types";

const LONG_BODY = `Intro line. ${"lorem ipsum dolor sit amet ".repeat(20)}The hidden keyword sits mid-document. ${"trailing words ".repeat(20)}`;

const ITEMS: ContentMeta[] = [
  {
    title: "Hello",
    slug: "learn/hello",
    locale: "en",
    weight: 0,
    description: "First program",
    tags: ["intro"],
    draft: false,
    isSection: false,
    filePath: "/virtual/en/learn/hello.md",
  },
  {
    title: "Long",
    slug: "learn/long",
    locale: "en",
    weight: 1,
    description: "Long page",
    tags: [],
    draft: false,
    isSection: false,
    filePath: "/virtual/en/learn/long.md",
  },
];

function testCaller() {
  const repository = new InMemoryContentRepository(
    ITEMS,
    new Map([
      ["/virtual/en/learn/hello.md", { content: "# Hello", frontmatter: { title: "Hello" } }],
      ["/virtual/en/learn/long.md", { content: LONG_BODY, frontmatter: { title: "Long" } }],
    ]),
  );
  const contentService = new ContentService(repository, undefined, {
    readFile: async () => {
      throw new Error("no pre-built search data");
    },
  });
  return createCallerFactory(appRouter)({ contentService });
}

describe("search router", () => {
  it("rejects a blank query", async () => {
    const caller = testCaller();
    await expect(caller.search.query({ locale: "en", query: "   " })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("searches the memory index", async () => {
    const caller = testCaller();
    const results = await caller.search.query({ locale: "en", query: "hello" });
    expect(results.length).toBeGreaterThan(0);
  });

  it("reuses the built index and excerpts mid-document matches", async () => {
    const caller = testCaller();
    const first = await caller.search.query({ locale: "en", query: "keyword" });
    const second = await caller.search.query({ locale: "en", query: "keyword" });
    expect(second).toEqual(first);
    expect(first.length).toBeGreaterThan(0);
    expect(first[0]?.excerpt.startsWith("...")).toBe(true);
    expect(first[0]?.excerpt.endsWith("...")).toBe(true);
  });

  it("falls back to scanning files when the pre-built search data is unreadable", async () => {
    const repository = new InMemoryContentRepository(
      ITEMS,
      new Map([["/virtual/en/learn/hello.md", { content: "# Hello", frontmatter: { title: "Hello" } }]]),
    );
    const contentService = new ContentService(repository, "/virtual/no-such-search-data.json");
    const caller = createCallerFactory(appRouter)({ contentService });
    const results = await caller.search.query({ locale: "en", query: "hello" });
    expect(results.length).toBeGreaterThan(0);
  });

  it("builds the default server context", async () => {
    const { createTRPCContext } = await import("@/features/app-shell/shell/trpc-init");
    expect(createTRPCContext().contentService).toBeDefined();
  });

  it("answers health and languages without content", async () => {
    const caller = testCaller();
    await expect(caller.meta.health()).resolves.toEqual({ status: "ok" });
    await expect(caller.meta.languages()).resolves.toHaveLength(2);
  });

  it("reads content through the memory service", async () => {
    const caller = testCaller();
    await expect(caller.content.getBySlug({ locale: "en", slug: "learn/hello" })).resolves.toMatchObject({
      title: "Hello",
    });
    await expect(caller.content.getBySlug({ locale: "en", slug: "learn/missing" })).rejects.toBeInstanceOf(TRPCError);
    await expect(caller.content.getTree({ locale: "en" })).resolves.toBeInstanceOf(Array);
    await expect(caller.content.listChildren({ locale: "en", parentSlug: "learn" })).resolves.toBeInstanceOf(Array);
  });
});
