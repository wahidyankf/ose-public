import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("reader env reads", () => {
  const src = readFileSync(resolve(__dirname, "../../../../../src/features/content/shell/reader.ts"), "utf-8");

  it("reads AYOKODING_WEB_CONTENT_DIR via env object not process.env", () => {
    expect(src).toMatch(/env\.AYOKODING_WEB_CONTENT_DIR/);
  });

  it("reads AYOKODING_WEB_SHOW_DRAFTS via env object not process.env", () => {
    expect(src).toMatch(/env\.AYOKODING_WEB_SHOW_DRAFTS/);
  });
});
