// AI BENCHMARK — where the figures and prices come from, and when each source was last checked.
// The sources section renders these lists verbatim; a new source is one entry here.

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

export const OPERATORS: readonly BenchmarkOperator[] = [
  {
    id: "artificial-analysis",
    name: "Artificial Analysis — Coding Agent Index v1.5",
    shortName: "Artificial Analysis",
    url: "https://artificialanalysis.ai/agents/coding-agents",
    checkedOn: "2026-10-01",
  },
  {
    id: "datacurve",
    name: "Datacurve — DeepSWE v1.1 leaderboard",
    shortName: "Datacurve",
    url: "https://deepswe.datacurve.ai/",
    checkedOn: "2026-10-01",
    sourceUpdated: "2026-09-22",
  },
  {
    id: "terminal-bench",
    name: "Terminal-Bench — official 4.0 leaderboard",
    shortName: "Terminal-Bench board",
    url: "https://www.tbench.ai/leaderboard",
    checkedOn: "2026-10-01",
    sourceUpdated: "2026-09-21",
  },
  {
    id: "vals",
    name: "Vals AI — Terminal-Bench 4",
    shortName: "Vals AI",
    url: "https://www.vals.ai/benchmarks/terminal-bench-4",
    checkedOn: "2026-10-01",
    sourceUpdated: "2026-09-29",
  },
  {
    id: "scale",
    name: "Scale AI — SWE-Atlas QnA leaderboard",
    shortName: "Scale AI",
    url: "https://labs.scale.com/leaderboard/sweatlas-qna",
    checkedOn: "2026-10-01",
  },
];

export function operatorById(id: OperatorId): BenchmarkOperator {
  return OPERATORS.find((o) => o.id === id) as BenchmarkOperator;
}

export type PriceSource = {
  name: string;
  url: string;
  checkedOn: string;
};

/** Pricing pages read for the API prices, in the order the roster lists vendors. */
export const PRICE_SOURCES: readonly PriceSource[] = [
  { name: "Anthropic", url: "https://platform.claude.com/docs/en/about-claude/pricing", checkedOn: "2026-10-01" },
  { name: "OpenAI", url: "https://developers.openai.com/api/docs/pricing", checkedOn: "2026-10-01" },
  { name: "Google", url: "https://ai.google.dev/gemini-api/docs/pricing", checkedOn: "2026-10-01" },
  { name: "xAI", url: "https://docs.x.ai/docs/models", checkedOn: "2026-10-01" },
  { name: "Cursor", url: "https://cursor.com/docs/models-and-pricing", checkedOn: "2026-10-01" },
  { name: "Z.ai", url: "https://docs.z.ai/guides/overview/pricing", checkedOn: "2026-10-01" },
  { name: "Moonshot AI", url: "https://platform.kimi.ai/docs/pricing/chat", checkedOn: "2026-10-01" },
  { name: "DeepSeek", url: "https://api-docs.deepseek.com/quick_start/pricing", checkedOn: "2026-10-01" },
  {
    name: "Alibaba Cloud",
    url: "https://www.alibabacloud.com/help/en/model-studio/model-pricing",
    checkedOn: "2026-10-01",
  },
  { name: "MiniMax", url: "https://platform.minimax.io/docs/guides/pricing-paygo", checkedOn: "2026-10-01" },
  { name: "Meta", url: "https://dev.meta.ai/docs/pricing-rate-limits", checkedOn: "2026-10-01" },
  { name: "OpenCode Go", url: "https://opencode.ai/docs/go/", checkedOn: "2026-10-01" },
  { name: "OpenCode Zen", url: "https://opencode.ai/docs/zen/", checkedOn: "2026-10-01" },
];
