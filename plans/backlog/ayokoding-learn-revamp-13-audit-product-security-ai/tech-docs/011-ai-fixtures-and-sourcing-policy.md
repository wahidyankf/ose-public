# 011 — AI Fixtures and the Sourcing Policy

The 14 AI engineering courses teach behaviour that two things make hard to keep honest: a language model gives a
different answer each time, and the products and protocols around it change every month. This page sets two policies.
The first makes every AI code example deterministic, offline, and free of credentials, so the harness can run it twice
and compare bytes. The second makes every claim that changes by the month carry a dated primary source at the time it
is written. Both are decision D10. The rule forms that outlive the plan are AF1 (gated) and AF2 (judged) in
[010](./010-rule-and-docs-impact.md#rule-inventory).

**Scope.** 13 of the 14 courses have code: `agent-context-and-memory`, `agent-orchestration-subagents-and-observability`,
`agent-permissions-and-sandboxing`, `agent-tools-and-mcp`, `agentic-ai`, `agentic-coding`, `creating-ai-powered-apps`,
`evaluating-ai-output-essentials`, `evaluating-ai-systems-in-depth`, `fine-tuning-and-adaptation`,
`inference-serving-and-model-deployment`, `statistics-for-evaluation`, and `the-agent-loop`. 12 of them call or stand in
for a model (all but `statistics-for-evaluation`); the policy fixtures serve those 12 and the scan covers all 13.
`product-patterns-for-probabilistic-systems` has no code, so only AI6 and AI7 apply to its prose.

**Authoring note.** No source was fetched while this plan was written. Every product or protocol name in the briefs is a
count from a keyword scan of the lessons, not a claim about the world. The policy below is what a maker does at
execution time, with network access to primary sources.

## AI1 to AI7

| Id  | Policy                                                                                                                                                                                                                                                                                                                                                                      | Why                                                                                                               | Enforced by                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| AI1 | **No network, no key.** A unit opens no socket, imports no hosted-model SDK, calls no model-download function, and reads no credential variable. The harness already runs every unit with `--network none`; no `run.yaml` carries a key                                                                                                                                     | A live call is non-deterministic, costs money, needs a secret, and fails offline                                  | The harness (network off); scenario "AI course code calls no hosted model and reads no credential" (rule AF1) |
| AI2 | **One scripted model per course.** The model is a `FakeModel` that returns replies from a script in order, or from a lookup keyed by a label. It lives in the course's code root and every unit imports it. The interface is the same in all 12 courses                                                                                                                     | A reader who moves between courses meets the same object; a fake that differs per unit hides what is being taught | CP-5 double run; the checklist compares the three copies of the kit                                           |
| AI3 | **Responses are authored data.** A reply is a stored file or a list in the unit, written by the maker, never captured from a live call and never described as what a named model returns. The set includes the failures to teach: malformed JSON, a refusal, a tool call with a bad argument, a truncated reply                                                             | A captured reply carries a date and a vendor claim; an authored one is just data                                  | The Content Quality Gate (rule TC1 wording)                                                                   |
| AI4 | **Deterministic by construction.** A counter clock (it returns 1, 2, 3, and so on), fixed seeds for every random draw, a whitespace token counter instead of a vendor tokenizer, sequence numbers in traces instead of times, a single-threaded loop with scripted tasks instead of free `asyncio` scheduling, and identifiers from a counter                               | The harness compares two runs byte for byte                                                                       | The double run at both CPU quotas (plan 05); plan 12's AU1                                                    |
| AI5 | **A small kit.** The kit uses only the standard library, stays under 150 lines, and sits directly under a code root so units read it at `..` (the unit's `run.yaml` sets `PYTHONPATH=..`). The three code roots of a course (`learning/code`, `drilling/code`, `learning/capstone/code`) each hold an identical copy                                                        | Plan 05 copies one code root into the container, so a file in another root is not visible                         | `cmp` of the copies at CP-5, recorded in the ledger                                                           |
| AI6 | **Honest labels.** The first example that uses the scripted model says in one plain sentence that the replies are scripted; a model is named by its role ("a small open-weight model"), not by a product, unless a dated Reference names the product; a hosted-SDK call is an illustration with a dated Reference; no fixture is presented as a measurement of a real model | A reader must not leave believing a fixture is a benchmark                                                        | The Content Quality Gate, through rule TC1                                                                    |
| AI7 | **Source what changes, on the day.** Every claim about a product, a model, a protocol revision, a price, a limit, or a law is verified against its primary source when the maker writes it, and is dated in the lesson and in the page's `## References`. A claim that cannot be sourced becomes a pattern with no changeable fact                                          | The courses age by the month; a dated source tells the reader how old a claim is                                  | The Content Quality Gate and `docs-validating-factual-accuracy` (rule AF2)                                    |

## The Scripted Model

The kit is small, so the interface is shown here once. A maker may add what the course needs; the names below stay.

```python
class Reply:                       # one scripted answer
    text: str                      # the model's text, or "" for a pure tool call
    tool_calls: list               # [{"name": ..., "arguments": {...}}], in order
    stop_reason: str               # "end_turn", "tool_use", "max_tokens", "refusal"
    usage: dict                    # {"input": n, "output": n}, counted by whitespace

class FakeModel:
    def __init__(self, script, by_label=None): ...   # script: list of Reply, by_label: dict
    def complete(self, messages, label=None): ...    # next Reply, or the one for the label
    # raises ScriptExhausted when the script is empty, so a runaway loop fails the same way twice
```

- **Where scripts come from.** A script is a literal list in the unit (short examples) or a JSON file in the unit's
  `responses/` folder (long ones), read with the standard library.
- **Failure shapes are part of the script.** A unit that teaches output validation scripts a malformed reply; a unit
  that teaches retries scripts a refusal followed by an answer; a unit that teaches budgets scripts a reply that never
  ends and expects `ScriptExhausted`. The fake never fails at random.
- **No second fake.** If a course needs a second shape (an embedding function, a judge), the kit gains a second class
  with the same style; it is still one file.
- **What the fake cannot show.** How a real model fails on a novel input. The lessons teach the failure as data and say
  so (AI6).

## Sourcing Fast-Moving Claims (AI7)

**What counts as fast-moving.** Anything a reader could look up and find changed within a year:

| Kind of claim                  | Examples in the lessons today (keyword scan, 2026-10-09)                                  | Primary source                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| A product or tool feature      | Hooks, skills, and terminal-UI features of an agent product; a framework's agent API      | The product's own documentation page and changelog                                       |
| A model name, limit, or price  | "GPT-4" once; two providers six times; context-window sizes                               | The provider's own model and pricing pages                                               |
| A protocol revision            | "MCP" 38 times in one course and 44 in another: transports, revision names, SDK names     | The protocol's specification repository or site, which carries its revision date         |
| A standard or law              | Evaluation and risk frameworks, regulation                                                | The publishing body's own page                                                           |
| A library or runtime behaviour | `vLLM` 7 times; Python 3.13 named in many courses (each brief's X18 line gives its count) | Release notes of the pinned version; or run it in a unit; the catalog pins Python 3.14.8 |
| A benchmark or statistic       | A leaderboard rank, a measured speed-up                                                   | The paper or dataset page. A "state of the art" claim is removed                         |

Stable concepts (attention, embeddings, retrieval, the bootstrap, a loop with a budget) need no source.

**The procedure for the maker, in order:**

1. **List.** CP-1 starts a list of the course's fast-moving claims. The packet adds to it as it writes. The list is in
   the ledger row.
2. **Fetch the primary source today.** Use the network tools of the agent environment. A blog, a news item, a forum post,
   or a summary produced by a model is not a primary source and can support a story but never a number.
3. **Write the claim with its date.** In the lesson: "as of October 2026" (the month of writing). In the page's
   `## References`: the title, the URL, the access date as `YYYY-MM-DD`, and the claim it supports.
4. **If the source cannot be reached, or two primary sources disagree**, the claim becomes a pattern ("providers limit
   the context window; check the current limit") or states the disagreement with both sources. A number is never kept
   without a source.
5. **Align versions.** Python version statements follow the catalog pin (3.14.8); a lesson that says 3.13 is corrected.
6. **Record it.** The ledger's "Sources checked" column gets the count and the date. The access date must be within 30
   days of the course's commit.

**Who re-checks.** The mode checker and `docs-validating-factual-accuracy` re-check facts in cycle 1; the Content
Quality Gate reads the References; a claim with no date or a stale one is a finding. A claim that would need a fetch the
gate cannot make is marked `needs-decision`.

**The freshness pass.** The waves run over weeks. In Phase 9 the coordinator lists the oldest access date of each AI
course. A course whose oldest date is more than 60 days old on that day gets one re-verification packet for its top
claims (one cycle, then the gate again once); the date and the result go into the ledger. Claims keep aging after the
merge. That is expected: the dates tell the reader how old a claim is, and a follow-up plan is the place for a refresh.

**What the policy does not do.** It does not check claims in CI (no network in the harness), it does not promise that a
claim is still true after the merge, and it does not ask for sources for stable concepts.

## Per-Course Fixture Plan

What the scripted model and its neighbours drive in each course. The shapes are the briefs' (CP-1 may refine them).

| Course                                            | What the fixtures drive                                                                                                        | Floor of own logic per unit (see FG2 in 007)            |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `the-agent-loop`                                  | Scripted replies that choose a tool or stop; a step budget; the existing `FakeModel` pattern becomes the convention            | A different loop rule, tool, or stop condition per unit |
| `agent-tools-and-mcp`                             | JSON-RPC 2.0 framing over in-process queues (no socket, no subprocess); fake tools with fixed outputs; a scripted client       | A different message, error code, or transport case      |
| `agent-context-and-memory`                        | A whitespace token counter; compaction and retrieval with a bag-of-words score; scripted summaries                             | A different eviction, summary, or retrieval rule        |
| `agent-permissions-and-sandboxing`                | A policy engine over data; a fake filesystem, a fake process table, and a fake network; a scripted model that proposes actions | A different rule, resource, or denial                   |
| `agent-orchestration-subagents-and-observability` | A single-threaded event loop with scripted tasks, a counter clock, and traces with sequence numbers                            | A different hand-off, failure, or trace check           |
| `agentic-ai`                                      | A scripted planner; fake browser and search tools with fixed pages                                                             | A different plan shape or tool failure                  |
| `agentic-coding`                                  | Recorded agent replies as text fixtures; one seeded random source; separate `typescript` and `shell` units                     | A different edit, review, or test scenario              |
| `creating-ai-powered-apps`                        | A bag-of-words embedding written in the course; retrieval; scripted answers; inert prompt-injection strings                    | A different prompt, retrieval, or guard case            |
| `evaluating-ai-output-essentials`                 | Scripted outputs to score with metrics in plain Python                                                                         | A different metric or failure class                     |
| `evaluating-ai-systems-in-depth`                  | Scripted judge replies; rubric and calibration arithmetic                                                                      | A different rubric or judge disagreement                |
| `fine-tuning-and-adaptation`                      | Models of training (loss curves by arithmetic, a tiny gradient-descent loop); no weights; adapters as shapes                   | A different data, schedule, or adaptation case          |
| `inference-serving-and-model-deployment`          | Batching, KV-cache budgets, and autoscaling simulated on a virtual clock with a fixed arrival trace                            | A different arrival trace or policy                     |
| `statistics-for-evaluation`                       | A hash-locked numeric stack with fixed seeds and a fixed resample count; no model                                              | A different test, interval, or sample size              |
