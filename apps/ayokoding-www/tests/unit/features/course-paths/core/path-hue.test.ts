import { describe, expect, it } from "vitest";
import {
  hueForCareersArc,
  hueForManifest,
  hueCssVars,
  SKILLS_SECTION_ACCENT_HUE,
} from "../../../../../src/features/course-paths/core/path-hue";

// phase-5 rule-15 DWT-001 fix (`swe-web-tester` (design charter) retest): every one of this plan's five
// committed, Selected hi-fi mockups depicts a per-arc/per-compliance-track hue-coding system
// (prd.md's DD-50 "Accent hue" design legend) that shipped code never actually applied — this
// module is the single pure source of truth for resolving that hue, so a test here proves the
// exact documented arc/subject -> hue map (rather than each consuming component re-deriving it).

describe("hueForCareersArc", () => {
  it("maps interview-ready to honey", () => {
    expect(hueForCareersArc("interview-ready")).toBe("honey");
  });

  it("maps immediately-effective to teal (shared by both its roles)", () => {
    expect(hueForCareersArc("immediately-effective")).toBe("teal");
  });

  it("maps fundamentally-strong to sage", () => {
    expect(hueForCareersArc("fundamentally-strong")).toBe("sage");
  });

  it("returns undefined for an arc not in the documented map (e.g. an e2e-fixture arc)", () => {
    expect(hueForCareersArc("e2e-fixture-alpha-track")).toBeUndefined();
  });
});

describe("hueForManifest", () => {
  it("resolves a careers manifest's hue from its arc field", () => {
    expect(hueForManifest({ pathId: "careers/interview-ready/backend-track", arc: "interview-ready" })).toBe("honey");
  });

  it("resolves a skills manifest's hue from its pathId's subject segment (compliance-track pairing)", () => {
    expect(hueForManifest({ pathId: "skills/conventional-accounting", arc: "conventional" })).toBe("terracotta");
    expect(hueForManifest({ pathId: "skills/conventional-erp", arc: "conventional" })).toBe("terracotta");
    expect(hueForManifest({ pathId: "skills/sharia-accounting", arc: "sharia" })).toBe("plum");
    expect(hueForManifest({ pathId: "skills/sharia-erp", arc: "sharia" })).toBe("plum");
  });

  it("returns undefined for a skills manifest whose subject is not one of the four documented ones", () => {
    expect(hueForManifest({ pathId: "skills/e2e-fixture-alpha", arc: "e2e-fixture-alpha-track" })).toBeUndefined();
  });
});

describe("hueCssVars", () => {
  it("returns the current/wash/ink custom-property triple for a resolved hue", () => {
    expect(hueCssVars("honey")).toEqual({
      "--hue-current": "var(--hue-honey)",
      "--hue-current-wash": "var(--hue-honey-wash)",
      "--hue-current-ink": "var(--hue-honey-ink)",
    });
  });
});

describe("SKILLS_SECTION_ACCENT_HUE", () => {
  it("is sky — the section-level accent used once, never per-card", () => {
    expect(SKILLS_SECTION_ACCENT_HUE).toBe("sky");
  });
});
