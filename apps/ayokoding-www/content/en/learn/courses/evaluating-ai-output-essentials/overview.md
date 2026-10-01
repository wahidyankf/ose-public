---
title: "Overview"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: `creating-ai-powered-apps` (a working model call, structured output) --
  `[Unverified]` this course is not yet present in the AyoKoding course library on disk, so no link
  is given here; **software-testing** ([15 · Software Testing](../software-testing/learning/overview.md))
  gives the assertion mindset -- fixtures, test doubles, and the habit of writing down what "pass"
  means before running anything -- that this course's scorers and runner directly reuse; **just
  enough python** ([4 · Just Enough Python](../just-enough-python/learning/overview.md)) is assumed
  for reading and writing fully type-annotated Python.
- **Tools & environment**: a macOS/Linux terminal; Python 3.13 (a local or mockable model so every
  example runs offline, with no paid API key required); `pytest`; a plain JSONL file as the dataset
  store -- no eval framework is required anywhere in this topic, deliberately; a text editor.
- **Assumed knowledge**: calling a model and parsing its output; writing a `pytest` assertion;
  reading and writing JSON/JSONL from Python.

## Why this exists -- the big idea

**The problem before the solution**: the first LLM feature always looks like it works, because the
first thing anyone tries is the thing they had in mind. Without a fixed set of cases and a fixed
way of scoring them, every subsequent prompt tweak is a vibe check -- the engineer cannot
distinguish an improvement from a regression, and neither can anyone reviewing the change. **The
one idea worth keeping if you forget everything else**: before you tune anything, write down ten
cases and how you will score them -- an eval you can run twice beats an opinion you can argue about
forever.

**Cross-cutting big ideas, taught here and reused for the rest of this curriculum's AI track**:
`determinism-vs-emergence` -- a stochastic component still needs a pass/fail contract; a single
run's pass rate is not yet evidence, so this course insists on running twice before trusting a
number; `correctness-vs-pragmatism` -- this course establishes "good enough", measurably, not
proof of correctness. Ten cases catch gross regressions and nothing subtler, and that is the
intended trade, not an oversight.

This topic is **deliberately small in scope** -- twelve concepts, not twenty-four. It installs the
smallest honest feedback loop a learner can run the moment they have one working LLM call: write
down what "good" means, collect a handful of real cases, score them the same way twice, and put a
number on a change before shipping it.

> **Scope guard -- light gate vs. deep evals.** This course teaches you to _notice_ that output
> quality changed. It does not teach you to _explain why_ or to _defend the measurement_. Error
> analysis, LLM-as-judge with measured human agreement, judge reliability, and CI gating are **out
> of scope here** -- if a technique requires computing an agreement statistic, deriving criteria
> from observed failure modes, or defending a judge's scope, it belongs to
> [`evaluating-ai-systems-in-depth`](../evaluating-ai-systems-in-depth/overview.md) -- which runs
> after agents, not here. If a technique is "write the expectation down, run it twice, compare," it
> belongs here.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 46 runnable, heavily annotated worked examples, grouped
  by theme rather than by fixed Beginner/Intermediate/Advanced bands (this topic's concepts are
  concept-centric, not syntax-tiered):
  - **Theme A -- [Why You Cannot Eyeball It](./learning/theme-a-why-you-cannot-eyeball-it.md)** (ex
    01-10) -- a vibe check silently fails, a written criterion two people score identically, a
    fixed ten-case dataset committed to version control, and its honest limits.
  - **Theme B -- [Scorers That Cost Nothing](./learning/theme-b-scorers-that-cost-nothing.md)** (ex
    11-22) -- exact match, normalized match, substring, regex, numeric tolerance, and schema
    validation, each returning a verdict plus a reason, dispatched through a scorer registry.
  - **Theme C -- [The Runner and the Number](./learning/theme-c-the-runner-and-the-number.md)** (ex
    23-34) -- a minimal eval runner, the pass rate as the headline number, run-it-twice flake
    detection, tokens/cost/latency captured in the same run, and results committed as a
    reproducible artefact.
  - **Theme D -- [Using the Gate on a Real Change](./learning/theme-d-using-the-gate-on-a-real-change.md)**
    (ex 35-46) -- baseline vs. candidate comparison, a change that helps AND hurts, regression
    cases sourced from real bug reports, and the concrete triggers for graduating to the deep
    course.
  - **[Capstone](./learning/capstone/overview.md)** -- the complete light eval gate: a versioned
    fourteen-case dataset, a five-scorer registry, a twice-run runner reporting pass rate alongside
    cost and latency, and a comparison report that accepts one real prompt change and rejects
    another.

Every worked example is a complete, self-contained, fully type-annotated (DD-39) runnable file
colocated under `learning/code/` (or, where a diagram is the clearer medium, a captioned,
WCAG-accessible Mermaid diagram under `learning/artifacts/`), actually executed to capture its
documented output -- every printed number in this topic's pages is a genuine, captured transcript,
never a fabricated one.

- **[Drilling](./drilling/overview.md)** -- the spaced-repetition companion: recall Q&A across all
  twelve concepts, applied problems, self-contained code katas, a self-check checklist, and
  elaborative-interrogation prompts.

## The 12 concepts this topic covers

- **co-01 · Why a vibe check fails** -- trying the feature by hand tests the case you already
  imagined, so it cannot detect a regression on the cases you did not. Example 1.
- **co-02 · What "good" means, written down** -- a criterion you can hand to another person and get
  the same verdict from is the minimum unit of an eval. Examples 3-4, 20.
- **co-03 · The ten-case dataset** -- a small fixed set of real inputs, versioned in the repo, is
  the whole gate; the fixed-ness matters more than the size. Examples 5-10, 19, 40-41.
- **co-04 · Golden outputs** -- for cases with one right answer, storing the expected output turns
  the eval into an ordinary test. Examples 10-11.
- **co-05 · Deterministic scorers** -- exact match, schema validation, substring/regex, and numeric
  tolerance are scorers that cost nothing and never drift. Examples 11-20, 23, 25, 34.
- **co-06 · Schema validation as an eval** -- for structured output, "does it parse against the
  schema" is the cheapest and highest-value eval there is. Examples 16-17, 22.
- **co-07 · Pass rate as the headline number** -- the fraction of cases passing is the single
  number you compare across runs; one number beats a wall of output. Examples 23-25, 28, 32-38.
- **co-08 · Run it twice** -- a stochastic system gives different answers to the same input, so a
  single run's pass rate is not yet evidence; re-running is the cheapest reliability check
  available. Examples 2, 26-29.
- **co-09 · Before-and-after comparison** -- the eval's job is comparing a candidate change against
  the current baseline, not certifying absolute quality. Examples 6-7, 33, 35-38, 41-42.
- **co-10 · Regression cases from real bugs** -- every failure a human reports becomes a permanent
  case in the set; this is how the dataset earns its coverage. Examples 8, 39-40.
- **co-11 · Cost and latency in the same run** -- record tokens, cost, and latency alongside the
  score, because a quality win paid for with a 4x cost is a decision, not a free lunch. Examples
  30-32.
- **co-12 · Knowing this gate is not enough** -- a pass rate on ten cases cannot tell you _why_ the
  failures happen or whether a subjective scorer is trustworthy; recognising that boundary is what
  sends you to the deep course. Examples 9, 21-22, 43-46.

## Tensions & trade-offs -- when NOT to reach for this

- **Ten cases vs. a real dataset**: ten cases catch gross regressions and nothing subtler. That is
  the intended trade -- a gate you actually run beats a rigorous eval suite you postpone until
  "after the prototype." Do not mistake a green ten-case run for evidence that the feature is good.
- **Deterministic scorers vs. the things that matter**: exact match and schema validation are free
  and stable, but most of what users care about (is this summary faithful? is this tone right?) is
  not exact-matchable. This course deliberately stops at what deterministic scorers can reach
  rather than reaching for a judge it cannot yet validate.
- **When NOT to reach for this**: if the output is genuinely single-valued and deterministic
  downstream -- a classifier over a fixed label set, an extraction with one correct answer -- an
  ordinary test suite is the right tool, not eval machinery. Reaching for eval machinery there adds
  ceremony without adding information.
- **When this gate is not enough**: the moment you are asked "why is it failing?" or you want to
  score something subjective, this course is out of road. Go to
  [`evaluating-ai-systems-in-depth`](../evaluating-ai-systems-in-depth/overview.md).

## Accuracy notes

> Dated per this topic's own accuracy-note discipline: every volatile, version-pinned, or
> market-dependent fact below is flagged or dated here rather than stated unqualified in the stable
> spine above.

- 2026-07-26 -- **durable spine**: the discipline of fixing a dataset, fixing a scoring rule, and
  comparing two runs predates LLMs entirely and is independent of any model, vendor, or framework.
  Nothing in this course's spine names a product.
- 2026-07-26 -- Anthropic's published eval principles are "Be task-specific ... Automate when
  possible ... Prioritize volume over quality"; the "prioritize volume" guidance is the one that
  most surprises engineers coming from hand-written unit tests. Source:
  [Anthropic -- Develop your tests](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests)
  (source: Anthropic -- Develop your tests (three principles quoted verbatim: "Be task-specific",
  "Automate when possible", "Prioritize volume over quality") --
  https://platform.claude.com/docs/en/test-and-evaluate/develop-tests ; carried over from this
  course's syllabus source, accessed 2026-07-22) -- re-verify the wording if this course is
  revised.
- 2026-07-26 -- `[Unverified]` **volatile, accuracy-note only**: eval-framework names, hosted eval
  products, and their schemas change fast. This course deliberately uses a plain JSONL file and
  `pytest` so nothing in the spine depends on a framework.
- 2026-07-26 -- `[Unverified]` **volatile**: `PRICE_PER_TOKEN` in this topic's capstone runner is a
  placeholder snapshot for the worked example only -- a real project reads its per-token cost from
  live config, never a hard-coded constant.
- 2026-07-26 -- **volatile, version-pinned**: this topic's "Confirm your toolchain" check and every
  worked-example transcript were captured against **Python 3.13.12** and **pytest 9.1.1** --
  already-superseded patch releases by the time you read this. The stable spine intentionally states
  only the unpinned **Python 3.13** minor version; re-verify the printed transcripts if re-running
  the examples against a later patch.
- 2026-07-26 -- **volatile, product sunset**: `learning/overview.md`'s "Read more" list cites
  OpenAI's Evals docs for its golden-JSONL + testing-criteria shape. OpenAI has announced this
  platform becomes read-only 2026-10-31 and shuts down 2026-11-30 -- re-verify or replace this
  citation at the next revision after that date.

---

Next: [Learning Overview](./learning/overview.md) →
