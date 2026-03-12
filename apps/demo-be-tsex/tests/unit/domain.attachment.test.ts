import { describe, it, expect } from "vitest";
import { isAllowedContentType, ALLOWED_CONTENT_TYPES, MAX_ATTACHMENT_SIZE } from "../../src/domain/attachment.js";

describe("isAllowedContentType", () => {
  it("accepts image/jpeg", () => {
    expect(isAllowedContentType("image/jpeg")).toBe(true);
  });

  it("accepts image/png", () => {
    expect(isAllowedContentType("image/png")).toBe(true);
  });

  it("accepts application/pdf", () => {
    expect(isAllowedContentType("application/pdf")).toBe(true);
  });

  it("rejects text/plain", () => {
    expect(isAllowedContentType("text/plain")).toBe(false);
  });

  it("rejects image/gif", () => {
    expect(isAllowedContentType("image/gif")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isAllowedContentType("")).toBe(false);
  });
});

describe("ALLOWED_CONTENT_TYPES", () => {
  it("contains the three allowed types", () => {
    expect(ALLOWED_CONTENT_TYPES).toContain("image/jpeg");
    expect(ALLOWED_CONTENT_TYPES).toContain("image/png");
    expect(ALLOWED_CONTENT_TYPES).toContain("application/pdf");
  });
});

describe("MAX_ATTACHMENT_SIZE", () => {
  it("is 10MB", () => {
    expect(MAX_ATTACHMENT_SIZE).toBe(10 * 1024 * 1024);
  });
});
