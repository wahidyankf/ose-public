import { describe, expect, it } from "vitest";
import {
  compositeIndex,
  isScoredFigure,
  scoreOver,
  scoredBenchmarks,
  scoredFigure,
} from "@/features/ai-benchmark/core/score";
import { fig, model } from "./fixtures";

describe("isScoredFigure", () => {
  it("accepts a figure on the pinned benchmark version", () => {
    expect(isScoredFigure(fig("terminal-bench", 40))).toBe(true);
  });

  it("rejects a figure on any other version", () => {
    expect(isScoredFigure(fig("terminal-bench", 90, "2.1"))).toBe(false);
  });
});

describe("scoredFigure", () => {
  it("returns the pinned-version figure even when an older version is listed first", () => {
    const m = model("m", [fig("terminal-bench", 90, "2.1"), fig("terminal-bench", 40)]);
    expect(scoredFigure(m, "terminal-bench")?.value).toBe(40);
  });

  it("returns undefined when the model has no scored figure for the benchmark", () => {
    expect(scoredFigure(model("m", [fig("terminal-bench", 90, "2.1")]), "terminal-bench")).toBeUndefined();
  });
});

describe("scoredBenchmarks", () => {
  it("lists the benchmarks with a scored figure, in column order", () => {
    const m = model("m", [fig("swe-atlas-qna", 50), fig("deep-swe", 60), fig("terminal-bench", 9, "3.0")]);
    expect(scoredBenchmarks(m)).toEqual(["deep-swe", "swe-atlas-qna"]);
  });
});

describe("scoreOver", () => {
  it("is the equal-weight mean of the raw percentages over the given benchmarks", () => {
    const m = model("m", [fig("deep-swe", 70), fig("terminal-bench", 40), fig("swe-atlas-qna", 61)]);
    expect(scoreOver(m, ["deep-swe", "terminal-bench", "swe-atlas-qna"])).toBe(57);
    expect(scoreOver(m, ["deep-swe", "terminal-bench"])).toBe(55);
  });

  it("is undefined when any requested benchmark is missing", () => {
    expect(scoreOver(model("m", [fig("deep-swe", 70)]), ["deep-swe", "terminal-bench"])).toBeUndefined();
  });

  it("is undefined for an empty benchmark list", () => {
    expect(scoreOver(model("m", [fig("deep-swe", 70)]), [])).toBeUndefined();
  });
});

describe("compositeIndex", () => {
  it("averages every scored benchmark", () => {
    expect(compositeIndex(model("m", [fig("deep-swe", 70), fig("terminal-bench", 40), fig("swe-atlas-qna", 61)]))).toBe(
      57,
    );
  });

  it("ignores a figure on a non-pinned version", () => {
    const m = model("m", [fig("deep-swe", 60), fig("terminal-bench", 40), fig("terminal-bench", 90, "2.1")]);
    expect(compositeIndex(m)).toBe(50);
  });

  it("is undefined below the minimum number of scored benchmarks", () => {
    expect(compositeIndex(model("m", [fig("deep-swe", 70)]))).toBeUndefined();
    expect(compositeIndex(model("m"))).toBeUndefined();
  });
});
