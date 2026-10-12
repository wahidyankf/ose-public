import { describe, expect, it } from "vitest";
import {
  SKILLS_RESTRUCTURE_ALLOWLIST,
  checkMarkerUsage,
  isMarkedShape,
  isPendingSkillsRestructure,
} from "../../../../../src/features/course-paths/core/skills-restructure-allowlist";
import type { PathManifestFile } from "../../../../../src/features/course-paths/core/schemas";
import { manifestFixture } from "../manifest-fixture";

describe("SKILLS_RESTRUCTURE_ALLOWLIST", () => {
  it("has exactly the four skills entries, each with its owning plan", () => {
    expect([...SKILLS_RESTRUCTURE_ALLOWLIST.entries()]).toEqual([
      ["skills/conventional-accounting", "plan-06"],
      ["skills/sharia-accounting", "plan-06"],
      ["skills/conventional-erp", "plan-07"],
      ["skills/sharia-erp", "plan-07"],
    ]);
  });

  it("every key starts with skills/", () => {
    for (const key of SKILLS_RESTRUCTURE_ALLOWLIST.keys()) {
      expect(key.startsWith("skills/")).toBe(true);
    }
  });

  it("maps accounting paths to plan-06 and ERP paths to plan-07", () => {
    expect(SKILLS_RESTRUCTURE_ALLOWLIST.get("skills/conventional-accounting")).toBe("plan-06");
    expect(SKILLS_RESTRUCTURE_ALLOWLIST.get("skills/sharia-accounting")).toBe("plan-06");
    expect(SKILLS_RESTRUCTURE_ALLOWLIST.get("skills/conventional-erp")).toBe("plan-07");
    expect(SKILLS_RESTRUCTURE_ALLOWLIST.get("skills/sharia-erp")).toBe("plan-07");
  });
});

describe("isMarkedShape", () => {
  const markedFile: PathManifestFile = {
    pathId: "skills/conventional-accounting",
    arc: "immediately-effective",
    title: "Conventional Accounting",
    description: "A practical accounting path.",
    assumes: [],
    phases: [{ id: "all-courses", title: "Conventional Accounting", kind: "core", courses: ["a", "b"] }],
  };

  it("accepts the one-phase all-courses shape", () => {
    expect(isMarkedShape(markedFile)).toBe(true);
  });

  it("rejects a second phase", () => {
    expect(
      isMarkedShape({
        ...markedFile,
        phases: [...markedFile.phases, { id: "more", title: "More", kind: "core", courses: ["c"] }],
      }),
    ).toBe(false);
  });

  it("rejects an outcome on the single phase", () => {
    expect(
      isMarkedShape({
        ...markedFile,
        phases: [
          { id: "all-courses", title: "Conventional Accounting", kind: "core", outcome: { can: "x" }, courses: ["a"] },
        ],
      }),
    ).toBe(false);
  });

  it("rejects goals", () => {
    expect(isMarkedShape({ ...markedFile, goals: ["a"] })).toBe(false);
  });

  it("rejects a non-empty assumes", () => {
    expect(isMarkedShape({ ...markedFile, assumes: ["outside-course"] })).toBe(false);
  });

  it("rejects another phase ID", () => {
    expect(
      isMarkedShape({
        ...markedFile,
        phases: [{ id: "foundations", title: "Foundations", kind: "core", courses: ["a"] }],
      }),
    ).toBe(false);
  });
});

describe("isPendingSkillsRestructure", () => {
  it("is true for an allowlisted skills manifest carrying its marker", () => {
    const marked = manifestFixture({
      pathId: "skills/conventional-accounting",
      arc: "immediately-effective",
      title: "Conventional Accounting",
      description: "A practical accounting path.",
      restructurePendingIn: "plan-06",
      assumes: [],
      phases: [{ id: "all-courses", title: "Conventional Accounting", kind: "core", courses: ["a", "b"] }],
    });

    expect(isPendingSkillsRestructure(marked)).toBe(true);
  });

  it("is false for a manifest without a marker", () => {
    expect(isPendingSkillsRestructure(manifestFixture({ courses: ["a"] }))).toBe(false);
  });
});

describe("checkMarkerUsage", () => {
  function markedManifest(pathId: string, plan: "plan-06" | "plan-07") {
    return manifestFixture({
      pathId,
      arc: "immediately-effective",
      title: pathId,
      description: "A deterministic marked fixture.",
      restructurePendingIn: plan,
      assumes: [],
      phases: [{ id: "all-courses", title: pathId, kind: "core", courses: ["a"] }],
    });
  }

  it("reports an unused allowlist entry", () => {
    const manifests = [
      markedManifest("skills/conventional-accounting", "plan-06"),
      markedManifest("skills/sharia-accounting", "plan-06"),
      markedManifest("skills/conventional-erp", "plan-07"),
    ];

    expect(checkMarkerUsage(manifests).unusedAllowlistEntries).toEqual(["skills/sharia-erp"]);
    expect(checkMarkerUsage(manifests).unexpectedMarkers).toEqual([]);
  });

  it("reports an unexpected marker on a career manifest", () => {
    const careerWithMarker = {
      ...manifestFixture({ courses: ["a"] }),
      pathId: "careers/interview-ready/software-engineer",
      restructurePendingIn: "plan-06" as const,
    };

    expect(checkMarkerUsage([careerWithMarker]).unexpectedMarkers).toEqual([
      "careers/interview-ready/software-engineer",
    ]);
  });

  it("is clean when every allowlist entry is used by its own manifest and nothing else carries a marker", () => {
    const manifests = [
      markedManifest("skills/conventional-accounting", "plan-06"),
      markedManifest("skills/sharia-accounting", "plan-06"),
      markedManifest("skills/conventional-erp", "plan-07"),
      markedManifest("skills/sharia-erp", "plan-07"),
    ];

    expect(checkMarkerUsage(manifests)).toEqual({ unusedAllowlistEntries: [], unexpectedMarkers: [] });
  });
});
