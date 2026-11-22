import { describe, expect, it, vi } from "vitest";
import { generateMetadata, generateStaticParams } from "@/app/[locale]/(content)/[...slug]/page";
import type { PathManifest } from "@/features/course-paths/core/schemas";

const getBySlug = vi.hoisted(() => ({ current: async (_input: unknown) => ({ title: "T", description: "D" }) }));

vi.mock("@/lib/trpc/server", () => ({
  serverCaller: {
    content: {
      getBySlug: (...args: unknown[]) => getBySlug.current(args[0]),
    },
  },
}));

const MANIFESTS = vi.hoisted(
  () =>
    [
      {
        pathId: "careers/immediately-effective/backend-track",
        arc: "immediately-effective",
        title: "Backend Track",
        description: "Serve HTTP.",
      },
      {
        pathId: "skills/just-enough-tools",
        arc: "just-enough-tools",
        title: "Just Enough Tools",
        description: "Everyday tools.",
      },
    ] as PathManifest[],
);

vi.mock("@/features/course-paths/shell/route-path-data", () => ({
  loadRoutePathData: async () => ({
    manifests: MANIFESTS,
    contentMap: new Map(),
    prerequisitesByCourse: {},
    libraryCourseIds: [],
    outlineCourseIds: [],
  }),
}));

function indexEntries(): Map<string, Record<string, unknown>> {
  return new Map([
    ["en:learn/x", { slug: "learn/x" }],
    ["en:", { slug: "" }],
    ["id:y", { slug: "y" }],
    ["en:learn/paths/careers/immediately-effective", { slug: "learn/paths/careers/immediately-effective" }],
    ["en:learn", { slug: "learn" }],
  ]);
}

vi.mock("@/features/app-shell/shell/trpc-init", () => ({
  createTRPCContext: () => ({
    contentService: {
      getIndex: async () => ({ contentMap: indexEntries() }),
    },
  }),
}));

describe("catch-all generateStaticParams", () => {
  it("enumerates publishable slugs and skips roots, other locales, paths, and the Learn home", async () => {
    const slugs = await generateStaticParams({ params: { locale: "en" } });
    expect(slugs).toEqual([{ slug: ["learn", "x"] }]);
  });

  it("enumerates nothing for an unknown locale", async () => {
    await expect(generateStaticParams({ params: { locale: "xx" } })).resolves.toEqual([]);
  });
});

describe("catch-all generateMetadata", () => {
  it("returns the page title and canonical URL", async () => {
    getBySlug.current = async () => ({ title: "Hello", description: "Body" });
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: ["learn", "x"] }),
    });
    expect(metadata.title).toBe("Hello");
    expect(metadata.alternates?.canonical).toBe("/en/learn/x");
  });

  it("marks legacy buckets noindex", async () => {
    getBySlug.current = async () => ({ title: "Legacy", description: "Old" });
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: ["learn", "legacy", "x"] }),
    });
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it("falls back to Not Found for an unknown page", async () => {
    getBySlug.current = async () => {
      throw new Error("NOT_FOUND");
    };
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: ["learn", "missing"] }),
    });
    expect(metadata).toEqual({ title: "Not Found" });
  });

  it("titles a manifest path from its manifest when no page exists", async () => {
    getBySlug.current = async () => {
      throw new Error("NOT_FOUND");
    };
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: ["learn", "paths", "skills", "just-enough-tools"] }),
    });
    expect(metadata.title).toBe("Just Enough Tools");
  });

  it("titles a real arc from the arc segment", async () => {
    getBySlug.current = async () => {
      throw new Error("NOT_FOUND");
    };
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: ["learn", "paths", "careers", "immediately-effective"] }),
    });
    expect(metadata.title).toBe("immediately-effective");
  });
});
