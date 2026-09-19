# The port registry is hand-maintained with nothing checking it

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: the cross-repo port registry now exists and answers where allocations are
recorded, but it is prose that no tool reads — so a colliding or stale entry still surfaces only when
two services fail to bind.

> Demoted from a full `backlog/` plan to a two-pager on 2026-08-05, when its two central decisions
> (where the registry lives, where the validator lives) were both unmade.
> Relocated from a sibling repo's `plans/ideas/` on 2026-08-06 by plan-ideas-grooming.
> Rewritten 2026-08-19: the registry shipped, answering the first decision and voiding most of this
> brief's original problem statement.
> Renamed from cross-repo-port-registry.md on 2026-08-19 by plan-ideas-grooming.

## Problem / context

Half of this brief was answered on 2026-08-19. A single registry now records every port both
repositories claim, `ose-public` continues to document its own allocations in
`docs/reference/web-sites.md`, and all nine app listeners resolve their port through one contract
(`--port` flag, then a prefixed environment variable, then a compiled-in default) so each entry has a
named override variable beside it. The scope also narrowed honestly: the registry covers the two
repositories under active coordination, not four. `beaver-nest` is explicitly outside the parity set
per `docs/reference/related-repositories.md` and carries no sync obligation in either direction, so
the original "four sibling repos" framing was never right.

What did not get built is any check. The registry's own "Why this is hand-maintained" section records
that decision deliberately rather than by omission. So the remaining failure mode is narrower than
the original brief's but unchanged in kind: nothing compares a registry row against the port the app
actually binds, and nothing fails when two rows claim the same number. A row can drift from reality
the moment someone changes a default, and the registry will keep asserting the old value with a
straight face.

## Why now

No collision has occurred, and the recent port work makes one less likely: every listener's default is
now declared in exactly one place per app, which is the precondition a derived registry would need.
That is the argument for doing it soon rather than urgently — the data is finally shaped so a
validator could read allocations from the apps themselves instead of trusting a table, which is the
difference between fixing the problem and relocating it.

## Prior art / precedents

- **The shipped registry** — the private sibling's `docs/reference/port-registry.md`, the artifact this
  brief would give a checker, including its explicit no-validator rationale.
- **[`repo-config.yml`](../../../repo-config.yml)** — the in-repo precedent for a central, machine-readable, validated
  declaration file, and the obvious candidate host for a per-repo port block.
- **IANA service name and port registry** — the canonical example of a port registry with a formal
  allocation procedure rather than an editable table.
  [iana ports](https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml)
- **`./rhino env validate`** — the existing declared-versus-read drift checker in this repo; the
  closest working model for "compare a declaration against what the code really does", and a
  candidate home for the same treatment applied to ports.

## Proposed direction (sketch)

- Derive rather than declare: have a checker read each app's real compiled-in default and prefixed
  variable name, then diff that against the registry, so drift is impossible rather than merely
  discouraged.
- Add the collision check on top: any port claimed twice fails, naming both claimants.
- Decide the enforcement point — a blocking gate or a checker-report warning — and accept that a
  public-repo check cannot read the private repo's tree, so either the registry's private half stays
  unvalidated or the check runs only where both are visible.

## Rough scope & non-goals

In scope: a validator for the registry that already exists, and whatever change makes registry
entries derivable from app configuration instead of hand-typed.

Out of scope (for now): re-litigating any already-allocated port; changing any app's runtime port
configuration, which the port contract work already settled; extending the registry to repositories
outside the parity set; recording infrastructure ranges that belong to the private repo alone.

## Risks & open questions

- Where does the validator live — a new `rhino-cli` subcommand, or a script wired into an existing Nx
  target? (open — this was the second of the two original blockers and is still unanswered)
- Can a check running in the public repo read the private repo at all, and under what auth model?
  Without an answer, a validator either omits half the registry or can only run where both trees are
  present. (open — the hardest question here)
- Does a derived registry actually work for the non-app entries, which come from infrastructure
  configuration rather than an app's source? (open)
- Is a validator proportionate for nine app listeners and a handful of test-stack ports, or is the
  hand-maintained table simply the right answer at this size? "No validator, and that stays a
  deliberate decision" remains a legitimate outcome. (open)

## What success looks like + promotion signal

Success: a registry row cannot disagree with the port an app really binds, and a duplicate claim is
reported by a check naming both claimants rather than by a developer debugging a bind failure.

Promotion signal: promote when either the validator-home and cross-repo-read questions are both
answered, or a registry row is first observed to have gone stale — that observation converts the
staleness risk from theoretical to measured, and is the evidence this brief currently lacks.
