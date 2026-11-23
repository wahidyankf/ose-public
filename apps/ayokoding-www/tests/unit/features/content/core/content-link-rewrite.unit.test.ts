import { describe, expect, it } from "vitest";
import { resolveContentHref } from "../../../../../src/features/content/core/content-link-rewrite";

const PAGE = { locale: "en" as const, slug: "learn/x/overview", isSection: false };

describe("resolveContentHref", () => {
  it("keeps the hash when resolving a relative link", () => {
    expect(resolveContentHref("../other.md#part", PAGE)).toBe("/en/learn/other#part");
  });

  it("resolves a relative link without a hash", () => {
    expect(resolveContentHref("../other.md", PAGE)).toBe("/en/learn/other");
  });

  it("leaves absolute and anchor links untouched", () => {
    expect(resolveContentHref("https://example.com/x.md", PAGE)).toBe("https://example.com/x.md");
    expect(resolveContentHref("#top", PAGE)).toBe("#top");
  });
});
