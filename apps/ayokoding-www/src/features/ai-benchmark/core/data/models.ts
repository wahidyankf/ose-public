// AI BENCHMARK DATASET — typed adapter over the neutral shared source.
//
// The evaluated roster lives in `libs/ayokoding-data/data/ai-benchmark.json`
// (provenance in `libs/ayokoding-data/provenance.md`). This module keeps the
// original path and named exports; the JSON is the only declaration.
import benchmarkJson from "../../../../../../../libs/ayokoding-data/data/ai-benchmark.json";
import type { Dataset } from "./types";

export const dataset: Dataset = benchmarkJson.dataset as Dataset;
