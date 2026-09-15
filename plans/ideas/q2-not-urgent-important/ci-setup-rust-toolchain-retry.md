# Retry the Rust toolchain install in `setup-rust`

One-line summary: the `setup-rust` composite action has no retry around the toolchain install, and
its download from `static.rust-lang.org` flaked **seven times in a single plan phase** — gating a
markdown-only changeset it could not have affected; wrap the install in a retry, in both parity repos.

> Surfaced 2026-07-22 during `bare-repo-governance-hardening` Phase 5. Routed as its own brief
> because it is a CI/code change, which the Knowledge Capture routing matrix forbids landing inline
> in a governance plan.

## Problem / context

Seven CI job failures in one phase — four on the PR, three more on `main` after the merge — every
one inside `.github/actions/setup-rust`, at a step that fetches from `static.rust-lang.org`. The
signature is unambiguous:

- **A different job every time.** Failures landed on unrelated jobs (harness-duplication validation,
  schema parity, env-contract validation, governance validators) with several cascading into the
  aggregate quality gate. Job-specific defects do not move around like that; a shared setup step
  does.
- **The changeset was markdown-only.** It maps to no Nx project, and each failing job passed when
  CI's exact command was run locally. A pure-docs change was gated seven times by a network fault it
  could not possibly have caused.
- **It escalated mid-phase.** The first failures were the toolchain _manifest_ download
  (`channel-rust-stable.toml`: connection reset, then timeouts). Later ones failed fetching
  `rustup-init` itself. A fault that persists across a retry-hardened fetch is sustained, not
  transient — so hammering it with re-runs is the wrong response.
- **Every one was cleared with `gh run rerun --failed`** — a retry of a flaked infrastructure step,
  not a gate bypass. No `--no-verify`, no hook skipped, nothing marked green by hand.

**Frequency is the finding.** Seven hits in one phase means every non-trivial change pays a re-run
tax, and that tax is invisible in per-run reporting because a re-run reports green.

The mitigation gap is one step wide: the composite action delegates the toolchain install to a
third-party action that shells out to `rustup toolchain install`, with **no retry at any layer** —
while the expensive, large, most-likely-to-fail download is exactly that one.

**Verified complication:** the two parity copies of this action have already diverged.
`ose-public` installs via `actions-rust-lang/setup-rust-toolchain@v1`; the private sibling
uses `dtolnay/rust-toolchain@stable`. So "apply the same fix identically" is not a copy-paste.

## Why now

The flake rate is measured, current, and high, and it falls on a shared action used by every Rust
job in the parity set — including changesets with no Rust in them at all. It was deliberately not
fixed inside the governance PR that hit it, because patching CI infrastructure inside a governance
changeset would both scope-creep the PR and manufacture a one-repo divergence in a file the parity
workflow expects to stay aligned. That deferral is only sound if the follow-up actually happens.

## Prior art / precedents

- **The existing MSRV pre-install step in `ose-public`'s own `setup-rust`** — the in-repo precedent
  for hardening this exact action against an infrastructure race, complete with a long comment
  explaining the failure it prevents. Same file, same class of problem, already solved once.
  [action.yml](../../../.github/actions/setup-rust/action.yml)
- **CI Blocker Resolution practice** — the rule that a CI blocker gets a root-cause fix rather than
  a bypass; a standing re-run habit is the symptom this brief proposes to remove.
  [ci-blocker-resolution](../../../repo-governance/development/quality/ci-blocker-resolution.md)
- **`plan-multi-repo-parity-planning` workflow** — the mechanism for landing one change across the
  three repos without creating divergence.
  [workflow](../../../repo-governance/workflows/plan/plan-multi-repo-parity-planning.md)
- **SDLC Gate Standard** — defines the shared CI gate shape the three repos are held to, which is
  why the fix must span both parity repos rather than stay local.
  [sdlc-gate-standard](../../../docs/reference/sdlc-gate-standard.md)
- **Retry-with-backoff around network fetches in CI** — standard practice (`curl --retry`,
  `nick-fields/retry`, package-manager retry flags); this is applying a well-known pattern one step
  further down than it currently reaches.

## Proposed direction (sketch)

- Wrap the toolchain install so a failed fetch is retried a bounded number of times with a delay
  between attempts, rather than failing the job on the first network fault.
- Prefer backoff over immediate retry: the escalation pattern above shows the outage can be
  sustained, and an immediate retry against a sustained fault just spends the budget faster.
- Apply the change in **all three** repos in one coordinated pass, reconciling the already-diverged
  toolchain-action choice first so the copies converge rather than drift further.
- Keep the existing MSRV pre-install step's protection intact — it solves a different problem
  (parallel-download race) and must not be traded away for the retry.

## Rough scope & non-goals

In scope: a retry around the toolchain install in `setup-rust` in both parity repos; reconciling the
divergent toolchain-action choice; a note in the action explaining what the retry defends against,
matching the existing comment style.

Out of scope: vendoring or pinning a toolchain tarball (heavier, and it trades a flake for a
maintenance burden); retrying every network step in CI indiscriminately; changing the runner
infrastructure itself; any change to which Rust version is installed.

## Risks & open questions

- Retries hide genuine breakage. A toolchain install that fails for a real reason (bad version, bad
  component) would now fail slower, and the log gets noisier. Attempt count and delay need choosing
  with that in mind. (open)
- The plan's `learnings.md` records that a retry wrapper already guarded the rustup _bootstrap_
  while the toolchain install had none. That wrapper is **not** present in any of the three repos'
  `.github/` trees, so where it actually lives — and therefore whether this fix belongs in the
  action at all or one layer down — needs establishing before promotion. (open)
- Converging the two different toolchain actions is a behaviour change beyond the retry, and could
  surface its own differences (caching, component handling). It may deserve to be sequenced as a
  separate step rather than bundled. (open)
- Whether the underlying fault is upstream-wide or specific to this runner environment is unknown;
  if the latter, a retry is a workaround rather than a fix, and that should be recorded honestly.

## What success looks like + promotion signal

Success: a transient failure of the toolchain download no longer fails the job, `setup-rust` is
functionally equivalent across the three repos, and the re-run rate on markdown-only changesets
drops to zero over a comparable window. The honest measure is a before/after count of
`gh run rerun --failed` invocations attributable to this step — seven in one phase is the baseline.

Ready to promote once the wrapper-location question is answered, since it determines whether the
change is one file per repo or something larger.
