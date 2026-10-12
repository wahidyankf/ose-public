import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

vi.mock("@/lib/trpc/server", () => ({
  serverCaller: {
    content: {
      getBySlug: vi.fn().mockResolvedValue({
        title: "Software Engineering",
        description: "Learn SE",
        html: "<p>content</p>",
        headings: [],
        date: null,
        prev: null,
        next: null,
      }),
    },
  },
}));

vi.mock("@/features/app-shell/shell/trpc-init", () => ({
  createTRPCContext: () => ({
    contentService: { getIndex: async () => ({ contentMap: new Map() }) },
  }),
}));

// Real `manifests/` is empty today, but this mock keeps the arc-rejection tests below hermetic
// against that real (and eventually populated) directory's state, rather than relying on it.
vi.mock("@/features/course-paths/shell/manifest-repository", () => ({
  loadManifests: vi.fn().mockResolvedValue([]),
  defaultManifestsDir: () => "unused-in-test",
}));

// eslint-disable-next-line import/first
import ContentPage, { generateMetadata } from "../../../../../../src/app/[locale]/(content)/[...slug]/page";
// eslint-disable-next-line import/first
import { manifestFixture } from "../../../../features/course-paths/manifest-fixture";

// Carried over from the retired c/[...slug]/page.unit.test.ts (DD-48 route
// merge) — same assertions, updated for the uniform bare join (no /c/).
describe("generateMetadata", () => {
  it("sets canonical to the bare URL (DD-48 — no /c/ namespace)", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: ["learn", "software-engineering"] }),
    });
    expect(meta.alternates?.canonical).toBe("/en/learn/software-engineering");
  });

  it("includes alternates.languages with en and x-default", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: ["learn", "software-engineering"] }),
    });
    const langs = meta.alternates?.languages as Record<string, string> | undefined;
    expect(langs).toBeDefined();
    expect(langs?.["en"]).toBeDefined();
    expect(langs?.["x-default"]).toBeDefined();
  });

  it("returns 'Not Found' metadata when the slug does not resolve", async () => {
    const { serverCaller } = await import("@/lib/trpc/server");
    vi.mocked(serverCaller.content.getBySlug).mockRejectedValueOnce(new Error("not found"));
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: ["does-not-exist"] }),
    });
    expect(meta.title).toBe("Not Found");
  });

  // Option C (Screen-4 design funnel, §3.4): noindex the whole legacy bucket
  // rather than adding an in-page landing-notice component.
  it("noindexes a legacy-bucket slug, still allowing crawlers to follow its links", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: ["learn", "legacy", "software-engineering"] }),
    });
    expect(meta.robots).toEqual({ index: false, follow: true });
  });

  it("does not noindex a non-legacy slug (e.g. under learn/courses)", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: ["learn", "courses", "some-course"] }),
    });
    expect(meta.robots).toBeUndefined();
  });

  it("titles a bogus careers arc (no real _index.md, zero manifests) 'Not Found', not the raw arc slug (PR #95 cycle-3 review — supersedes the phase-5 EWT finding below)", async () => {
    // Phase 5 (EWT finding) originally titled ANY unrecognized `careers/<arc>` segment with the raw
    // arc slug, treating it as a legitimate "no manifests published yet" empty state. PR #95's
    // cycle-3 review found this let an arbitrary string (e.g. `careers/asdkjhasdkjh`) render a fake
    // HTTP 200 — reproduced live — instead of the 404 every other invalid segment shape correctly
    // returns. The fix (`page.tsx`'s `generateMetadata` arc branch) now titles a bogus arc
    // "Not Found" whenever it has both zero matching manifests AND no real `_index.md`
    // (`getBySlug` rejecting is exactly that "no real `_index.md`" signal). A genuine arc (one of
    // the three real arcs, see the sibling "recovers a title" test below) is unaffected — each has a
    // real `_index.md`, so `getBySlug` never rejects for it and this catch branch is never reached.
    const { serverCaller } = await import("@/lib/trpc/server");
    vi.mocked(serverCaller.content.getBySlug).mockRejectedValueOnce(new Error("not found"));
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: ["learn", "paths", "careers", "no-fixture-arc"] }),
    });
    expect(meta.title).toBe("Not Found");
  });

  it("still recovers an arc title from generateMetadata's catch when the arc has published manifests but (hypothetically) no _index.md", async () => {
    // Edge case carved out by the fix: an arc whose `_index.md` is missing/rejected but which DOES
    // have at least one loaded manifest still gets a real title, not "Not Found" — the fix's guard
    // is `arcManifests.length > 0`, not "getBySlug succeeded".
    const { serverCaller } = await import("@/lib/trpc/server");
    const { loadManifests } = await import("@/features/course-paths/shell/manifest-repository");
    vi.mocked(serverCaller.content.getBySlug).mockRejectedValueOnce(new Error("not found"));
    vi.mocked(loadManifests).mockResolvedValueOnce([
      manifestFixture({
        pathId: "careers/interview-ready/some-role",
        arc: "interview-ready",
        title: "Some Role",
        description: "desc",
      }),
    ]);
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: ["learn", "paths", "careers", "interview-ready"] }),
    });
    expect(meta.title).toBe("interview-ready");
  });
});

describe("ContentPage — bogus careers arc 404s instead of rendering a fake 200 (PR #95 cycle-3 review)", () => {
  // Regression test: `resolvePathsRoute` is pure/no-IO and cannot itself validate an arc segment
  // against the real 3-member arc set, so `renderPathsRoute` (the IO-aware consumer) must reject an
  // arc resolution with zero matching manifests and no real `_index.md`, falling through to the
  // standard content-page fetch — which then correctly calls Next.js's `notFound()`. Before the fix,
  // this exact scenario rendered a normal 200 page with a synthesized `<h1>` and an empty-state body
  // (reproduced live at `/en/learn/paths/careers/asdkjhasdkjh`); after the fix, `ContentPage` throws
  // the same `notFound()` digest error every other invalid segment shape already produces.
  it("rejects an arbitrary careers/<arc> segment and calls notFound(), matching every other invalid segment shape", async () => {
    const { serverCaller } = await import("@/lib/trpc/server");
    const { loadManifests } = await import("@/features/course-paths/shell/manifest-repository");
    vi.mocked(loadManifests).mockResolvedValue([]);
    // Called twice: once inside `renderPathsRoute`'s own `seoPage` fetch (rejects, so the "arc"
    // branch's `seoPage === null` check holds), once more by `ContentPage`'s standard fallback fetch
    // after `renderPathsRoute` returns `null` — both must reject NOT_FOUND for the real `notFound()`
    // call at the end of that fallback to fire.
    vi.mocked(serverCaller.content.getBySlug)
      .mockRejectedValueOnce(new TRPCError({ code: "NOT_FOUND" }))
      .mockRejectedValueOnce(new TRPCError({ code: "NOT_FOUND" }));

    await expect(
      ContentPage({
        params: Promise.resolve({ locale: "en", slug: ["learn", "paths", "careers", "asdkjhasdkjh"] }),
      }),
    ).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_HTTP_ERROR_FALLBACK;404") });
  });
});
