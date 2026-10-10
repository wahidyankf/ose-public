---
title: "Overview"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Just Enough Bash](../../just-enough-bash/learning/overview.md) -- every
  worked example in this topic is driven from a terminal, and you should already be comfortable
  with the `git` CLI's surrounding shell habits (piping, exit codes, editing a file, rerunning a
  command); [Software Testing](../../software-testing/learning/overview.md) -- this topic
  wraps a workflow _around_ the testing discipline that topic teaches (the test pyramid, coverage,
  TDD's red-green-refactor loop), it does not re-teach testing mechanics; and a working app from
  Pass 1, e.g. [Backend Essentials](../../backend-essentials/learning/overview.md), to
  actually practice the workflow on -- every example below assumes you have _something_ small and
  real to commit, branch, review, and ship.
- **Tools & environment**: a macOS/Linux terminal; **`git`**; **Python 3.x** with a linter/formatter
  (`ruff`, the de facto consolidated formatter+linter as of Ruff 0.15) and `pytest`; the **`gh`** CLI
  (GitHub's official CLI, v2.96.0 as of this topic's last accuracy check); a CI-runner mental model
  (GitHub Actions YAML is shown throughout, run locally where noted).
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
judgment call; `coupling-vs-cohesion` -- trunk-based development and small, single-concern pull
requests cut the _merge_ coupling between people the same way a clean module boundary cuts the
_compile-time_ coupling between components.

## Confirm your toolchain

Every `git`-only example in this topic runs with nothing beyond a local `git` install; every `gh`
example is shown as a mocked, hand-constructed transcript (below), so `gh auth login` is not
required to follow along -- but it is worth confirming your own toolchain if you plan to run the
commands for real against your own fork:

```text
$ git --version
git version 2.55.0
$ gh --version
gh version 2.96.0 (2026-07-02)
$ python3 --version
Python 3.13.14
$ python3 -m ruff --version
ruff 0.15.17
$ python3 -m pytest --version
pytest 9.1.1
$ pre-commit --version
pre_commit 4.6.0
```

## How this topic's examples are organized

- **[Beginner](./beginner.md)** (Examples 1-18) -- Conventional Commits (a `fix`, a scoped `feat`,
  and a breaking `!`/`BREAKING CHANGE:` change), the SemVer bump each one implies, a curated
  changelog entry versus the raw commit log, the trunk-vs-feature-branch decision, self-review
  before opening a pull request, the full `gh pr create`/`review`/`view` loop, right-sizing a pull
  request, a minimal lint-test-build CI pipeline, required-check quality gates, and installing and
  running the `pre-commit` framework.
- **[Intermediate](./intermediate.md)** (Examples 19-43) -- reading the test pyramid's shape during
  review, coverage as a signal rather than a target (and the Goodhart's-law failure mode of
  mandating 100%), systematic hypothesis-driven debugging and `git bisect`, refactoring folded into
  feature work versus a big-bang rewrite, the boy-scout rule, a tracked technical-debt log and its
  prioritization, docstring-driven API docs, documentation shipped in the same PR as the code it
  documents, when a change earns an ADR, estimation pitfalls and the #NoEstimates critique, pairing
  and mobbing, a written Definition of Done (and the "done" vs. "done-done" distinction), feature
  flags as a release/deploy decoupler, and blameless incident response.
- **[Advanced](./advanced.md)** (Examples 44-54) -- composing the practices together: cleaning up a
  messy commit history into a conventional one, deriving a SemVer bump and changelog directly from
  commits, wiring `pre-commit` as a required CI stage, a coverage-plus-review double gate, a full
  PR review cycle end to end, paying down tracked debt behind a feature flag, turning a postmortem
  into a tracked debt item, requiring a linked ADR as a Definition-of-Done item, severity-labeled
  review comments, a pairing-vs-solo trade-off memo, and a bisect-driven debugging pass during
  review.
- **[Capstone](./capstone/overview.md)** -- TDD a small Python feature on a feature branch, craft a
  clean conventional-commit history from a messy sequence, wire a lint-test-build CI pipeline that
  gates the change (and fails on a deliberately broken commit), and record the decision in an ADR.

Every worked example is self-contained and deterministic: every code/config example is genuinely
runnable (or, for `git`/`gh` transcripts, a mocked, hand-constructed, internally consistent, and
plausible transcript -- no live network call and no dependency on a real GitHub repository or pull
request existing), and every non-code artifact (a changelog entry, an ADR, a postmortem, a memo) is
a real, complete document in the exact format it names, colocated under `learning/code/` or
`learning/artifacts/` respectively.

## The 23 concepts this topic covers

- **co-01 · trunk-based-vs-feature-branch** -- short-lived branches integrated frequently to trunk
  trade release isolation for lower merge-conflict cost, and the right choice depends on team size
  and release cadence, not fashion. Examples 7, 40, 44.
- **co-02 · conventional-commits** -- the Conventional Commits format
  (`<type>[optional scope]: <description>`, an optional `!` and `BREAKING CHANGE` footer) encodes
  intent and severity directly in the commit message. Examples 1, 2, 3, 6, 44, 45.
- **co-03 · semantic-versioning** -- SemVer's MAJOR.MINOR.PATCH rule ties a version bump to the
  exact kind of API change: incompatible, backward-compatible addition, or backward-compatible fix.
  Examples 2, 3, 4, 45.
- **co-04 · changelog-discipline** -- a curated changelog using Keep a Changelog's
  Added/Changed/Deprecated/Removed/Fixed/Security categories, kept under an `Unreleased` heading,
  tells a human what changed -- distinct from the raw commit log. Examples 5, 6, 45.
- **co-05 · code-review-etiquette** -- a review names blocking issues versus nits, gives feedback
  promptly, and stays respectful of the author, per established reviewer/author guidance. Examples
  47, 48, 52.
- **co-06 · pr-hygiene-and-size** -- a pull request scoped to one concern and kept small (roughly a
  "reasonable" ~100-line bar) reviews faster, more thoroughly, and rolls back more safely than a
  sprawling one. Examples 8, 10, 11, 48.
- **co-07 · pr-workflow-with-gh-cli** -- creating, reviewing, and inspecting a pull request from the
  terminal (`gh pr create`/`gh pr review`/`gh pr view`) closes the review loop without leaving the
  CLI. Examples 9, 12, 13, 48, 54.
- **co-08 · ci-pipeline-stages** -- a minimal pipeline runs lint, then test, then build as ordered,
  gated stages so a failure stops early and cheaply. Examples 14, 46.
- **co-09 · quality-gates** -- a required check blocks a merge on failure, while a lower-value check
  should demote to a warning, so gates protect production without ossifying into pure ceremony.
  Examples 15, 16, 46, 47.
- **co-10 · pre-commit-hooks** -- a `.pre-commit-config.yaml`-driven hook framework catches a class
  of defect before it ever reaches a commit or a CI run. Examples 17, 18, 46.
- **co-11 · test-pyramid-as-practice** -- day-to-day, the pyramid's "many fast, few slow" shape is a
  design choice a reviewer can name and flag when a change skews it. Example 19.
- **co-12 · coverage-as-signal-not-target** -- a coverage percentage is a proxy for testedness, not
  proof of correctness, and turning it into a hard target invites assertion-free tests. Examples
  20, 21, 47.
- **co-13 · systematic-debugging-practice** -- debugging as a practice is a disciplined loop
  (hypothesize, change one thing, observe) plus bisection to halve the search space, applied before
  reaching for a fix. Examples 22, 23, 24, 54.
- **co-14 · refactoring-cadence** -- continuous small refactors, folded into ordinary feature work,
  beat a deferred big-bang rewrite for both risk and cost. Examples 25, 27, 49.
- **co-15 · boy-scout-rule** -- leave the code you touch slightly cleaner than you found it, as a
  tiny incidental improvement, not a separate crusade. Examples 25, 26.
- **co-16 · technical-debt-tracking** -- naming a shortcut's quadrant (Fowler's prudent/reckless x
  deliberate/inadvertent) and logging it with an owner keeps debt a visible, prioritizable backlog
  item instead of a silent tax. Examples 28, 29, 49, 50.
- **co-17 · documentation-as-code** -- docs colocated with the code, versioned in the same repo, and
  reviewed in the same PR resist the drift a separate wiki invites. Examples 30, 31.
- **co-18 · adr-as-engineering-practice** -- a hard-to-reverse, architecturally significant code
  decision earns a linked ADR; a routine one does not. Examples 32, 33, 51.
- **co-19 · estimation-pitfalls-and-noestimates** -- hour-based estimates fake a precision that does
  not exist, and the #NoEstimates critique asks whether some decisions can be made well without
  estimating at all. Examples 34, 35.
- **co-20 · pairing-and-mobbing** -- two (pairing) or a whole team (mobbing/ensemble) working one
  problem at a shared keyboard trades solo throughput for shared context and fewer defects, worth it
  for high-risk or unfamiliar work. Examples 36, 37, 53.
- **co-21 · definition-of-done** -- an explicit, shared checklist (tests pass, docs updated,
  reviewed) gates when work actually counts as finished, per the Scrum Guide's framing. Examples
  38, 39, 51.
- **co-22 · feature-flags-as-a-release-decoupler** -- a release toggle ships incomplete code to
  trunk disabled, decoupling deploy from release and enabling trunk-based development; ops/
  experiment/permission toggles serve different lifespans. Examples 40, 41, 49.
- **co-23 · incident-hygiene-and-blameless-response** -- detect, then mitigate, then root-cause an
  incident, and write it up in blameless, actor-neutral language that treats failure as systemic.
  Examples 42, 43, 50.

## Tensions & trade-offs -- when NOT to reach for this

- **Process vs velocity**: every gate -- review, CI, required coverage -- trades throughput for
  safety. On a solo throwaway prototype the full ceremony is pure drag; on a shared production
  system skipping it is how you get a 3am incident. The skill is dialing ceremony to the blast
  radius, not maxing or zeroing it.
- **Branching models**: trunk-based development optimizes for integration frequency and small
  diffs; long-lived feature branches or GitFlow optimize for release isolation but pay in merge
  hell. Team size, release cadence, and review culture decide -- neither is universally right.
- **Coverage as a target**: a coverage number is a proxy, and chasing 100% tests trivia and breeds
  assertion-free tests. Goodhart's law bites -- the moment a metric becomes a target it stops
  measuring what you wanted.

## Lineage -- why it beat the alternative

These practices are scar tissue from specific, expensive failures. Version control (SCCS to CVS to
SVN to Git) grew because coordinating shared code by hand lost work; continuous integration (Kent
Beck / XP, late 1990s) answered the "integration hell" of big-bang merges; conventional commits and
trunk-based development answered the review-and-conflict costs that long branches produced at
scale; DevOps / CI-CD (from roughly 2009) collapsed the dev-to-ops wall that made releases rare and
terrifying. The through-line: each practice removed one class of recurring failure -- so adopt a
practice for the failure it prevents, not because it's on a checklist.

---

← Previous: [Advanced Networking Drilling](../../advanced-networking/drilling/overview.md) &middot; Next: [Beginner Examples](./beginner.md) →
