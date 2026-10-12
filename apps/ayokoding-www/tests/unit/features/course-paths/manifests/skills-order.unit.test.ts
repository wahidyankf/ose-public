import { describe, expect, it } from "vitest";
import { checkMarkerUsage } from "../../../../../src/features/course-paths/core/skills-restructure-allowlist";
import { flattenedCourseIds, loadRealManifests } from "./path-model-integrity.unit.test";
import { LEGACY_SKILLS_ORDER } from "./legacy-skills-order";

describe("marked skills manifests keep today's course order (plan 02 AC-3.1)", () => {
  const entries = loadRealManifests();
  const skillsEntries = entries.filter(({ manifest }) => manifest.pathId.startsWith("skills/"));

  for (const { manifest } of skillsEntries) {
    it(`${manifest.pathId} flattened order equals its frozen order exactly`, () => {
      const frozen = LEGACY_SKILLS_ORDER[manifest.pathId];
      expect(frozen, `no frozen skills order for ${manifest.pathId}`).toBeDefined();
      expect(flattenedCourseIds(manifest)).toEqual([...(frozen as readonly string[])]);
    });
  }

  it("every allowlist entry is used by its manifest and no other manifest carries a marker", () => {
    const usage = checkMarkerUsage(entries.map(({ manifest }) => manifest));
    expect(usage, `marker usage: ${JSON.stringify(usage)}`).toEqual({
      unusedAllowlistEntries: [],
      unexpectedMarkers: [],
    });
  });
});
