import { describe, expect, it } from "vitest";
import { fill, tf } from "../../../../../src/features/i18n/core/fill";
import { fill as aiFill, tf as aiTf } from "../../../../../src/features/ai-benchmark/shell/format";

describe("fill/tf (i18n core)", () => {
  it("fills named placeholders and leaves unknown ones", () => {
    expect(fill("{count} of {total} models shown", { count: 3, total: 9 })).toBe("3 of 9 models shown");
    expect(fill("Hi {name}", {})).toBe("Hi {name}");
  });

  it("tf translates then fills", () => {
    expect(tf("en", "courseEstimatedHours", { hours: 8 })).toBe("About 8 h");
    expect(tf("id", "courseEstimatedHours", { hours: 8 })).toBe("Sekitar 8 jam");
  });

  it("the ai-benchmark re-export behaves identically", () => {
    expect(aiFill("{a}!", { a: 1 })).toBe("1!");
    expect(aiTf("en", "courseEstimatedHours", { hours: 2 })).toBe("About 2 h");
  });
});
