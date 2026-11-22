import { describe, expect, it } from "vitest";
import { benchmarkScore, isScoredFigure, scoredBenchmarks, scoredFigure } from "@/features/ai-benchmark/core/score";
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

describe("benchmarkScore", () => {
  it("returns the raw scored figure value with no normalization", () => {
    expect(benchmarkScore(model("m", [fig("deep-swe", 70)]), "deep-swe")).toBe(70);
  });

  it("ignores a figure on a non-pinned version", () => {
    expect(benchmarkScore(model("m", [fig("terminal-bench", 90, "2.1")]), "terminal-bench")).toBeUndefined();
  });

  it("is undefined when the model has no figure for the benchmark", () => {
    expect(benchmarkScore(model("m", [fig("deep-swe", 70)]), "terminal-bench")).toBeUndefined();
  });
});
