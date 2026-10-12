import { describe, expect, it } from "vitest";
import { parsePathContext } from "../../../../../src/features/course-paths/core/path-context";
import type { PathManifest } from "../../../../../src/features/course-paths/core/schemas";
import { manifestFixture } from "../manifest-fixture";

const loadedManifest: PathManifest = manifestFixture({
  pathId: "careers/interview-ready/software-engineer",
  arc: "interview-ready",
  title: "Interview-Ready Software Engineer",
  description: "Interview-first track for an experienced engineer re-entering the market.",
  courses: ["just-enough-python"],
});

const manifests: readonly PathManifest[] = [loadedManifest];

describe("parsePathContext", () => {
  it("returns the pathId when the path param names a loaded manifest", () => {
    const searchParams = new URLSearchParams({
      path: "careers/interview-ready/software-engineer",
    });

    expect(parsePathContext(searchParams, manifests)).toBe("careers/interview-ready/software-engineer");
  });

  it("returns null when the path param names no loaded manifest", () => {
    const searchParams = new URLSearchParams({ path: "careers/unknown-path" });

    expect(parsePathContext(searchParams, manifests)).toBeNull();
  });

  it("returns null when the path param is absent", () => {
    const searchParams = new URLSearchParams();

    expect(parsePathContext(searchParams, manifests)).toBeNull();
  });

  it("never throws for any of the three input shapes", () => {
    const knownParams = new URLSearchParams({
      path: "careers/interview-ready/software-engineer",
    });
    const unknownParams = new URLSearchParams({ path: "careers/unknown-path" });
    const absentParams = new URLSearchParams();

    expect(() => parsePathContext(knownParams, manifests)).not.toThrow();
    expect(() => parsePathContext(unknownParams, manifests)).not.toThrow();
    expect(() => parsePathContext(absentParams, manifests)).not.toThrow();
  });
});
