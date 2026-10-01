---
title: "Overview"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Evaluating AI Output -- Essentials](../evaluating-ai-output-essentials/overview.md)
  (the light gate -- a fixed dataset, deterministic scorers, a pass rate, and before/after
  comparison) is a hard prerequisite, not a nice-to-have -- this course teaches everything the
  light gate deliberately leaves out; [Statistics for Evaluation](../statistics-for-evaluation/overview.md)
  (agreement statistics, sampling, and significance) is also a hard prerequisite -- every measured
  agreement rate and confidence interval in this course assumes that statistical vocabulary is
  already in hand; `agentic-ai` and `agent-orchestration-subagents-and-observability` --
  `[Unverified]` not yet present in the AyoKoding course library on disk, so no link is given here
  -- supply the agent trajectories and traces this course's trajectory-evaluation tier treats as
  its own object of evaluation; `cicd-and-release-engineering` -- `[Unverified]` not yet present in
  the AyoKoding course library on disk, so no link is given here -- supplies the pipeline this
  course's CI gate runs inside; [Software Testing](../software-testing/overview.md) gives the
  assertion mindset (fixtures, arrange-act-assert, a written expectation checked automatically)
  every worked example's `if __name__ == "__main__":` block directly reuses.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.13** (a local or mockable generator
  model plus a second, different mockable judge model, so judge-model separation and agreement
  measurement are demonstrable with no paid API key); a spreadsheet or notebook for the manual
  error-analysis pass; no eval framework, hosted eval product, or paid model subscription is
  required anywhere in this topic.
- **Assumed knowledge**: the light gate's dataset/scorer/pass-rate loop; agreement statistics and
  confidence intervals at the level [Statistics for Evaluation](../statistics-for-evaluation/overview.md)
  teaches; reading an agent's own tool-call trace; how a CI job blocks a merge.

## Why this exists -- the big idea

**The problem before the solution**: teams reach for a metric before they have read their
failures, so they measure something that is easy to compute instead of something that predicts
user harm -- and then they adopt an LLM judge whose agreement with a human they never measured,
which converts an unknown quality problem into a confidently-scored unknown quality problem. Both
moves feel like rigor and supply none. **The one idea worth keeping if you forget everything
else**: read a hundred failures before you write a metric, and never trust a judge you have not
measured against a human on the exact question you are asking it.

**Cross-cutting big ideas, taught here and reused for the rest of this curriculum's AI-evaluation
track**: `determinism-vs-emergence` -- measurement is how you govern a stochastic system, not how
you eliminate its stochasticity; `correctness-vs-pragmatism` -- the goal of everything in this
course is a defensible decision procedure, not a proof of correctness; `abstraction-and-its-cost`
-- every score, however carefully validated, is still a lossy projection of what you actually care
about, and knowing what that projection drops is part of using it responsibly.

> **Scope guard -- deep evals vs. the light gate.**
> [Evaluating AI Output -- Essentials](../evaluating-ai-output-essentials/overview.md) owns
> "notice that quality changed": a fixed dataset, deterministic scorers, a pass rate, and
> before/after comparison. This course owns everything that requires **explaining why** or
> **defending the measurement itself**: failure taxonomies, criteria derived from observed failure
> modes, judges validated against measured human agreement, judge-scope reliability, trajectory
> and process scoring for agents, and merge-blocking CI gates justified against a measured noise
> floor. If a technique needs an agreement number with a confidence interval, it belongs here. If
> it needs only a fixed dataset and an assertion, it belongs in
> [Evaluating AI Output -- Essentials](../evaluating-ai-output-essentials/overview.md). Neither
> course re-teaches the other's material -- this course assumes the light gate as a prerequisite
> and never re-derives it, and the light gate never reaches for a judge, a taxonomy, or a CI gate.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 80 runnable, heavily annotated worked examples across
  Beginner (Examples 1-16: error analysis, open coding, a failure taxonomy, frequency-weighted
  prioritization, deriving and operationalizing criteria, and a human-labeled ground-truth set),
  Intermediate (Examples 17-34 and 51-62: building and validating an LLM-as-judge -- agreement
  measurement with a confidence interval, judge-scope reliability, model separation, every bias
  mode and its mitigation, pairwise vs. pointwise judging, rubric design and iteration, and
  reference-based vs. reference-free scoring), and Advanced (Examples 35-50 and 63-80: trajectory
  and process scoring for agents with step-level failure attribution, production-sourced dataset
  construction with red-team and contamination checks, the noise floor and a derived regression
  bar, tiered CI gates with a cost budget, closing the loop back into error analysis, and naming
  what a mature suite structurally cannot catch) -- plus a five-step capstone that builds a
  complete, defensible evaluation system end to end: error analysis and a taxonomy, derived
  criteria and a labeling guide, an adjudicated ground-truth set and a validated judge, trajectory
  and outcome scoring, and a noise-aware, tiered, cost-budgeted CI gate.

Every worked example is a complete, self-contained, fully type-annotated (strict `pyright`)
runnable file colocated under `learning/code/`, actually executed to capture its documented
output -- every printed number in this topic's pages is a genuine, captured transcript, never a
fabricated one, and every example runs fully offline against a local/mockable generator model and
a second, different mockable judge model.

- **[Drilling](./drilling/overview.md)** -- the spaced-repetition companion: recall Q&A across all
  28 concepts, applied problems, self-contained code katas, a self-check checklist, and
  elaborative-interrogation prompts.

## Concepts summary

The 28 concepts below are the full reference this topic's worked examples cite by `co-NN`; the
complete entry for each -- with its own "Why it matters" and "Verify it" pointers to specific
examples -- lives in [Learning -- Overview](./learning/overview.md#concepts).

- **co-01 · Error Analysis First** -- read failures before choosing a metric; the metric is an
  output of that reading, not an input to it.
- **co-02 · Open-Coding Failures** -- label failures with tags invented while reading, not with a
  pre-existing taxonomy.
- **co-03 · Failure Taxonomy** -- cluster open codes into a small set of named, frequency-counted
  failure modes.
- **co-04 · Frequency-Weighted Prioritization** -- fix and measure the modes that are common and
  costly, not the ones that are interesting.
- **co-05 · Derived Task-Specific Criteria** -- every criterion traces to an observed failure mode;
  one with no failure behind it is speculation.
- **co-06 · Criterion Operationalization** -- turn a named criterion into an instruction precise
  enough that two independent labelers agree.
- **co-07 · Human Labeling Protocol** -- a written guide, independent labelers, and a
  disagreement-resolution rule make human labels usable ground truth.
- **co-08 · Ground-Truth Set** -- a human-labeled reference every automated scorer is validated
  against.
- **co-09 · LLM-as-Judge** -- a model prompted to score another model's output against an
  operationalized criterion.
- **co-10 · Judge-Human Agreement Is Mandatory** -- a judge's value is exactly its measured
  agreement with human labels; unmeasured, it is decoration.
- **co-11 · Judge Scope Reliability** -- agreement is per-question, not global.
- **co-12 · Judge Model Separation** -- the judge is never the model that generated the output,
  because of correlated blind spots.
- **co-13 · Judge Bias Modes** -- position, verbosity, self-preference, and score compression are
  systematic and must be tested for.
- **co-14 · Pairwise vs. Pointwise Judging** -- "which is better" is usually more reliable than
  "score this 1-5"; the trade is a required baseline.
- **co-15 · Rubric Design for Judges** -- short, binary, single-question rubrics agree with humans
  far better than long scoring sheets.
- **co-16 · Judge Recalibration** -- agreement decays with model, prompt, or data-distribution
  changes, so it is re-measured on a schedule.
- **co-17 · Reference-Free vs. Reference-Based** -- scoring against a gold answer versus scoring
  the output on its own terms; each fails differently.
- **co-18 · Trajectory Evaluation** -- for agents, the tool-call sequence is an object of
  evaluation distinct from the final answer.
- **co-19 · Outcome vs. Process Scoring** -- a right answer via a wrong path is a latent failure;
  scoring both catches what either alone misses.
- **co-20 · Multi-Step Failure Attribution** -- locating the causing step is what makes an agent
  eval actionable.
- **co-21 · Eval Dataset Construction** -- source cases from production traffic, red-team probes,
  and regression reports, with deliberate taxonomy coverage.
- **co-22 · Dataset Contamination and Leakage** -- cases leaked into a prompt, cache, or fine-tune
  produce scores that do not transfer.
- **co-23 · Eval in CI** -- the suite's result is a merge decision, not a report.
- **co-24 · Regression Bar and Noise Floor** -- the merge-blocking threshold must sit above the
  suite's own run-to-run noise.
- **co-25 · Cost of Evaluation** -- judge calls and repeat runs cost real money and wall time; the
  suite is budgeted and tiered.
- **co-26 · Tiered Eval Suites** -- a fast deterministic tier on every commit, a full judged tier on
  merge, mirroring unit/integration/e2e.
- **co-27 · Evals Drive Improvement** -- the loop closes only when failing cases route back into
  error analysis.
- **co-28 · What Evals Cannot Catch** -- novel harms, distribution shift, and anything absent from
  the dataset remain invisible; an eval suite bounds risk, it does not eliminate it.

## Tensions & trade-offs -- when NOT to reach for this

- **Rigor vs. shipping speed**: a validated judge with measured agreement, a human-labeled
  ground-truth set, and a tiered CI suite is weeks of work. For a prototype nobody depends on, the
  light gate is the correct stopping point and this course is over-engineering. Reach for this
  when a regression would reach users, cost money, or be hard to detect by hand.
- **Judge cost vs. judge value**: judged evals multiply the cost of every CI run and add their own
  noise. A cheap deterministic scorer that agrees with humans 90% of the time beats an expensive
  judge that agrees 92% -- measure both before assuming the judge wins.
- **More criteria vs. usable signal**: every criterion added dilutes attention and adds noise. A
  suite with twenty criteria nobody reads is worse than three criteria that map to the three most
  frequent observed failure modes.
- **When NOT to use LLM-as-judge at all**: if a deterministic scorer can answer the question
  (schema validity, exact match, presence of a required citation), a judge adds cost, variance,
  and a new thing to validate for no gain. Judges are for questions deterministic scorers
  genuinely cannot reach.
- **When NOT to gate CI on evals**: gating on a suite whose noise floor exceeds the regression bar
  produces random build failures, which teaches the team to ignore the gate -- strictly worse than
  no gate. Measure the noise floor first (co-24).

## Lineage -- why it beat the alternative

The first wave of LLM evaluation borrowed academic benchmarks wholesale -- leaderboard tasks and
reference-overlap metrics designed to compare research systems, not to catch product regressions.
They lost because they measured a distribution nobody's users were drawn from, and because a
benchmark's score cannot tell a team which of their failures to fix. The second wave swung to
LLM-as-judge and mostly repeated the error in a new form: adopting a judge without ever measuring
it against a human on the specific question being asked, which produces scores that are precise,
cheap, reproducible, and unvalidated. What won is the practice this course teaches -- the same
order of operations qualitative research settled on decades ago: look at the data first, code the
failures openly, cluster them into a taxonomy, derive criteria from what you actually saw, then
and only then automate, validating every automated scorer against human labels and reporting the
agreement rather than asserting it. The agent-era addition is genuinely new: once a system takes
many steps, the trajectory becomes an object of evaluation in its own right, because a right
answer via a wrong path is a failure waiting for a different input. This course is the library's
single owner of that material -- it absorbs the evaluation treatments previously scattered across
`creating-ai-powered-apps`, `agentic-ai`, and `agent-orchestration-subagents-and-observability`
(all three `[Unverified]` not yet present in the AyoKoding course library on disk, so no link is
given here), each of which now forward-links here rather than teaching a fourth parallel version.

## Accuracy notes

> Dated per this topic's own accuracy-note discipline: every volatile, version-pinned, or
> contested fact below is flagged or dated here rather than stated unqualified in the stable spine
> above.

- 2026-07-26 -- **durable spine**: error-analysis-before-metrics, deriving criteria from observed
  failure modes, validating a judge against human labels, reporting agreement rather than
  asserting it, and gating merges on a measured regression bar are methodology. None of them
  depend on a model, vendor, or framework, and none has changed as models improved.
- 2026-07-26 -- Anthropic's published guidance is to "use a different model to evaluate than the
  model used to generate," and its eval principles are "Be task-specific... Automate when
  possible... Prioritize volume over quality." Source:
  [Anthropic -- Develop your tests](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests)
  (source: Anthropic -- Develop your tests (the "use a different model to evaluate than the
  model used to generate" guidance, and the three principles "Be task-specific", "Automate when
  possible", "Prioritize volume over quality", all quoted verbatim) --
  https://platform.claude.com/docs/en/test-and-evaluate/develop-tests ; accessed 2026-07-22) --
  re-verify the wording if this course is revised.
- 2026-07-26 -- LangSmith's trajectory evaluation examines "the exact sequence of messages,
  including tool calls," scored either by a deterministic trajectory-match evaluator (with
  Strict/Unordered/Subset/Superset modes) or an LLM judge. Treat the **trajectory-vs-outcome
  distinction as durable spine** and the **named product as volatile**. Source:
  [LangSmith -- Trajectory evals](https://docs.langchain.com/langsmith/trajectory-evals)
  (source: LangSmith -- Trajectory evaluation ("the exact sequence of messages, including tool
  calls"; scored by a trajectory-match evaluator or an LLM judge) --
  https://docs.langchain.com/langsmith/trajectory-evals ; accessed 2026-07-22) -- re-verify at
  the next revision.
- 2026-07-26 -- **volatile, product sunset**: OpenAI's Evals platform becomes read-only
  2026-10-31 and shuts down 2026-11-30. This topic's own "Read more" list and worked examples do
  not depend on this platform remaining available; re-verify or replace any citation to it after
  that date.
- 2026-07-26 -- **contested, taught as contested**: whether pairwise or pointwise judging tracks
  human preference more reliably is not settled. Liusie et al. 2023
  ([arxiv.org/abs/2307.07889](https://arxiv.org/abs/2307.07889)) and Liu et al. 2024
  ([arxiv.org/abs/2403.16950](https://arxiv.org/abs/2403.16950)) find pairwise comparisons track
  human preference more closely; a COLM 2025 study
  ([arxiv.org/abs/2504.14716](https://arxiv.org/abs/2504.14716)) finds pointwise absolute scores
  more robust to adversarial manipulation -- pairwise preferences flip in about 35% of adversarial
  cases, compared to only 9% for absolute scores. This course presents both findings side by side
  (Examples 28 and 54) rather than smoothing them into one conclusion.
- 2026-07-26 -- **contested, taught as contested**: there is no settled industry threshold for
  "good enough" judge-human agreement, and this topic does not repeat the unsourced claim that
  judge-human agreement exceeds human-human agreement. Zheng et al. 2023, "Judging LLM-as-a-Judge
  with MT-Bench and Chatbot Arena" ([arxiv.org/abs/2306.05685](https://arxiv.org/abs/2306.05685)),
  names position bias, verbosity bias, and self-enhancement bias as systematic judge failure
  modes, and reports GPT-4 judge agreement with human preference at "over 80%... the same level of
  agreement between humans" -- phrased in this course as MATCHING human-human agreement, not
  exceeding it. This topic teaches the learner to report their own measured agreement statistic
  and confidence interval and justify their own threshold against their decision's stakes, rather
  than citing a magic number or an unsourced percentage.

## Read more

- **Designing Machine Learning Systems** -- Chip Huyen (2022). Evaluation as a production
  discipline, including the argument for measuring against your own distribution rather than a
  benchmark's.
- **Anthropic -- Create strong empirical evaluations** -- the task-specific / automate / volume
  principles and the different-model-as-judge guidance this course's judge chapter builds on.
  <https://platform.claude.com/docs/en/test-and-evaluate/develop-tests>
- **OpenAI -- Evals** -- the schema data-spec + testing-criteria + golden-JSONL shape as a second
  reference implementation (read-only 2026-10-31, shut down 2026-11-30 -- see Accuracy notes
  above). <https://developers.openai.com/api/docs/guides/evals>
- **LangSmith -- Trajectory evals** -- the trajectory-versus-outcome distinction applied to
  agents; cite the durable distinction, treat the product surface as volatile.
  <https://docs.langchain.com/langsmith/trajectory-evals>
- **Zheng et al. 2023 -- Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena** -- the primary
  source for judge bias modes (position, verbosity, self-enhancement) and judge-human agreement
  measurement. <https://arxiv.org/abs/2306.05685>

---

Next: [Learning Overview](./learning/overview.md) →
