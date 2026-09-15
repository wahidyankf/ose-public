---
description: "Operating notes for ceilings, attribution, pipeline actors, findings, and sibling-PR staleness."
when_to_use: "Use when clarifying an operating nuance not covered elsewhere — e.g. why sibling-repo PR loops shouldn't run concurrently with the source PR's."
---

# Notes

- **The configured ceiling is not a target**: the eligible loop exits at its
  [clean exit](./probe-variation-and-exit.md) — two consecutive clean cycles under unused probe
  classes — and never exceeds `{input.cycles}` (default 5, or a verified per-PR extension). The ceiling bounds work; it never waives a
  code-related MEDIUM/HIGH/CRITICAL finding.
- **AI-attribution, not a distinct bot identity**: both agents currently post under the existing
  personal `gh` identity with an explicit AI-attribution footer per comment/reply, because no
  dedicated bot/GitHub App identity is provisioned in this environment. This is a pragmatic fallback,
  not a permanent design decision — revisit if a bot/App identity is provisioned later. This does not
  touch the repo's Git Identity Guardrail (that guardrail governs `git config user.*` for commits;
  this is a `gh`/GitHub-API posting identity, a separate concern).
- **All eleven pipeline agents implemented and wired**: `pr-review-scout-maker`, the nine discipline
  specialists, and `pr-review-synthesis-maker` — defined per the
  [PR Reviewer-Discipline Convention](../../../development/quality/pr-review-disciplines.md) — plus the
  unchanged `pr-review-fixer` are this workflow's live actors as of the `worktree-to-pr-hardening`
  plan's Phase 4 cutover, which retired the single-maker `pr-review-maker` monolith immediately (D2)
  rather than running it alongside the split.
- **Extra cycles never waive a finding**: reaching `{input.cycles}` with code-related
  MEDIUM/HIGH/CRITICAL findings outstanding fires the
  [ceiling block](./loop-exit-and-block-rules.md#loop-exit-and-block-rules); the PR never merges on
  the strength of having spent more cycles, only on the strength of an actually-empty
  blocking-findings list. A checkpoint never raises the ceiling. Only a separate durable extension
  after human direction funds more attempts, and it is never a waiver.
- **Paired-repository sibling PRs are a moving target until the source PR converges**: when a
  plan opens a source PR (e.g. `ose-public`) alongside byte-identical mirror PRs in sibling repos
  (e.g. the private sibling), running all repos' review-cycle loops concurrently from the start
  means every fixer commit on the source PR immediately makes the siblings stale again, and each
  sibling's next cycle re-discovers "stale vs. upstream" as its top finding instead of surfacing new
  issues — a self-correcting but wasteful pattern observed to cost an extra cycle per sibling in
  practice. The hard sequence is: (1) the public loop converges; (2) its PR merges and that merge is
  reachable from the source `origin/main`; (3) the private successor PR already exists; (4) exactly
  one authenticated post-merge source handoff passes typed readback; only then may the first private
  scout or review begin. Do not deliberately start or resume a private cycle before those conditions
  hold, including while the public loop remains open.

  The same sequencing applies to semantic counterparts, not only byte-identical mirrors. The
  counterpart records satisfaction, reasoned deviation, or one bounded correction request; in sync
  means that traceable semantic state, not automatically identical files.
