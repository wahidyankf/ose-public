# Remove the 24 `compat:min-version` echo stubs the Nx target convention already forbids

One-line summary: every surviving `compat:min-version` target in `ose-public` is a bare `echo` that
checks nothing — 24 of 24, with zero real checks left — while the Nx target convention states in
terms that echo and no-op targets "are forbidden because they falsely claim a quality boundary
exists".

> Provenance: demoted from the full `backlog/` plan `remove-stale-compat-min-version-stubs/` to a
> two-pager on 2026-09-08. Originally filed direct-to-backlog by
> [`rewrite-rhino-cli-to-fsharp`](../../done/2026-08-30__rewrite-rhino-cli-to-fsharp/README.md)'s
> Phase 12 Knowledge Capture triage — a route the Knowledge Capture Convention forbids, which is why
> it is here now.

## Problem / context

`compat:min-version` was a real target for exactly one project: `rhino-cli`, which enforced a
Minimum Supported Rust Version via `cargo hack check --rust-version`. Everywhere else it was copied
in as a placeholder, evidently to satisfy a since-retired "every project declares every canonical
target name" habit.

Phase 9d of `rewrite-rhino-cli-to-fsharp` found 26 such copies while retiring `rhino-cli`'s own real
target; Phase 12 triage reconfirmed 27. A fresh count on 2026-09-08 finds **24 holders, and every
one of the 24 is a bare echo**:

- 17 read `echo 'compat:min-version: no standard min-version floor for TypeScript'`
- 5 read `… for F#`
- 2 (the `be/contracts` spec projects) read `… no standard min-version floor`

There is no longer a single real `compat:min-version` check anywhere in `ose-public`. The one
project that had a genuine floor was the Rust crate, and it is gone.

That is not merely untidy — it is a standing violation of a rule this repo already wrote down.
[Mandatory and Applicable Nx Targets](../../../repo-governance/development/infra/nx-targets/mandatory-targets-all-projects-six-and-required.md)
says: "Omit inapplicable targets. Echo, no-op, success-sentinel, duplicate runtime, and
compatibility-alias targets are forbidden because they falsely claim a quality boundary exists." The
[echo-placeholder anti-pattern](../../../repo-governance/development/infra/nx-targets/anti-patterns-echo-placeholders.md)
says the same thing again, standalone. Twenty-four files disagree with both, and nothing notices.

## Why now

This is the vacuous-gate shape the repo has already decided it cares about: a target a contributor
can run, watch pass, and reasonably read as evidence that a minimum-toolchain floor was checked —
when nothing was checked and no floor exists. `nx affected -t compat:min-version` currently reports
success for up to 24 projects and means nothing by it.

Urgency comes from the rule already existing. This is not a proposal to decide a standard; the
standard is written, published, and unambiguous, and the corpus contradicts it today. Every new
project scaffolded by copying a sibling `project.json` inherits the stub, so the count grows rather
than decays.

## Prior art / precedents

- [Mandatory and Applicable Nx Targets](../../../repo-governance/development/infra/nx-targets/mandatory-targets-all-projects-six-and-required.md)
  — the rule being violated, stated as a prohibition rather than a preference.
- [Anti-Pattern — Echo and No-Op Test Targets](../../../repo-governance/development/infra/nx-targets/anti-patterns-echo-placeholders.md)
  — the same prohibition given its own document, which is how much this repo cares about it.
- [`markdownlint-ci-gate-lints-zero-files`](./markdownlint-ci-gate-lints-zero-files.md) — the closest
  sibling in shape: a gate that has always passed while inspecting nothing.
- [`2026-08-30__rewrite-rhino-cli-to-fsharp`](../../done/2026-08-30__rewrite-rhino-cli-to-fsharp/README.md)
  — Phase 9d surfaced the class and its `learnings.md` flagged it as "a separate, unopened cleanup".
- [`port-registry-lacks-a-validator`](../q2-not-urgent-important/port-registry-lacks-a-validator.md)
  — the recurring repo pattern of a stated invariant with nothing enforcing it.

## Proposed direction (sketch)

- **Enumerate and classify before editing anything.** Grep every `project.json` declaring a
  `compat:min-version` key, then read each target body and record a per-file verdict with that body
  quoted. A pattern match alone must never delete a target; the whole risk of this change is a real
  check misclassified as an echo.
- **Delete the key** from each confirmed stub's `project.json`. Purely subtractive; no target is
  added, renamed, or reworded.
- **Cross-check against the convention's own tables.** If a project the convention says _should_
  carry a real floor is found holding an echo, that is a coverage gap, not stale debt — record it
  separately rather than deleting it silently.
- **Decide whether the class deserves a gate.** Twenty-four instances of a forbidden pattern that
  nothing detected is itself the finding; a validator for echo-bodied targets would keep the count at
  zero. That is a bigger change than the cleanup and should be costed separately, not bundled in.

## Rough scope & non-goals

In scope: every `project.json` in `ose-public` whose `compat:min-version` body is a no-op echo,
confirmed individually.

Out of scope:

- The private sibling's equivalent stubs — a separate, independently-scoped sweep in that repo. This class
  is not inside the `apps/rhino-cli` byte-identity boundary, so the two repos need not move together.
- Adding `compat:min-version` anywhere it is missing. The convention makes it applicable-only, never
  universally mandatory.
- Changing what any real min-version check does. There are none left in `ose-public` to change.
- Building the echo-target validator, which is the separate, larger question above.

## Risks & open questions

- **Should this land as a validator instead of a sweep?** A one-time deletion fixes 24 files; a gate
  fixes the class. The gate carries a TDD cycle, companion Gherkin under `specs/apps/rhino/`,
  `repo-config.yml` registration, and the four-repo parity obligation — uncosted here. (open)
- **Why did the count move 26 → 27 → 24?** Some projects were removed or restructured between
  measurements, but that is inferred, not verified. Any sweep should reconcile the delta rather than
  trust the latest number. (open)
- **Do the two `be/contracts` spec projects differ?** Their echo omits the language suffix, which
  may mean they were added by a different mechanism than the other 22. (open)
- Misclassification risk is the only real downside, and it is fully mitigated by reading each body —
  which is why enumeration is a distinct step from removal rather than a flag on it.

## What success looks like + promotion signal

Success: grepping `ose-public` for `project.json` files declaring `compat:min-version` returns only
projects performing a real toolchain-floor check — today that means it returns nothing — the removal
diff touches only the deleted target keys, and `nx affected -t test:quick` is clean across every
touched project.

Promotion signal: the sweep-versus-gate question above is answered. A plain deletion is small enough
to fold into any adjacent `project.json`-touching work and needs no plan of its own; a validator does
need one, and the two have entirely different shapes. Promote once that verdict is written down.
