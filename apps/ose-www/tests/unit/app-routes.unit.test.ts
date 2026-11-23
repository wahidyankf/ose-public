import { describe, expect, it, vi } from "vitest";
import type { ContentMeta } from "@/features/content/core/types";
import { GET as feedGet } from "@/app/feed.xml/route";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { GET as trpcGet, POST as trpcPost } from "@/app/api/trpc/[trpc]/route";
import { SITE_URL } from "@/lib/site-url";
import { mockUpdateMetas } from "./be-steps/helpers/mock-content";

const listUpdates = vi.hoisted(() => vi.fn<() => Promise<ContentMeta[]>>());

vi.mock("@/lib/trpc/server", () => ({
  serverCaller: { content: { listUpdates } },
}));

describe("app route handlers", () => {
  it("serves the feed through the feed route", async () => {
    listUpdates.mockResolvedValueOnce(mockUpdateMetas);

    const response = await feedGet();

    expect(response.status).toBe(200);
    expect(await response.text()).toContain(`<link>${SITE_URL}/${mockUpdateMetas[0]!.slug}/</link>`);
  });

  it("answers robots.txt with the sitemap location", () => {
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it("serves the sitemap from the updates the content service lists", async () => {
    listUpdates.mockResolvedValueOnce(mockUpdateMetas);

    const entries = await sitemap();

    expect(entries.map((entry) => entry.url)).toContain(`${SITE_URL}/${mockUpdateMetas[1]!.slug}/`);
  });

  it("answers a tRPC query request with the superjson envelope", async () => {
    const request = new Request("http://localhost:3100/api/trpc/health.check");

    const response = await trpcGet(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ result: { data: { json: { status: "ok" } } } });
  });

  it("routes POST requests through the same tRPC handler, which refuses a query sent as POST", async () => {
    const request = new Request("http://localhost:3100/api/trpc/health.check", { method: "POST" });

    const response = await trpcPost(request);

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
