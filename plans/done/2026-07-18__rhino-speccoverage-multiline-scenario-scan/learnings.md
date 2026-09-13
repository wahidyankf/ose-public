# Learnings — Rhino speccoverage multi-line scenario scan

<!-- Knowledge Capture running log — append entries during execution. -->
<!-- Triage every entry (or record the explicit "none" escape) before archival. -->
<!-- Entry shape:
## Learning: <one-line summary>

- **Context**: what was being done when this surfaced
- **Observation**: what was noticed (sanitized — no secrets/hostnames)
- **Why it might generalize**: the litmus reasoning
-->

## Phase 0 baseline (recorded, all green)

- `npx nx run rhino-cli:test:unit` — PASS (4 features, 26 scenarios, 102 steps, all passed).
- `npx nx run rhino-cli:specs:behavior:coverage` — PASS ("Spec coverage valid! 57 specs, 316
  scenarios, 1313 steps — all covered.").
- `npx nx run web-ui:specs:behavior:coverage` — PASS ("Spec coverage valid! 21 specs, 118
  scenarios, 311 steps — all covered." — expected green since the `// prettier-ignore` hacks this
  plan removes in Phase 2 are still present).
- No preexisting failures found; nothing to resolve before Phase 1.

## Learning: Phase 3's own delivery.md commands pointed at the primary checkout, not the worktree

- **Context**: Phase 3a's sibling-propagation `cp` commands, as written verbatim in this plan's
  `delivery.md`, sourced from `~/ose-projects/ose-public/apps/rhino-cli/...` (the primary
  checkout, on `main`, no Phase 1/2 changes) instead of
  `~/ose-projects/ose-public/worktrees/rhino-speccoverage-multiline-scenario-scan/apps/rhino-cli/...`
  (the worktree where all the actual fix lives).
- **Observation**: the first copy attempt silently succeeded (cp doesn't error on stale-but-valid
  source) and only 1 of 4 new unit tests appeared in the sibling's `cargo test` run — caught
  immediately by the test count mismatch, not by a copy failure. Re-copying from the worktree path
  fixed it; `diff` then confirmed byte-identity.
- **Why it might generalize**: this is the exact same worktree-vs-primary-checkout confusion class
  already captured for Plan 1 (routed to plan-execution.md's Resume Reconciliation item 6), but this
  time the bug was baked into a plan document's own verbatim shell commands rather than an agent's
  mistaken read. Any plan template that hardcodes sibling-propagation `cp`/`diff` source paths should
  point at the worktree, not the bare repo root — worth a generalized template fix.

## Learning: touching rhino-cli marks nearly the whole Nx graph "affected," surfacing unrelated fresh-worktree provisioning gaps

- **Context**: `nx affected -t typecheck lint test:quick` in a freshly provisioned ose-primer
  worktree failed on `elixir-cabbage`, `elixir-gherkin`, `elixir-openapi-codegen`,
  `crud-be-elixir-phoenix` (missing `mix deps.get`) and `crud-be-fsharp-giraffe` (missing
  `dotnet restore`) — none of which this plan touches.
- **Observation**: because nearly every project's `specs:*`/`lint` targets shell out through the
  rhino-cli binary, any rhino-cli change marks the whole dependency graph "affected," so a fresh
  worktree's un-fetched per-language deps (Elixir Hex packages, .NET NuGet packages) surface as
  gate failures unrelated to the actual change. `npm run doctor -- --fix` does not fetch
  Elixir/`.NET` per-project dependencies.
- **Why it might generalize**: any future rhino-cli-touching plan that provisions a fresh sibling
  worktree will hit the same wall. Worth documenting in worktree-setup.md as an explicit "polyglot
  demo apps need `mix deps.get`/`dotnet restore` per-project before affected gates will pass" step,
  alongside the existing `npm install` + `npm run doctor -- --fix` guidance.

## Learning: byte-identical sibling PRs repeatedly go stale while the source PR is still mid-review

- **Context**: Phase 4's three-repo PR-review cycle. `ose-public` PR #62 (the byte-identity source)
  went through its own 3 review cycles, and each cycle's fixer pushed a correcting commit (Cycle 1:
  doc-comment + duplicate-step fix; Cycle 3: differentiated a duplicate GUARD test). Both sibling PRs
  (`ose-primer` #6, `ose-infra` #9) had already been opened as verbatim copies of an _earlier_
  `ose-public` state, so each time `ose-public` moved, both siblings' next review cycle immediately
  re-discovered "stale vs. upstream" as its top finding and needed another verbatim resync.
  `ose-infra` needed 2 separate resyncs (Cycles 1 and 2) before finally matching `ose-public`'s truly
  final head in Cycle 3; `ose-primer` needed 2 as well (Cycles 2 and 3).
- **Observation**: this was self-correcting (each maker→fixer resync round converged closer to the
  final state) but wasteful — extra review/fixer rounds spent re-diagnosing the same "the upstream
  moved again" root cause instead of finding new issues. Deliberately holding a sibling's next cycle
  until the source PR's cycle finished (used for `ose-primer` Cycle 3 and `ose-infra` Cycle 2)
  avoided one extra round each.
- **Why it might generalize**: any future plan with a byte-identity-boundary source PR (like
  `apps/rhino-cli`) reviewed in parallel with its sibling-repo mirror PRs will hit this same
  moving-target problem. Worth a process note in the Multi-Repo rhino-cli Delivery convention (or the
  PR Review Quality Gate workflow) recommending siblings' review cycles be sequenced to start only
  after the source PR's review cycles are fully complete and CI-green at a stable head, rather than
  running all three repos' cycles concurrently from the start.

## Triage Log (Phase 5, Knowledge Capture)

Litmus test applied: kept only if a durable surface would catch this automatically next time.
Secret/sensitivity gate: no secrets, credentials, tokens, or private hostnames in any entry — clean.
Repo-relevance gate: all three surviving candidates are general development-workflow governance
content (not `ose-infra`-private), safe to land in `ose-public` (source of truth) and eligible for
the separate multi-repo parity loop to propagate later — this plan does not perform that
propagation itself.

- **Phase 0 baseline** — not a generalizable learning, a plan-execution record. No routing needed.
- **Phase 3's own delivery.md commands pointed at the primary checkout, not the worktree** —
  ROUTED (non-code, small edit, landed inline): added a new "Absolute Source Paths in
  Delivery-Checklist Commands (Same-Repo Worktree vs. Primary Checkout)" subsection to
  `repo-governance/development/workflow/worktree-setup.md`, immediately after the existing
  "Sibling-Repo Relative Paths" subsection it generalizes alongside.
- **Touching rhino-cli marks nearly the whole Nx graph "affected," surfacing unrelated
  fresh-worktree provisioning gaps** — DISCARDED as a duplicate: already captured verbatim in
  `repo-governance/development/workflow/worktree-setup.md`'s existing "Per-Project Dependency
  Restoration for Some Language Ecosystems" subsection (landed by a prior plan,
  `rhino-cli-source-drift-reconciliation`) — same root cause, same fix, same file, nothing left to
  add.
- **Byte-identical sibling PRs repeatedly go stale while the source PR is still mid-review** —
  ROUTED (non-code, small edit, landed inline): added a new bullet to the "Notes" section of
  `repo-governance/workflows/pr/pr-review-quality-gate.md` recommending source-PR-first sequencing
  for byte-identity-boundary multi-repo plans.

No code-homed learning surfaced (no `apps/`/`libs/`/test change was implied by any entry), so no
`plans/backlog/` follow-up plan was filed. Every entry above reached a terminal state.
