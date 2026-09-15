# Product Requirements Document: PR Review Cycle Scout + Cycle-Number + Type-Soundness

## Product Overview

Three additions to the live PR Review Quality Gate pipeline, landed **identically in all four OSE
repos** (`ose-public`, `ose-primer`, the private sibling, `beaver-nest`) as one plan because they touch the
same small file set in each:

1. A `**Cycle**: N of {total}` field on every Consolidated Review Header.
2. A new pipeline stage-0 agent, `pr-review-scout-maker`, that owns risk-tier classification,
   specialist-set selection, shared-context-brief assembly, and the prior-cycle dismissal read —
   duties `pr-review-synthesis-maker` currently performs itself as pre-fan-out sub-duties.
3. A ninth discipline, type-soundness, owned by a new `pr-review-types-maker` specialist, scoped
   across TypeScript, Rust, F#, and C#.

## Personas

- **The maintainer** — sole reviewer/merger of all four repos' own PRs. Reads consolidated reviews on
  GitHub, wants to see cycle progress and trust that type-level defects are covered the same way
  security or logic defects already are — in whichever of the four repos the PR happens to be in.
- **`pr-review-fixer`, in each repo** — consumes whatever that repo's `pr-review-synthesis-maker`
  posts; unaffected in its own charter, but now triages findings that may originate from a ninth
  discipline.
- **A future contributor**, in any of the four repos, reading that repo's own
  `pr-review-disciplines.md` or `pr-review-quality-gate.md` to understand what the pipeline does
  before extending it further (e.g. adding a tenth discipline later) — expects the same shape in
  whichever repo they happen to be working in.

## User Stories

1. As the maintainer, I want every posted review to state which cycle (of the fixed 3) produced it,
   so I can tell at a glance whether cycle 3's findings are new or a repeat of cycle 1's.
2. As the maintainer, I want risk-tier classification and specialist selection to be a visible,
   dedicated pipeline stage rather than a buried sub-duty of the coordinator, so the pipeline's own
   diagrams and docs describe what actually happens without a reader having to infer it from
   sub-headings inside `pr-review-synthesis-maker.md`.
3. As the maintainer, I want a reviewer whose job is explicitly "is this type-safe and soundly typed"
   across all four of this repo's production languages, so a change that compiles but is unsoundly
   typed (a broad `any`, a non-exhaustive match, a panic-prone `unwrap()`) gets flagged the same way
   a security or logic defect already would.
4. As a future contributor, I want the discipline table, the pipeline diagrams, and the loop
   algorithm to stay internally consistent after this plan lands — no doc says "eight specialists"
   in one place and "nine" in another, in any of the four repos.
5. As the maintainer working across all four repos, I want the same three enhancements landed
   identically in `ose-public`, `ose-primer`, the private sibling, and `beaver-nest`, so a PR's review
   experience does not depend on which repo it happens to be in — while still respecting each repo's
   own pre-existing wording divergences (e.g. the private sibling's `AGENTS.md` names disciplines
   explicitly rather than saying "eight") rather than forcing artificial uniformity where none existed
   before.

## Acceptance Criteria (Gherkin)

```gherkin
Feature: Cycle number on the Consolidated Review Header

  Scenario: A cycle-1 review states its cycle number
    Given the PR Review Quality Gate workflow is running cycle 1 of a 3-cycle loop against a PR
    When pr-review-synthesis-maker posts the cycle's consolidated review
    Then the review's Consolidated Review Header contains the line "**Cycle**: 1 of 3"
    And this holds whether the cycle's risk tier is trivial, lite, or full

  Scenario: A cycle-3 review states a different cycle number than cycle-1's review
    Given cycle 1's consolidated review on a PR already carries "**Cycle**: 1 of 3"
    When cycle 3 runs and pr-review-synthesis-maker posts its own consolidated review
    Then the cycle-3 review's header contains "**Cycle**: 3 of 3", not "**Cycle**: 1 of 3"
    And both reviews remain independently readable on the PR — the field changes per-cycle, it is
      never a running total mutated in place

  Scenario: The header is missing the cycle field before this plan lands (negative control)
    Given the pre-plan pr-review-synthesis-maker.md Consolidated Review Header template
    When grep -c "Cycle" is run against the header block
    Then it returns 0
    # This scenario documents the falsifiable "before" state this plan's Phase 2 changes; after
    # Phase 2, the same grep against the same header block must return >= 1.

Feature: pr-review-scout-maker as pipeline stage 0

  Scenario: Scout classifies a trivial PR and hands off zero specialists
    Given a PR changes 6 lines across 2 files, touching no security-sensitive path
    When pr-review-scout-maker runs at the start of a cycle
    Then it classifies the PR as risk tier "trivial"
    And it selects zero discipline specialists for the fan-out
    And pr-review-synthesis-maker performs the single generalist pass itself, using the shared-context
      brief scout assembled, exactly as the pre-plan trivial-tier behavior already specified

  Scenario: Scout classifies a full PR touching a security-sensitive path regardless of size
    Given a PR changes 8 lines across 1 file, and that file is under .github/workflows/
    When pr-review-scout-maker runs
    Then it classifies the PR as risk tier "full" despite the line/file count falling under the
      trivial thresholds
    And it selects all nine discipline specialists for the fan-out
    # Security-sensitive-path override forces full regardless of size — unchanged from pre-plan D12,
    # now owned by scout instead of synthesis-maker.

  Scenario: Scout respects a prior-cycle human dismissal
    Given a human explicitly replied "won't fix" on a review thread in cycle 1
    When pr-review-scout-maker assembles the shared-context brief for cycle 2
    Then the brief marks that finding's thread as human-dismissed
    And no specialist fanned out in cycle 2 re-raises that same finding
    And pr-review-synthesis-maker's cycle-2 consolidated review does not include that finding

  Scenario: Without scout, classification was synthesis-maker's own sub-duty (negative control,
    pre-plan state)
    Given the pre-plan pr-review-synthesis-maker.md agent file
    When its "Pre-Fan-Out Duties (D12 / D13)" section is inspected
    Then it is the sole agent performing risk-tier classification, context assembly, and the
      dismissal read
    And no separate pr-review-scout-maker.md file exists
    # After this plan's Phase 3, pr-review-synthesis-maker.md's own Pre-Fan-Out Duties section is
    # removed (moved verbatim in spirit to pr-review-scout-maker.md), and the file exists.

Feature: Type-soundness discipline

  Scenario: A TypeScript change with an unjustified `any` is flagged
    Given a full-tier PR's diff includes a new function signature typed with `any` where the actual
      value's shape is fully knowable from its call site
    When pr-review-types-maker reviews the diff
    Then it raises a finding citing the file:line, a confidence score >= 80, and a severity per the
      Criticality Levels Convention
    And the finding survives pr-review-synthesis-maker's reasonableness-filter (it is not a nitpick
      already caught by a linter rule the project runs)

  Scenario: A change that merely fails to compile is NOT this discipline's finding (negative control)
    Given a PR's diff introduces a TypeScript type error that fails `tsc --noEmit`
    When pr-review-types-maker reviews the diff
    Then it does not raise a finding for the compile failure itself
    And the compile failure is instead a CI-red build failure, caught by the existing build gate, not
      by any PR-review specialist
    # This is grey-zone ruling (g): "compiles vs. is sound" — mechanical build failure is out of
    # every specialist's charter, not just types'; CI already gates it.

  Scenario: A Rust `unsafe` block with no justification comment is flagged
    Given a full-tier PR's diff adds an `unsafe` block with no comment explaining the invariant it
      upholds
    When pr-review-types-maker reviews the diff
    Then it raises a finding scoped to type/memory-soundness, not routed to pr-review-security-maker
      (whose charter owns secrets/injection/untrusted-input, not unsafe-block justification)

  Scenario: A well-typed, behaviorally-wrong function is NOT this discipline's finding
    Given a PR's diff contains a function whose types are fully sound but whose logic returns the
      wrong value for a documented edge case
    When both pr-review-types-maker and pr-review-logic-maker review the diff
    Then pr-review-types-maker raises no finding (the types are sound; behavior is not its charter)
    And pr-review-logic-maker raises the finding instead, per its existing correctness charter

  Scenario: The discipline does not appear before this plan lands (negative control)
    Given the pre-plan pr-review-disciplines.md Eight Reviewer Disciplines table
    When grep -ci "type-soundness" is run against the table
    Then it returns 0
    # After Phase 1, the same grep against the same table must return >= 1.

Feature: Internal consistency after the sweep, independently in each of the four repos

  Scenario: No doc states a stale specialist count, in this repo
    Given all edits in Phase 1, Phase 2, and Phase 3 have landed in ONE repo's own checkout
    When grep -rn "eight discipline\|eight specialist" repo-governance/ .claude/agents/ AGENTS.md is
      run inside that repo
    Then it returns 0 matches
    And the same search for "nine discipline\|nine specialist" returns >= 1 match in that repo's own
      pr-review-disciplines.md and pr-review-quality-gate.md
    # This scenario is executed FOUR times, once per repo's own delivery track — a pass in one repo's
    # checkout is not evidence of a pass in another's, since each repo's copy is edited independently.

  Scenario: The catalog and its mirror stay in sync, in this repo
    Given pr-review-scout-maker.md and pr-review-types-maker.md have been created under
      .claude/agents/ in ONE repo's own checkout
    When npm run generate:bindings && npm run validate:sync is run inside that repo
    Then it exits 0
    And that repo's own .opencode/agents/pr-review-scout-maker.md and
      .opencode/agents/pr-review-types-maker.md exist with content generated from, not hand-written
      independently of, their .claude/ source
    # Executed four times, once per repo — each repo's own generate:bindings/validate:sync run is
    # independent tooling, not a shared cross-repo mechanism.

  Scenario: The four repos land the same discipline count and pipeline shape (negative control:
    partial rollout)
    Given this plan's delivery tracks for all four repos have completed
    When "nine discipline" or "nine specialist" is grepped against each repo's own
      pr-review-disciplines.md
    Then all four repos return >= 1 match
    And none of the four repos is left on the pre-plan eight-discipline shape while the others move to
      nine — a partial rollout across repos is treated as an incomplete delivery, not a partial success
```

## Product Scope

**In scope**: everything named in [README.md's Scope section](./README.md#scope), applied
independently in all four repos (`ose-public`, `ose-primer`, the private sibling, `beaver-nest`).

**Explicitly out of scope** (a reader might reasonably expect these in scope; they are not):

- Changing the fixed 3-cycle ceiling, the CI-green hard gate, or any of the five hardened merge
  preconditions, in any repo — this plan adds a header field and two agents; it does not touch
  loop-exit, escalation, or merge-precondition logic anywhere.
- Changing which four disciplines make up the `lite` tier's 4-specialist set, in any repo —
  type-soundness joins only `full`-tier, per the resolved design decision, in all four.
- Retroactively adding cycle numbers to reviews already posted on already-merged PRs, in any repo —
  the field applies going forward only, everywhere.
- A `plans/ideas/` two-pager or `plans/backlog/` plan for the deferred persistent-metrics-log idea —
  if that becomes worth pursuing later, it gets its own idea brief at that time, not a stub created
  here.
- Introducing a shared/mirrored source for the pipeline across the four repos (so a future change
  lands once instead of four times) — each repo keeps its own independent copy, exactly as it did
  before this plan; that would be a materially larger, separately-scoped change.

## Product-Level Risks

- **Doc-drift risk during the sweep, quadrupled**: `pr-review-disciplines.md` (26 "eight"
  occurrences in each repo) and `pr-review-quality-gate.md` (6 occurrences in `ose-public`,
  `ose-primer`, `beaver-nest`; **5** in the private sibling — see
  [brd.md's baseline](./brd.md#current-state-baseline-mechanically-verified-2026-08-05)) are dense,
  heavily cross-linked documents in every repo; a mechanical find-and-replace would misfire on
  occurrences describing an unrelated historical fact (e.g. "the eight discipline specialists"
  describing the original monolith-to-split cutover, which stays historically accurate even after a
  ninth discipline joins later — that sentence describes what happened at cutover, not the current
  count), and running the same sweep four times quadruples the chance of one repo's sweep missing an
  edge case the others' catch. **Mitigation**: each repo's own Phase 1/2 delivery items require
  reading each occurrence in that repo's own files in context before deciding whether it becomes
  "nine" or stays as historical narration — never a blind `sed`, and never a diff copy-pasted from
  one repo's result into another's.
- **Agent-file bloat risk, in each repo**: `pr-review-synthesis-maker.md` is currently the largest
  agent file in the pipeline in every repo (~23.7 KB in `ose-public`, sizes vary slightly per repo).
  Removing its D12/D13 sections shrinks it; the new `pr-review-scout-maker.md` needs its own complete
  charter (tools, model justification, hard rules, SUPPRESS-equivalent scope guard) rather than a
  thin stub — sized comparably to a discipline specialist (13-16 KB), not copy-pasted wholesale from
  the removed sections without adaptation, in each of the four repos independently.
- **Risk (new to the 4-repo scope): silent partial rollout.** Four independent delivery tracks with
  no dependency between them means one track could complete while another stalls (e.g. blocked on a
  merge-precondition or a CI flake), leaving the repo family in a mixed eight-and-nine-discipline
  state indefinitely. **Mitigation**: [delivery.md's terminal Finalize
  phase](./delivery.md#phase-7-finalize-across-all-four-repos) explicitly checks all four repos'
  completion state before the plan is considered done — it does not close out on the strength of only
  `ose-public`'s track finishing.

## Related Documentation

- [README.md](./README.md), [brd.md](./brd.md), [tech-docs.md](./tech-docs.md), [delivery.md](./delivery.md)
- [Criticality Levels Convention](../../../repo-governance/development/quality/criticality-levels.md)
- [PR Reviewer-Discipline Convention](../../../repo-governance/development/quality/pr-review-disciplines.md)
