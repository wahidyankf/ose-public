---
title: "Overview"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Just Enough Bash](../just-enough-bash/learning/overview.md) -- every
  worked example in this topic is driven from a terminal, and you should already be comfortable
  with the `git` CLI's surrounding shell habits (piping, exit codes, editing a file, rerunning a
  command); [Software Testing](../software-testing/learning/overview.md) -- this topic wraps
  a workflow _around_ the testing discipline that topic teaches (the test pyramid, coverage, TDD's
  red-green-refactor loop), it does not re-teach testing mechanics; and a working app from Pass 1,
  e.g. [Backend Essentials](../backend-essentials/learning/overview.md), to actually practice
  the workflow on -- every example below assumes you have _something_ small and real to commit,
  branch, review, and ship.
- **Tools & environment**: a macOS/Linux terminal; **`git`**; **Python 3.x** with a linter/formatter
  (`ruff`, the de facto consolidated formatter+linter as of Ruff 0.15) and `pytest`; the **`gh`**
  CLI (GitHub's official CLI, v2.96.0 as of this topic's last accuracy check); a CI-runner mental
  model (GitHub Actions YAML is shown throughout, run locally where noted).
- **Assumed knowledge**: basic `git add`/`commit`; running tests from the CLI; editing YAML.

## Why this exists -- the big idea

**The problem before the solution**: code that works on your machine is not engineering -- without
version control, tests, review, and an automated gate, a growing team and a growing codebase regress
faster than they progress. **The one idea worth keeping if you forget everything else**: every
practice in this topic exists to make change _safe and reversible_ -- small commits, green tests,
and an automated gate let you move fast _because_ you can always undo, not despite moving fast.

**Cross-cutting big ideas, taught here and then reused for the rest of this curriculum**:
`correctness-vs-pragmatism` -- CI gates, coverage numbers, and code review are risk management, not
bureaucracy, and dialing their strictness to the actual blast radius of a change is a professional
judgment call, not a fixed rule; `coupling-vs-cohesion` -- trunk-based development and small,
single-concern pull requests cut the _merge_ coupling between people the same way a clean module
boundary cuts the _compile-time_ coupling between components.

This topic teaches the professional practices that turn code into engineering: version control
discipline (the branching-model trade-off, Conventional Commits, Semantic Versioning, a curated
changelog), collaboration mechanics (code-review etiquette, right-sized pull requests, the full
`gh pr create`/`review`/`view` loop), the delivery pipeline (a lint-test-build CI pipeline, required
quality gates, `pre-commit` hooks), engineering hygiene applied day to day (the test pyramid as a
review lens, coverage as a signal rather than a target, systematic hypothesis-driven debugging,
continuous refactoring, the boy-scout rule, tracked technical debt), documentation and decisions
as artifacts (docs colocated with code, Architecture Decision Records), and team practices
(estimation pitfalls and the #NoEstimates critique, pairing and mobbing, a written Definition of
Done, feature flags as a release/deploy decoupler, and blameless incident response) -- all grounded
in 54 worked examples, split between runnable command sequences / CI config and non-code artifacts
(changelogs, ADRs, postmortems, memos), plus an intra-topic capstone that runs a small Python
feature through the full professional workflow end to end.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 54 worked examples across Beginner (Examples 1-18:
  Conventional Commits, SemVer, changelog discipline, the trunk-vs-feature-branch decision, PR
  hygiene and the `gh pr` workflow, a minimal CI pipeline, quality gates, and `pre-commit`),
  Intermediate (Examples 19-43: the test pyramid and coverage as a review lens, systematic
  debugging and `git bisect`, refactoring cadence and the boy-scout rule, tracked technical debt,
  documentation-as-code, ADRs, estimation pitfalls, pairing/mobbing, Definition of Done, feature
  flags, and blameless incident response), and Advanced (Examples 44-54: composing the practices
  together -- a full commit-history cleanup, a derived SemVer bump and changelog, a `pre-commit`-
  backed CI gate, a coverage-plus-review double gate, a full PR review cycle, a debt-driven refactor
  behind a flag, a postmortem that produces a tracked debt item, an ADR required by the Definition
  of Done, severity-labeled review comments, a pairing-vs-solo trade-off memo, and a bisect-driven
  review) -- plus an intra-topic capstone that TDD-builds a small feature, gives it a clean
  conventional-commit history, gates it with a lint-test-build CI pipeline, and records the decision
  in an ADR.

Every worked example is self-contained and deterministic: every code/config example is genuinely
runnable (or, for `git`/`gh` transcripts, a mocked, hand-constructed, internally consistent, and
plausible transcript -- no live network call and no dependency on a real GitHub repository or pull
request existing), and every non-code artifact (a changelog entry, an ADR, a postmortem, a memo) is
a real, complete document in the exact format it names.

---

Next: [Learning Overview](./learning/overview.md) →
