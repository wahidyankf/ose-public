# Reconcile `apps/rhino-cli/src/application/doctor/tools.rs`'s "zero carve-outs" byte-identity target with its real, needed per-repo extensions

One-line summary: `docs/reference/sdlc-gate-standard.md` states `apps/rhino-cli/src` is byte-identical
across the bound repos with **zero carve-outs**, but the private sibling's `doctor/tools.rs` legitimately
carries extra IaC tool-provisioning definitions and tests (e.g. OpenTofu-specific tooling) that
canonical does not — a structural tension between the stated target and a real, needed divergence that
predates this brief and will keep causing every byte-identity check on this file to either false-flag
or silently ignore known drift.

> Provenance: surfaced 2026-08-07 during `sdlc-gate-registry-enforcement`'s Phase 6 byte-identity
> propagation work (canonical `doctor/tools.rs` fix propagated into the private sibling). A full `diff`
> against canonical showed far more divergence than the propagated delta alone — the private sibling needs
> IaC tooling the other bound repos don't. Documented provisionally in
> `docs/reference/sdlc-gate-standard.md`'s "Known exception (tracked, not yet reconciled)" note; this
> brief is the follow-up to actually resolve it in code.

## Problem / context

`docs/reference/sdlc-gate-standard.md` §"rhino-cli Byte-Identity Boundary" states the target for the
whole `apps/rhino-cli/src` tree (plus `tests/`, `Cargo.toml`, `Cargo.lock`, `project.json`, `LICENSE`,
and the Gherkin behaviour tree) is **zero carve-outs** — byte-identical across every bound repo. The
plan's own Phase 4 work (registry authoring for the private sibling) already assumed the opposite for tool
provisioning: the private sibling needs infra-only IaC tooling (`terraform`, `ansible-lint`, `yamllint` —
already documented as [Allowed Divergence](../../../docs/reference/sdlc-gate-standard.md#allowed-divergence)
at the `repo-config.yml`/workflow level) that the other repos don't, and that need reaches down into
`doctor/tools.rs`'s tool-definition and test functions themselves, not just the CI-workflow-YAML layer
already carved out.

So the boundary model (whole-file byte-identity) and the per-repo extension model (repos legitimately
provision tools the others don't need) are in tension for exactly this one file. Left unresolved:

- Every Phase Gate's "byte-identical to canonical" check that touches this file reports drift
  indefinitely, masking genuinely unpropagated fixes among expected, known-good structural
  differences — a checker or human has to manually distinguish "known IaC extension" from "someone
  forgot to propagate a real fix" every time, with no mechanical way to tell them apart.
- The stated "zero carve-outs" claim in `sdlc-gate-standard.md` is inaccurate for this one file as
  written, which is itself a documentation-integrity problem independent of the code question.

**Live re-measurement (2026-08-07, this review cycle) — flagged for re-confirmation before
promotion.** Comparing this PR's canonical `apps/rhino-cli/src/application/doctor/tools.rs` (1075
lines) against the private sibling's `origin/main` copy (1045 lines, commit `1cb9cd236`) directly:

- `fn`-signature sets are **identical** — 36 of 36 functions match by name in both files, including
  `install_clang_format` and the `OpenTofu`-specific helpers cited above as the motivating example.
- `DOCTOR_TOOL_INVENTORY` (`apps/rhino-cli/src/application/repo_config/mod.rs`) is **identical** —
  the same 16 entries (including `tofu` and `clang-format`) in both repos.
- The entire 111-line diff between the two files is the already-separately-tracked, unpropagated
  `dotnet_channel`/`install_dotnet` security-hardening fix (same propagation-gap class as F4 in the
  `sdlc-gate-registry-enforcement` PR #152 Cycle 2 review, tracked as task #238) — **not** a residual
  extra-tool-definition surplus.

This does not reproduce the "private sibling carries extra `OpenTofu`/`clang-format` tool definitions
canonical does not have" example above as of this measurement — canonical (`ose-public`) already
carries that tooling identically (added by `ea286ee88`, predating this brief). The structural tension
this brief describes (whole-file byte-identity vs. legitimate per-repo tool extension) may still be
real in principle, but the specific divergence that motivated writing it down — and both consequences
the bullets above assert — is **not currently observable**; re-verify against a live `diff` before
promoting this brief past the idea stage, rather than treating the original provenance note or the
bullets above as still-current evidence.

## Why now

Nothing is actively broken — the known divergence has existed since the private sibling's Phase 4 tool
registry authoring and hasn't caused a wrong propagation yet, only manual overhead each time a
byte-identity check runs against this file. What makes it worth tracking now is that
`sdlc-gate-registry-enforcement` just finished the first end-to-end propagation cycle across the
byte-identity boundary and hit this exact tension directly, so the shape of the fix is fresh and the
cost of leaving it unresolved (repeated manual triage on every future audit) is now concretely
understood rather than theoretical.

## Prior art / precedents

- [`docs/reference/sdlc-gate-standard.md` §"rhino-cli Byte-Identity Boundary"](../../../docs/reference/sdlc-gate-standard.md#rhino-cli-byte-identity-boundary) —
  the "zero carve-outs" target this brief proposes to either narrow or reconcile, plus the provisional
  "Known exception" note this brief follows up on.
- `apps/rhino-cli/src/application/parity.rs` — the `BOUNDARY_PATHS` constant declaring the tracked-file
  set for the byte-identity check; the actual comparison mechanism (full-file hash/diff) that would
  need an accepted-superset mode.
- `apps/rhino-cli/src/application/doctor/tools.rs` — the concrete file carrying the divergence today
  (the private sibling's extra IaC tool definitions and tests beyond the canonical set).
- `sdlc-gate-registry-enforcement` (`plans/done/2026-08-07__sdlc-gate-registry-enforcement/`, once
  archived) — the plan whose Phase 4 (private-sibling registry authoring) and Phase 6 (byte-identity
  propagation) tasks are the direct source of this finding; see its `learnings.md` for the original
  observation.

## Proposed direction (sketch)

Two candidate directions, not yet decided between:

1. **Narrow `BOUNDARY_PATHS`** — carve `doctor/tools.rs` (or just its per-repo-extension functions) out
   of the strict byte-identity set entirely, accepting that this one file is no longer covered by the
   automated check and relying on code review to catch unwanted drift instead.
2. **Accepted-superset comparison mode** — teach the byte-identity check to compare a canonical
   _subset_ (the shared tool definitions) rather than the whole file, letting each repo layer declared
   extensions on top without failing the check. This keeps automated coverage on the shared portion,
   which direction 1 would give up entirely.

Direction 2 preserves more of the automated guarantee and matches the "generate-and-validate over
hand-sync" pattern the repo already favors elsewhere (harness bindings, `repo-config.yml` schema
parity) but requires deciding how "canonical subset" is identified mechanically (a marker comment, a
naming convention, a separate declared-extensions file) — that design question is exactly why this is
a brief, not a ready-to-execute plan.

## Rough scope & non-goals

In scope: resolving the `doctor/tools.rs` byte-identity tension specifically — either narrowing
`BOUNDARY_PATHS` or building an accepted-superset comparison mode, plus updating
`sdlc-gate-standard.md`'s "Known exception" note to reflect whichever direction is chosen.

Out of scope:

- Any other file's byte-identity boundary — this brief is scoped to the one file with a confirmed,
  needed divergence.
- Adding new tool provisioning to any repo — this is about how the _existing_, already-needed
  divergence is checked, not about adding more of it.
- `beaver-nest`'s `rhino-cli` fork — out of the enforced byte-identity boundary per the
  `sdlc-gate-registry-enforcement` Scope Amendment (2026-08-07); this brief inherits that same
  two-repo (`ose-public`, the private sibling) scope; no third repo is synced.

## Risks & open questions

- **Which direction (narrow vs. accepted-superset) is worth the implementation cost?** Direction 2 is
  more capable but requires new comparison-engine logic in `apps/rhino-cli`; direction 1 is a one-line
  constant change but gives up automated coverage on the file entirely. (open)
- **Does a similar tension exist elsewhere in `BOUNDARY_PATHS`'s tracked set** (any other file where a
  repo's legitimate extension need collides with whole-file byte-identity), or is `doctor/tools.rs` a
  one-off? Not surveyed as part of this brief. (open)
- **Test coverage for whichever mechanism is chosen** — an accepted-superset comparison mode is new
  parity-check logic and would need its own unit tests (and likely a Gherkin scenario) per this
  repo's Regression Test Mandate / Specs Completeness conventions, sized appropriately once a
  direction is chosen. (open)

## What success looks like + promotion signal

Success is narrow: a byte-identity check against `doctor/tools.rs` distinguishes "known, declared
per-repo tool extension" from "unpropagated canonical fix" mechanically, without a human manually
diffing the file on every audit, and `sdlc-gate-standard.md`'s stated target for this file matches
what the code actually enforces.

Promotion signal: the next byte-identity audit cycle that touches `doctor/tools.rs` (the recurring
`rhino-cli-parity-audit.yml` workflow, or the next manual propagation pass) hits the same manual-triage
cost this brief describes, confirming the overhead is recurring rather than a one-time observation.
