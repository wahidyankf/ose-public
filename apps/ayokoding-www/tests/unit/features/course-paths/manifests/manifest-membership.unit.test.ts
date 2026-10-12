import { describe, expect, it } from "vitest";
import { flattenedCourseIds, loadRealManifests } from "./path-model-integrity.unit.test";
import { LEGACY_MEMBERSHIP } from "./legacy-membership";

describe("rewritten manifests keep every course (plan 02 AC-3.1)", () => {
  const entries = loadRealManifests();

  for (const { manifest } of entries) {
    it(`${manifest.pathId} contains exactly its frozen course set`, () => {
      const frozen = LEGACY_MEMBERSHIP[manifest.pathId];
      expect(frozen, `no frozen membership for ${manifest.pathId}`).toBeDefined();
      expect([...flattenedCourseIds(manifest)].sort()).toEqual([...(frozen as readonly string[])].sort());
    });
  }
});
