# 008 — Decision Records

Each record gives the choice, two alternatives, prior art, trade-offs, consequences, and what would make us
revisit it. Series decisions (numbered 1 to 42, made by the user on 2026-10-09) are inputs, not re-decided
here; a record cites them where they bind. The user made no choice about the items below, so each is a
default taken on the user's behalf, recorded so it can be reversed; none is an open question for the user.

## D1 — Audit in Place; Do Not Rewrite

- **Selected:** each of the 32 courses keeps its slug, title, mode, category, weight, subject, and place in
  every path. The audit closes the defect classes in place and adds only what the definition of done needs.
- **Alternatives:** (a) rewrite the weak courses from scratch, as plans 06 to 09 do for outlines and filler;
  (b) leave the courses and only add `run.yaml` files.
- **Prior art:** series decision 28 splits the work into "rewrite from scratch" (outlines, filler) and
  "audit" (the other 111); the 32 courses here are measured on 2026-10-09 as real courses with 4,522 to 78,115
  words, 21 of them short of their floor.
- **Trade-offs:** an audit keeps what is good (the healthiest courses need little), but a course with 4,710
  words for 78 examples is closer to a rewrite than an audit. Option (b) would leave courses that fail the
  definition of done.
- **Consequences:** briefs list defects, not outlines; the size class decides the effort; a course that
  cannot meet its mode after 2 cycles is BLOCKED (D2), not rewritten into another shape.
- **Revisit when:** the first audit shows a course where more than half of the existing text is replaced; the
  user may then prefer to treat it as a rewrite plan.

## D2 — The Mode of Each Course Is Fixed

- **Selected:** each course keeps the mode it has (by-example, primer, annotated-concept, no-code, capstone),
  with a reason in the brief. A maker may not switch it.
- **Alternatives:** (a) let the audit move a course to the mode that suits it best; (b) move all languages
  to By Example for uniformity.
- **Prior art:** `format` is set in every course's frontmatter by plan 03; the adapter defines separate floors
  per mode; plan 06 chose its modes per course by the kind of material.
- **Trade-offs:** a fixed mode can leave a course awkward (for example `software-engineering-practices` is
  Annotated Concept with 54 plain examples), but changing it changes the reader's contract and every floor.
- **Consequences:** the mode checker and the gate use the declared mode; the completion test reads the same
  `format` from the registry.
- **Revisit when:** a gate returns `needs-decision` that the mode itself caused.

## D3 — Eleven Waves in Prerequisite Order

- **Selected:** 11 waves of at most three courses, each course after its in-plan prerequisites, with heavy and
  light courses mixed ([006](./006-execution-model.md#waves-in-prerequisite-order)).
- **Alternatives:** (a) one wave per family (tools, languages, infrastructure); (b) heaviest first.
- **Prior art:** plans 06 and 07 batch by prerequisite level; the repository runs three background agents
  (N+1, N = 3).
- **Trade-offs:** family order would put all languages in a row, which loads the heaviest CI cost together
  and breaks prerequisite order (Dart needs TypeScript). Heaviest first would front-load the riskiest
  courses but start courses before their prerequisites are final.
- **Consequences:** the first push (after wave 3) already carries the largest new-unit counts (Rust, Kotlin,
  Dart), so the CI-budget finding arrives early.
- **Revisit when:** a BLOCKED prerequisite blocks more than one dependent in the same wave.

## D4 — One Commit per Course, Four Checkpoint Pushes

- **Selected:** one commit per DONE course, made by the coordinator, plus separate commits for harness or
  workflow changes; pushes after waves 3, 6, 9, and 11, with a draft PR opened at the first.
- **Alternatives:** (a) one commit per wave, as plan 07 does; (b) one commit for the whole plan.
- **Prior art:** plan 06 commits per course; plan 07 per wave, because its courses are gated together.
- **Trade-offs:** 32 commits are more to read than 11, but each course is independent, already shipping, and
  may be BLOCKED or deferred on its own; a per-course commit can be reverted without touching a neighbour,
  and a PR of 8,000 to 10,000 files is only reviewable commit by commit.
- **Consequences:** every commit leaves `test:quick` green (the registry row, the baseline entry, and the
  course land together).
- **Revisit when:** commit count slows the push leak review or CI beyond the wave budget.

## D5 — No Clang Toolchain

- **Selected:** C and C++ units compile with `gcc` (`-std=c17`, `-std=c++17`). Where a lesson uses Clang
  (Example 3 of `just-enough-c`), it is rewritten to GCC and the prose says Clang compiles the same source.
  CMake units use the `gcc` image if it has `cmake`; otherwise they become Makefile builds that teach the
  same idea, with the CMake files shown as illustrations (spike SP4).
- **Alternatives:** (a) add a `clang` toolchain; (b) keep Clang examples as illustrations.
- **Prior art:** plan 05's catalog lists Clang as a known gap and accepts it.
- **Trade-offs:** a Clang toolchain costs a FULL-mode PR (D9) for a handful of units; teaching GCC loses
  Clang-specific diagnostics.
- **Consequences:** two C courses change an example and a few build files; no catalog change.
- **Revisit when:** the series adds a deterministic Clang image for another reason.

## D6 — Gradle Is Modelled by Default

- **Selected:** the Gradle units of `build-automation-and-task-runners` (about 12) are a Python task-graph
  model with the Groovy and Kotlin DSL shown as illustrations. A `gradle` toolchain is added only if spike
  SP7 passes D9's rule.
- **Alternatives:** (a) add the toolchain now; (b) drop the Gradle examples.
- **Prior art:** plan 05 names Groovy as a known validator gap; the course's code tree contains committed
  Gradle wrapper scaffolding (49 files) that is a layout finding.
- **Trade-offs:** a model teaches the build graph, not Gradle's DSL; dropping the examples would cut a tool
  the course promises.
- **Consequences:** the lesson says in one sentence that these examples model Gradle (D12).
- **Revisit when:** D9's budget rule passes on measured figures.

## D7 — Kotlin Coroutines Use the Standard Library by Default

- **Selected:** the coroutine preview in `just-enough-kotlin` uses only `kotlin.coroutines` primitives and
  `sequence`; the `kotlinx.coroutines` lines are illustrations (up to 8). A pinned jar is chosen only if
  spike SP6 passes. Plan 09's hash-locked jar recipe on the `java` entry gives a route that needs no catalog
  change: a `jars.lock` in the course, if the merged `kotlin` entry can use the recipe. If a catalog change is
  needed instead, D9's rule decides.
- **Alternatives:** (a) use a locked jar now; (b) remove the preview.
- **Prior art:** the course calls its coroutine section "deliberately short"; the existing code resolves
  `kotlinx-coroutines-core:1.11.0` through Gradle, which the sandbox cannot do offline.
- **Trade-offs:** the standard-library form is less like real Android code, but the course is a preview.
- **Consequences:** `ktlint` validates style; no catalog change.
- **Revisit when:** a later course needs structured concurrency in Kotlin and D9 passes.

## D8 — Keep the Deterministic CDP Simulator

- **Selected:** `browser-automation-with-cdp` keeps its in-process Python simulator of the DevTools protocol.
  A real browser launch (`--remote-debugging-port`) is an illustration.
- **Alternatives:** (a) run real Chromium in the harness; (b) replace the simulator with recorded sessions.
- **Prior art:** the course already has 59 simulator-based example folders; plan 05 has no browser toolchain.
- **Trade-offs:** a simulator cannot show a real browser's quirks; real Chromium is rejected for
  determinism (timing, fonts, GPU), image size, and flakiness.
- **Consequences:** the course says plainly where a real browser would differ (defect X18).
- **Revisit when:** the catalog gains a deterministic browser image.

## D9 — Toolchain Additions Are Default NO-GO

- **Selected:** no toolchain is added unless the four-part budget rule in
  [004](./004-toolchain-additions-and-ci-cost.md#the-toolchain-budget-rule) passes on measured figures; an
  unmeasured item counts as a no. Four candidates exist (`gradle`, a Kotlin coroutine jar, `caddy`,
  `systemd-analyze`); all start as NO-GO with a fallback. The plan reuses plan 09's `java` jar recipe and
  `clojure` entry as merged and adds none of its own.
- **Alternatives:** (a) add the four now for the most real units; (b) add none and never revisit.
- **Prior art:** plan 05 puts any change under `apps/ayokoding-cli/toolchains/` in FULL mode; plan 08 treats CI
  time as a measured quantity with a ladder.
- **Trade-offs:** real units teach better than models, but FULL mode on every push of a 2,571-unit PR is the
  largest CI cost of the series, and the fallbacks are honest.
- **Consequences:** about 47 units are models or illustrations, labelled; the CI projection stays at the
  courses' own cost.
- **Revisit when:** the measured FULL-run projection fits the budget, or plan 14 or a later plan adds a
  toolchain for another reason.

## D10 — CI Ladder With a Scaled Shard Count and a 120-Minute Timeout

- **Selected:** the response ladder in [004](./004-toolchain-additions-and-ci-cost.md#the-response-ladder)
  extends plan 08's with rung 2b (shard count `[1]`, `[1..4]`, or `[1..8]` by selected units, up to 8, for
  every mode) and a conditional rung 2c (a unit-weighted split). Rung 3 raises the `since` timeout from 60 to
  120 minutes. The binding rule is the longest shard at or below 75 percent of the applicable timeout.
- **Alternatives:** (a) split the plan into several PRs (forbidden: one plan, one PR); (b) lower the example
  counts or merge units to fit (forbidden: a course is never weakened).
- **Prior art:** plan 08's rung 2 (shards by units) and rung 3 (timeout 120); plan 05's note that the shard
  count is a workflow input that can be lowered.
- **Trade-offs:** eight runners per push is more of a shared pool than four; runner minutes stay the same, and
  wall time falls.
- **Consequences:** at planning figures, four shards fail even with the best split (96.1 minutes against
  90), eight shards fit under 120 (55.4 with the real split). The rung is applied before the first push that
  needs it.
- **Revisit when:** Phase 1 measures per-invocation seconds that make four shards fit, or the pool cannot
  supply eight runners.

## D11 — Diagram and Code-Share Targets

- **Selected:** diagrams 30 to 50 for By Example (the adapter's band); at least 10 for Annotated Concept,
  capstone, and no-code (plan 06's floor); no count band for Primer. Code-bearing share for Annotated Concept
  at least 27 of 45 (plan 06's 60 percent).
- **Alternatives:** (a) require 30 to 50 diagrams in primers too; (b) set no diagram floor for Annotated
  Concept.
- **Prior art:** the adapter's bands are for By Example only; plan 06 applied the 10-diagram and 60-percent
  rules to its Annotated Concept courses.
- **Trade-offs:** a primer with no band may carry few diagrams (Go and Java have none today); the mode
  checker still judges usefulness, and 15 primers would need a measured basis for a number.
- **Consequences:** `X20` appears in 9 courses (diagram or structure shortfalls); no primer fails a count.
- **Revisit when:** plans 12 or 13 measure primer diagrams and want a shared band.

## D12 — Honesty About Models, Static Checks, and Illustrations

- **Selected:** a modelled or statically checked example says so in one plain sentence beside its fence. A
  fence is an illustration only for tools the harness cannot host, pseudo-code, deliberately broken
  snippets, and files the toolchain cannot parse; budgets per course total 252 fences.
- **Alternatives:** (a) mark every non-runnable fence an illustration without a budget; (b) forbid models and
  require real tools only.
- **Prior art:** plan 05's illustration marker and its note that content gates judge illustrations; the
  coverage report counts them.
- **Trade-offs:** a budget needs judgement per course; the gate reads the brief's number.
- **Consequences:** `examples coverage` shows each course's illustration count, and the briefs carry the
  budgets.
- **Revisit when:** an audit finds a budget wrong; the brief is edited in the ledger and the reason recorded.

## D13 — Completion Test First, With a Registry

- **Selected:** a Unit-level content-shape test with a registry of audited courses; each course's row is
  added RED at CP-1 and committed GREEN at CP-6 ([007](./007-testing-strategy.md#test-first-for-content)).
- **Alternatives:** (a) a test that follows a path manifest, as plan 06's does; (b) no test, relying on the
  gates and the harness.
- **Prior art:** plan 06's and plan 07's completion tests; series decision 37 (checks in tested TypeScript).
- **Trade-offs:** a registry is edited per course by the coordinator; the mechanical floors are guarded after
  the plan archives, while judged properties stay with the gates.
- **Consequences:** plans 12 and 13 reuse the registry; the final scenario ("the registry lists every
  course of this plan") is proven both ways by removing a row locally.
- **Revisit when:** a manifest comes to list all audited courses.

## D14 — Static Mode Only for Existing Reasons; OpenTofu Is Named

- **Selected:** static mode uses the reasons the catalog has (`cloud`, `cluster`, `ios`), and `cloud-and-iac`
  and `bare-metal-virtualization` use `tofu` commands, with the Terraform and OpenTofu relationship stated once
  (plan 05's decision D3).
- **Alternatives:** (a) add a new static reason; (b) keep Terraform commands and validate with a different
  tool.
- **Prior art:** plan 05's survey counts Terraform 29 files and OpenTofu 5; this plan counts 88 and 3 mentions
  in `cloud-and-iac`.
- **Trade-offs:** rewriting 88 mentions is mechanical; the lessons stay true for both tools.
- **Consequences:** `cloud-and-iac` is the one course whose harness mode is "static and real".
- **Revisit when:** plan 05's catalog changes its static reasons.

## D15 — Prerequisites: Re-Check Only, With One Exception Path

- **Selected:** plan 02's revised lists stand; CP-1 re-checks them against the lessons; a change is made only
  if the rubric requires it and the integrity tests stay green. A change that would alter the AI Engineer
  core ([005](./005-prerequisites-ai-core-and-integrity.md#the-ai-engineer-path-core)) is recorded as
  `needs-decision` and not made.
- **Alternatives:** (a) re-derive all 32 lists; (b) freeze the lists with no re-check.
- **Prior art:** plan 02's rubric and closure rules; plan 08's duty that any change to the AI core updates the
  manifest in the same PR; plan 08's shrink of the core from 25 to 12 on purpose.
- **Trade-offs:** a rewrite can create a dependency by accident, so the re-check runs again at the end; a
  frozen list could drift from the text.
- **Consequences:** expected result for the three AI-core courses is no change.
- **Revisit when:** a re-check finds an edge that fails the rubric in more than three courses.

## D16 — Planning Figures Are Not Estimates; Measure and Fix the Root

- **Selected:** every CI figure in this plan is a planning figure for sizing, replaced by Phase 0 and 1
  measurements; no time estimate appears for people or agents. A defect found in the harness is fixed in
  `apps/ayokoding-cli` with a regression test first (plan 05's M11); a course check is never loosened.
- **Alternatives:** (a) estimate durations and rely on them; (b) work around harness defects in the courses.
- **Prior art:** the repository's "No Time Estimates" principle; plan 08's run-time budget with planning
  figures and a Phase 0 measurement.
- **Trade-offs:** measured figures arrive in Phase 1, after the plan is written, so the plan carries a ladder
  instead of a promise.
- **Consequences:** the briefs mark their CI cost as a planning figure.
- **Revisit when:** a measured figure differs from its planning figure by more than a factor of two; the
  ladder decision is re-taken.
