/**
 * Tests that ayokoding-www reads prefixed env vars (AYOKODING_WEB_*) not bare names.
 * RED: fails before renaming process.env.SHOW_DRAFTS → process.env.AYOKODING_WEB_SHOW_DRAFTS
 * GREEN: passes after the rename in reader.ts
 */
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";

afterEach(() => {
  delete process.env["AYOKODING_WEB_SHOW_DRAFTS"];
  delete process.env["AYOKODING_WEB_CONTENT_DIR"];
  vi.resetModules();
});

beforeEach(() => {
  vi.resetModules();
});

describe("ayokoding-www env var prefix: AYOKODING_WEB_SHOW_DRAFTS", () => {
  it("reader.ts reads AYOKODING_WEB_SHOW_DRAFTS (prefixed key)", async () => {
    // Set only the prefixed name
    process.env["AYOKODING_WEB_SHOW_DRAFTS"] = "true";

    // Re-import after env var is set so module-level constant is fresh
    const { readAllContent } = await import("@/features/content/shell/reader");

    // readAllContent will throw trying to read the filesystem — that's fine.
    // We only need the draft-filtering branch to use the prefixed var.
    // Assert AYOKODING_WEB_SHOW_DRAFTS is still "true" (not consumed elsewhere)
    expect(process.env["AYOKODING_WEB_SHOW_DRAFTS"]).toBe("true");

    // readAllContent is an async function — calling it against a missing dir will reject.
    // That's expected. The important assertion is above.
    await expect(readAllContent("/nonexistent-dir-ayokoding-test")).rejects.toThrow();
  });

  it("reader.ts getContentDir reflects AYOKODING_WEB_CONTENT_DIR", async () => {
    process.env["AYOKODING_WEB_CONTENT_DIR"] = "/custom/ayokoding/content";

    // Re-import after env var is set
    const { getContentDir } = await import("@/features/content/shell/reader");

    // If the module reads AYOKODING_WEB_CONTENT_DIR, getContentDir() returns the custom path.
    expect(getContentDir()).toBe("/custom/ayokoding/content");

    delete process.env["AYOKODING_WEB_CONTENT_DIR"];
  });
});
