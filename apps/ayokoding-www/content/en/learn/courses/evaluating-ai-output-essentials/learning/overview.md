---
title: "Overview"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: `creating-ai-powered-apps` (a working model call, structured output --
  `[Unverified]` not yet present in the AyoKoding course library on disk); **software-testing**
  ([Software Testing](../../software-testing/learning/overview.md)) for the assertion mindset
  every scorer in this topic reuses; **just enough python**
  ([Just Enough Python](../../just-enough-python/learning/overview.md)) -- every script in this
  topic is fully type-annotated Python.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.13**; `pytest` for the `pytest`-suite
  worked example; a local or mockable model, so every example runs offline with no paid API key
  required. Every example is standard-library-only (`json`, `re`, `pathlib`, `statistics`, `zlib`,
  `typing`) plus `pytest` for the one example that expresses the eval as a test suite -- no eval
  framework is required anywhere in this topic, deliberately.
- **Assumed knowledge**: calling a model and parsing its output; writing a `pytest` assertion;
  reading and writing JSON/JSONL from Python.

## Why this exists -- the big idea

**The problem before the solution**: skip this gate and every prompt tweak is a vibe check -- the
engineer cannot distinguish an improvement from a regression, and neither can anyone reviewing the
change. **The one idea worth keeping if you forget everything else**: before you tune anything,
write down ten cases and how you will score them -- an eval you can run twice beats an opinion you
can argue about forever.

**Cross-cutting big ideas, taught here and reused for the rest of this curriculum's AI track**:
`determinism-vs-emergence` -- a stochastic component still needs a pass/fail contract;
`correctness-vs-pragmatism` -- this course establishes "good enough", measurably, not proof of
correctness.

## Confirm your toolchain

Every example in this topic is standard-library-only, plus `pytest` for the one example that
expresses the eval as an ordinary test suite:

```text
$ python3 --version
Python 3.13.12
$ python3 -c "import json, re, statistics, zlib, pathlib, typing; print('stdlib eval primitives OK')"
stdlib eval primitives OK
$ python3 -m pytest --version
pytest 9.1.1
```

_Captured 2026-07-26 -- these are point-in-time patch versions, not a durable claim; see this
topic's [Accuracy notes](../overview.md#accuracy-notes) if you are reading this after a later patch
has shipped._

Every worked example is a complete, self-contained, fully type-annotated (DD-39) runnable file
colocated under `learning/code/`, actually executed to capture its documented output -- every
printed value on this topic's pages is a genuine, captured transcript, never a fabricated one.
Every code-bearing worked example is independently runnable with no cross-example imports; the
capstone's four files are the sole exception, importing from one another as one small project.

## How this topic's examples are organized

- **[Theme A -- Why You Cannot Eyeball It](./theme-a-why-you-cannot-eyeball-it.md)** (Examples
  1-10) -- a hand-tuned prompt silently breaks a second case, the same input gets two different
  answers, a vague "make it better" becomes a written criterion two people would score identically,
  ten real inputs are assembled into a versioned JSONL file, a Mermaid diagram of the whole loop, a
  fixed set beats fresh random inputs for comparison, a dataset evolves across two commits with a
  visible diff, and a minimal four-field case schema.
- **[Theme B -- Scorers That Cost Nothing](./theme-b-scorers-that-cost-nothing.md)** (Examples
  11-22) -- exact match, normalized match, substring, regex, numeric tolerance, and schema
  validation, each returning a verdict plus a human-readable reason, dispatched through a
  name-keyed scorer registry, including a deliberately over-permissive scorer and its tightened
  fix, and a Mermaid diagram placing every scorer on a cost-vs-reach axis.
- **[Theme C -- The Runner and the Number](./theme-c-the-runner-and-the-number.md)** (Examples
  23-34) -- a minimal end-to-end eval runner, the pass rate as the single headline number, a
  per-case report, run-it-twice flake detection, an n-of-k pass criterion, tokens/cost/latency
  captured alongside the score, results committed as a byte-reproducible artefact, and the same
  eval re-expressed as an ordinary `pytest` suite.
- **[Theme D -- Using the Gate on a Real Change](./theme-d-using-the-gate-on-a-real-change.md)**
  (Examples 35-46) -- a baseline run, a candidate run, a diff report separating wins from
  regressions, a change that helps AND hurts (and why the net number hides it), a bug report turned
  into a permanent regression case, a model swap detected without code edits, a Mermaid diagram of
  where this gate sits relative to retrieval and agents, three questions this gate provably cannot
  answer, the concrete triggers for graduating to the deep course, and the capstone-scale worked
  example that ties every concept together.
- **[Capstone](./capstone/overview.md)** -- the complete light eval gate as one small, ordered
  project: a versioned fourteen-case dataset, a five-scorer registry, a twice-run runner reporting
  pass rate with cost and latency and flaky-case detection, and a comparison report that accepts a
  genuinely better prompt and rejects one that raises the pass rate while breaking a previously
  passing case.

## Read more

- **Designing Machine Learning Systems** -- Chip Huyen (2022). Practitioner-oriented treatment of
  evaluation as a production concern rather than a research one.
- **Anthropic -- Create strong empirical evaluations** -- the "be task-specific, automate when
  possible, prioritize volume over quality" principles this course's dataset discipline follows.
  <https://platform.claude.com/docs/en/test-and-evaluate/develop-tests>
- **OpenAI -- Evals** -- the golden-JSONL + testing-criteria shape, a second reference point for
  the plain-file dataset pattern taught here. <https://developers.openai.com/api/docs/guides/evals>
  (as of 2026-07-26: OpenAI has announced this platform becomes read-only 2026-10-31 and shuts down
  2026-11-30 -- see this course's [Accuracy notes](../overview.md#accuracy-notes))

---

← Previous: [Overview](../overview.md) &middot; Next: [Theme A: Why You Cannot Eyeball It](./theme-a-why-you-cannot-eyeball-it.md) →
