import { describe, it, expect } from "vitest";
import { sweepCorpusShard } from "./corpus-outline-sweep";

describe("corpus outline sweep shard 3/4 (EWT-002/EWT-003)", () => {
  it("no lesson body in shard 3/4 renders an h1, opens below h2, or skips a level", { timeout: 120_000 }, () => {
    const { lessons, offenders } = sweepCorpusShard(3, 4);
    expect(lessons, "no lesson files walked in shard 3/4").toBeGreaterThan(0);
    expect(
      offenders.length,
      `${offenders.length} lesson outline problems across ${lessons} lessons (shard 3/4):\n` + offenders.join("\n"),
    ).toBe(0);
  });
});
