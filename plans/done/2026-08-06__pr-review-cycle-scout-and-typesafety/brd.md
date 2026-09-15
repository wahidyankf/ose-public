# Business Requirements Document: PR Review Cycle Scout + Cycle-Number + Type-Soundness

## Business Goal and Rationale

The PR Review Quality Gate pipeline (nine agents: eight discipline specialists +
`pr-review-synthesis-maker`, feeding `pr-review-fixer`, per the fixed 3-cycle loop) is the mandatory
pre-merge gate for every `*-to-pr` delivery in this repo. Its own
[Post-Cutover Monitoring Plan](../../../repo-governance/development/quality/pr-review-disciplines.md#post-cutover-monitoring-plan)
already commits to tracking precision, per-discipline acceptance rate, outdated rate, cost/latency per
risk-tier, and human-override rate — but two of those five metric families (cost/latency per
risk-tier, and the trend of "do later cycles find fewer issues") are unobservable from a posted review
today, because the review carries no cycle number. Separately, the eight-discipline table has no owner
for type-system soundness — a category of defect distinct from compiler errors (already CI-gated) and
from behavioral correctness (already `pr-review-logic-maker`'s job) — in a repo that ships production
code in four statically-typed languages.

The business goal is to close both gaps and to give the existing D12 risk-tier-classification duty its
own dedicated pipeline stage, so:

1. A maintainer scanning a PR's review history can immediately tell which cycle produced which
   finding, without cross-referencing GitHub timestamps against the workflow's fixed cycle count.
2. The opus-tier `pr-review-synthesis-maker` agent's remaining job (the highest-risk
   architecture-vs-correctness re-categorization boundary, plus dedup/filter/verify/post) is not
   also carrying the separate judgment call of "what should even be reviewed here" — a distinct
   concern this plan gives its own dedicated agent.
3. A stray `any`, a non-exhaustive `match`, an unjustified `unsafe` block, or a nullable-reference
   violation gets caught by a reviewer whose charter explicitly owns it, rather than falling through
   the gap between "the compiler didn't complain" and "no specialist's charter covers this."

## Current-State Baseline (Mechanically Verified, 2026-08-05)

All four counts below were re-verified live across all four repos on 2026-08-05, not assumed from
`ose-public` alone — the pipeline is independently duplicated per repo, so a baseline measured in one
repo is not evidence for another.

- **Pipeline agent count — identical across all four repos**: 10 files under
  `.claude/agents/pr-review-*.md` (8 discipline specialists + `pr-review-synthesis-maker` +
  `pr-review-fixer`), mirrored identically under `.opencode/agents/`, in `ose-public`, `ose-primer`,
  the private sibling, and `beaver-nest` alike. Verified: `ls .claude/agents/ | grep -c pr-review` → `10` in
  each repo.
- **"eight" mentions — three repos match, the private sibling diverges by one**:

  | Repo                | `pr-review-disciplines.md` | `pr-review-quality-gate.md` |
  | ------------------- | -------------------------- | --------------------------- |
  | `ose-public`        | 26                         | 6                           |
  | `ose-primer`        | 26                         | 6                           |
  | The private sibling | 26                         | **5**                       |
  | `beaver-nest`       | 26                         | 6                           |

  Verified via `grep -c eight repo-governance/development/quality/pr-review-disciplines.md` and the
  same against `repo-governance/workflows/pr/pr-review-quality-gate.md`, run separately in each repo.
  Every occurrence needs inspection during that repo's Phase 1/2 — not all become `nine` (some
  describe a fixed historical fact, e.g. "the eight discipline specialists" retiring the single
  monolith), so each occurrence is individually judged rather than blindly sed-replaced, and
  the private sibling's one-fewer count must be independently re-confirmed rather than assumed to be a
  stale measurement — its Phase 2 sweep expects to find 5, not 6.

- **No cycle-number field exists today, in any of the four repos**: `grep -A8 "^## Consolidated
Review Header" .claude/agents/pr-review-synthesis-maker.md | grep -c "\*\*Cycle\*\*"` (scoped to the
  header's own block, not the whole file) returns `0` in each repo — the five existing header fields
  (Risk tier, Specialists fanned out, Security-sensitive-path override, Diff coverage, Prior-cycle
  human dismissals) are identical across all four; none names the cycle.
- **No type-soundness discipline exists today, in any of the four repos**: `grep -ci
"type.soundness\|type.safety" repo-governance/development/quality/pr-review-disciplines.md` returns
  `0` in the discipline table itself, in every repo.
- **`AGENTS.md` PR Review Cycle wording diverges structurally, not just numerically** — this is the
  most consequential baseline finding for this plan's per-repo edit design:

  | Repo                | Wording pattern                                                                                                                                                                                                                 | Bytes measured (`wc -c AGENTS.md`) | Budget (warn / hard-fail) |
  | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------- |
  | `ose-public`        | Says "eight discipline pr-review-\*-maker specialists fan out to..." — a single swappable word                                                                                                                                  | 28,944 B                           | 27,000 / 30,000 B         |
  | `ose-primer`        | Same "eight discipline..." pattern as `ose-public`                                                                                                                                                                              | **29,852 B**                       | 27,000 / 30,000 B         |
  | The private sibling | **No literal "eight" at all** — names the eight disciplines explicitly by list (architecture, logic, governance, security, integrity, performance, docs, instruction) fanning out to synthesis-maker to fixer, no scout mention | 26,754 B                           | 27,000 / 30,000 B         |
  | `beaver-nest`       | Same "eight discipline..." pattern as `ose-public`                                                                                                                                                                              | 29,547 B                           | 27,000 / 30,000 B         |

  Verified via `grep -n "eight discipline"` and `grep -n -i "pr.review"` against each repo's
  `AGENTS.md`, and `wc -c AGENTS.md` in each repo, all on 2026-08-05. Two consequences drive Phase 4's
  per-repo design:
  1. **The private sibling's edit is not a word-swap.** Its bullet must gain `pr-review-types-maker` in the
     explicit specialist list and a `pr-review-scout-maker` mention ahead of the fan-out — a
     multi-word insertion, not `eight` → `nine`. This is net **byte-positive**, the opposite direction
     of the other three repos' edits, and the private sibling also currently has the most headroom (26,754 B,
     4,246 B under hard-fail) of the four — the one repo where a positive-byte edit is actually safe.
  2. **`ose-primer`'s headroom is razor-thin.** At 29,852 B it sits only **148 B below the 30,000 B
     hard-fail ceiling** — the tightest of any repo by a wide margin (`ose-public` has 1,056 B of
     headroom, `beaver-nest` has 453 B, the private sibling has 3,246 B before this plan's positive edit).
     `eight` → `nine` is still net `-1` byte there, same direction as `ose-public`/`beaver-nest`, so
     the edit itself does not worsen the margin — but this repo has effectively zero slack for any
     scope creep in that bullet (e.g. accidentally naming the two new agents inline), and its own
     Phase 4 gate must re-measure live rather than trust this snapshot, per the point-in-time caveat
     below.

- **These figures are point-in-time snapshots, not guaranteed pre-execution values, in every repo** —
  each repo's `AGENTS.md` is a live, frequently-edited file, so each track's own Phase 0 re-baseline
  step re-measures it immediately before that repo's execution begins and halts if it has drifted
  since this figure was recorded. **Constraint this imposes on this plan**: in `ose-public`,
  `ose-primer`, and `beaver-nest`, the `AGENTS.md` PR Review Cycle bullet edit must be
  net-neutral-to-negative in byte count relative to whatever each repo's re-measured baseline turns
  out to be; in the private sibling, the edit is net-positive by design (per the divergence above) and must
  be re-verified against that repo's own hard-fail ceiling explicitly rather than assumed safe from
  its current headroom alone. In no repo does the bullet grow to individually name
  `pr-review-scout-maker` or `pr-review-types-maker` — those stay documented in
  `.claude/agents/README.md` and `pr-review-disciplines.md`, which carry no such budget, in every
  repo.

## Business Impact

- **Faster trend-spotting on review effectiveness, in every repo.** A visible `Cycle: N of 3` on every
  posted review lets a human (or a future automated report) read a PR's review history top-to-bottom
  and see whether findings tapered off across cycles — the "healthy trend" signal each repo's own
  workflow Success Metrics section already names as worth tracking but currently cannot observe from
  the review text alone.
- **Cleaner separation of coordinator responsibilities, in every repo.** Splitting "what does this PR
  need reviewed" (scout) from "consolidate what was found" (synthesis-maker) follows the same
  single-responsibility reasoning that justified splitting the original `pr-review-maker` monolith
  into eight disciplines in the first place — applied one level up, to the coordinator's own two
  distinct jobs, identically wherever the pipeline runs.
- **A new defect category becomes catchable, in every repo.** Type-unsoundness that compiles cleanly
  (a broad `any`, an unjustified `unsafe`, a non-exhaustive match silently defaulting) is exactly the
  kind of defect that ships silently today because no specialist's charter names it and CI's build
  step, by definition, cannot catch what still compiles — true in `ose-public`, `ose-primer`,
  the private sibling, and `beaver-nest` alike, since all four ship the same four statically-typed
  languages.
- **Four repos converge on one pipeline shape instead of drifting.** Before this plan, all four repos
  already ran byte-for-byte-independent copies of the same eight-discipline design — a design decision
  or bugfix landing in only one repo (as this plan initially scoped) would have silently forked the
  pipeline's shape across the family. Landing all three enhancements in all four repos keeps them
  structurally aligned, the same posture the tri-repo `apps/rhino-cli` byte-identity boundary already
  enforces for a different piece of shared tooling.

## Affected Roles

- **The maintainer** (sole reviewer of all four repos' own PRs, `[AI]`-merge authority under the five
  hardened preconditions in each) — gains cycle-number visibility and a ninth discipline's worth of
  coverage on every future `full`-tier PR, in every repo.
- **`pr-review-synthesis-maker`, in each of the four repos** — loses the D12/D13 pre-fan-out duties
  (scoped down to its post-fan-out job only); gains one new header field to populate. Each repo's copy
  is edited independently; there is no shared source to edit once.
- **`pr-review-fixer`, in each of the four repos** — unaffected in charter; simply sees findings that
  may now originate from a ninth discipline and carry a cycle-number-stamped header.
- **Every future contributor reading any repo's `pr-review-disciplines.md` or
  `pr-review-quality-gate.md`** — reads an updated nine-discipline table and an updated ten-agent
  (soon twelve-agent) pipeline diagram/algorithm, consistently across all four repos rather than only
  the one this plan originally targeted.

## Business-Level Success Metrics

All four bullets below are verified **once per repo** — a metric holding in `ose-public` is not
evidence it holds in `ose-primer`, the private sibling, or `beaver-nest`.

- **Observable fact**: every consolidated review posted by `pr-review-synthesis-maker` after each
  repo's PR merges carries a `**Cycle**: N of {total}` header line. Verifiable by reading any
  post-merge PR's review comments, in each of the four repos.
- **Observable fact**: `pr-review-scout-maker` exists at `.claude/agents/pr-review-scout-maker.md`, is
  mirrored at `.opencode/agents/pr-review-scout-maker.md`, and is invoked as pipeline stage 0 in that
  repo's own delivering PR (dogfooded, per the `worktree-to-pr` Delivery Mode) — checked independently
  in all four repos.
- **Observable fact**: `pr-review-types-maker` exists at `.claude/agents/pr-review-types-maker.md`,
  mirrored identically, and appears in the `full`-tier specialist set the next time a `full`-tier PR
  runs that repo's pipeline — checked independently in all four repos.
- **Judgment call** (no baseline measured; this plan does not fabricate a precision/acceptance-rate
  number for a discipline that has not run yet, in any repo): the type-soundness discipline's actual
  value — precision, acceptance rate — is only knowable after real PRs exercise it in each repo. Each
  repo's own existing Post-Cutover Monitoring Plan already owns measuring this going forward; this
  plan's job is only to stand the discipline up correctly in all four, not to pre-validate its hit
  rate anywhere.

## Business-Scope Non-Goals

- Not attempting to reduce the fixed 3-cycle ceiling or change the CI-green hard gate between cycles,
  in any of the four repos — all stay exactly as documented per-repo.
- Not attempting to close the `REQUEST_CHANGES`/bot-identity gap (tracked separately, see README.md
  Out of Scope) — a pre-existing gap in every repo's pipeline, unaffected by this plan in any of them.
- Not adding a persistent cross-PR metrics log, in any repo (the maintainer's explicit grill answer —
  header fields only for now).
- Not reconciling the four repos' independent pipeline copies into one shared/mirrored source — each
  repo keeps running its own independent instance of the same design after this plan, exactly as
  before it. Introducing an actual sharing mechanism (so a future change lands once instead of four
  times) is a materially larger, separately-scoped change this plan does not attempt.

## Business Risks and Mitigations

- **Risk**: a second opus-tier call per cycle (scout, in addition to synthesis-maker) increases
  per-PR cost beyond what each repo's existing Cost and Latency Budgeting future-work section
  estimated — now **quadrupled** in aggregate scope (four repos' pipelines instead of one).
  **Mitigation**: scout runs once per cycle regardless of tier (even a `trivial`-tier PR needs
  classifying), so its cost is bounded and predictable per repo, unlike the per-specialist multiplier
  the risk-tier fan-out already controls; the added cost is documented explicitly in
  [tech-docs.md](./tech-docs.md#design-decisions) rather than silently absorbed, so a future
  maintainer revisiting any repo's Cost and Latency Budgeting section has the real number to react to.
- **Risk**: the type-soundness discipline overlaps with `pr-review-architecture-maker` (which already
  owns "quality-attribute effects") or `pr-review-governance-maker` (mechanical conformance),
  producing duplicate or misfiled findings — in any or all of the four repos. **Mitigation**: a new
  grey-zone ruling (g) is added to each repo's own `pr-review-disciplines.md` alongside the existing
  six, explicitly separating "does it compile" (not this discipline's job at all — CI already gates
  it) from "is it sound" (this discipline's job) from "should this boundary exist" (architecture's
  job) — see [tech-docs.md Design Decision DD-2](./tech-docs.md#design-decisions), applied identically
  in each repo.
- **Risk**: a repo's `AGENTS.md` tight byte budget silently regresses further, or worse, tips into
  hard-fail — most acutely `ose-primer`, whose 148 B of headroom is thin enough that even a single
  miscounted edit could cross the ceiling. **Mitigation**: the baseline above measures the exact
  current byte count and the planned edit's exact delta **per repo** before any edit lands; each
  track's own Phase 4 delivery item re-measures live after the edit as an explicit acceptance
  criterion, per repo — `ose-primer`'s track treats this check as load-bearing rather than routine.
- **Risk (new to the 4-repo scope)**: treating the plan's `ose-public`-authored diff as a template and
  blindly re-applying it to the other three repos would silently miscount the private sibling's
  quality-gate.md "eight" occurrences (5, not 6) or apply the wrong edit shape to its `AGENTS.md`
  bullet (list-expansion, not word-swap). **Mitigation**: each repo's Phase 0 re-baseline step
  re-verifies that repo's own counts live before any edit, and Phase 4's `AGENTS.md` delivery item is
  written per-repo (not copy-pasted) in [delivery.md](./delivery.md), explicitly branching on
  the private sibling's divergent wording.

## Related Documentation

- [README.md](./README.md) — plan overview, scope, resolved design decisions
- [prd.md](./prd.md) — product scope and Gherkin acceptance criteria
- [tech-docs.md](./tech-docs.md) — architecture and detailed design
- [PR Reviewer-Discipline Convention](../../../repo-governance/development/quality/pr-review-disciplines.md)
- [PR Review Quality Gate workflow](../../../repo-governance/workflows/pr/pr-review-quality-gate.md)
- [Instruction-File Size Budget Convention](../../../repo-governance/conventions/structure/instruction-file-size-budget.md)
