// AI BENCHMARK — where the figures and prices come from, and when each source was last checked.
// The sources section renders these lists verbatim; a new source is one entry here.
//
// Values live in `libs/ayokoding-data/data/ai-benchmark.json` (provenance in
// `libs/ayokoding-data/provenance.md`). This module keeps the original path and named exports;
// the JSON is the only declaration.
import benchmarkJson from "../../../../../../../libs/ayokoding-data/data/ai-benchmark.json";
import type { OperatorId } from "./types";

export type BenchmarkOperator = {
  id: OperatorId;
  /** Proper-noun name (not translated). */
  name: string;
  /** Compact label for table cells. */
  shortName: string;
  url: string;
  /** ISO date this source was last read for the dataset. */
  checkedOn: string;
  /** ISO date the source itself says it was last updated, when it says so. */
  sourceUpdated?: string;
};

export const OPERATORS: readonly BenchmarkOperator[] = benchmarkJson.operators as BenchmarkOperator[];

export function operatorById(id: OperatorId): BenchmarkOperator {
  return OPERATORS.find((o) => o.id === id) as BenchmarkOperator;
}

export type PriceSource = {
  name: string;
  url: string;
  checkedOn: string;
};

/** Pricing pages read for the API prices, in the order the roster lists vendors. */
export const PRICE_SOURCES: readonly PriceSource[] = benchmarkJson.priceSources as PriceSource[];
