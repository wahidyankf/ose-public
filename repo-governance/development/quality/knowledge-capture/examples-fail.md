---
description: "FAIL examples of knowledge capture."
when_to_use: "Use for an incorrect knowledge-capture example."
---

# Examples (continued)

## FAIL: Silent absence

```markdown
<!-- learnings.md does not exist; delivery.md has no Knowledge Capture phase; no explanation given -->
```

`plan-checker` flags this at MEDIUM: the phase is mandatory, and its absence carries no explicit
"none" record.

## FAIL: Code change landed inline instead of filed as a two-pager

```markdown
**Routing**: `apps/organiclever-be` (code) — routed INLINE, landed in commit `def5678` of this
governance plan's PR.
```

This is a **plan-execution-checker** blocking finding: a code-homed learning must never land inline,
regardless of how small the fix looks. File an authorized `plans/ideas/` two-pager or report it with
handoff evidence.

## FAIL: Run created a backlog plan for its own finding

```markdown
**Routing**: `.github/workflows/` (non-code, large) — this is fully diagnosed and plan-ready, so
filed directly at `plans/backlog/reconcile-parity-audit-exception/` rather than as a two-pager.
```

Fails the routing-timing rule: `plans/ideas/` is the only destination an executing run may file new
future work to. "It is already plan-ready" is the run's own judgment, and the ripeness gate in
[plan-idea-promotion-planning](../../../workflows/plan/plan-idea-promotion-planning.md) exists
precisely because that judgment is not a substitute for it. A prior human instruction sending some
_other_ finding straight to `backlog/` does not carry to this one.

## FAIL: Secret leaked into learnings.md

```markdown
## Learning: the staging database connection string is postgres://admin:<literal-password>@<private-staging-ip>:5432/app
```

Fails the secret/sensitivity gate outright (the captured line held the literal password and the private host address, replaced by placeholders here) — discard, or rewrite as
`postgres://<user>:<placeholder>@<staging-db-host>:5432/<db-name>` if the underlying insight (e.g.,
"the staging connection string format differs from production") is itself worth keeping.

## FAIL: Infra-private content cross-routed to a public repo

```markdown
**Routing**: `repo-governance/` in `ose-public` — this k3s node's real hostname handling should be
documented here.
```

Fails the repo-relevance gate: infra-specific content (a real k3s node/hostname) must stay in
`ose-private` only, never in `ose-public`.
