# Learnings — Plan-Execution Knowledge Capture

> Transient running log, reconstructed from Phase 0-5 execution notes (capture was deferred to this
> single reconstruction pass rather than streamed live during execution). Each entry below has been
> triaged: litmus test → secret/sensitivity gate → repo-relevance gate → routing decision. This file
> moves with the plan to `plans/done/` on archival and may be deleted later — nothing depends on it
> surviving; everything kept has already been routed to a durable home.

---

## Learning: single-active-runner CI capacity constraint serializes concurrent workflow runs on ose-infra

- **Context**: Phase 5 (propagating the Knowledge Capture convention to `ose-infra`) pushed 4 commits
  to `origin main`, triggering `main-ci`, `pr-quality-gate`, and `validate-env` concurrently.
- **Observation**: `internal-host-1` was `offline` for the entire monitoring window; `internal-host-2`
  was the sole `online` runner, so it processed jobs from all three workflow runs interleaved rather
  than in parallel. Each workflow's aggregate `status` stayed `queued` for an extended period even
  though individual jobs were completing steadily, one at a time, with zero failures. A previously
  unseen final "Quality gate" aggregator job (present in both `main-ci` and `pr-quality-gate`) only
  became visible in the job listing once every prior job had progressed far enough to satisfy its
  `needs:` dependency — worth knowing so a future monitoring pass isn't surprised by a job count that
  grows mid-run.
- **Why it might generalize**: this is an infrastructure throughput ceiling (one online self-hosted
  runner instead of two), not a one-off fluke — it will recur on every future push that fans out to
  multiple concurrent workflows until a second runner comes back online or runner capacity is
  monitored/alerted on. The system does not currently catch or surface "only 1 of N expected runners is
  online" on its own; a dedicated monitoring/alerting mechanism would catch it automatically next time.
- **Litmus**: PASSES — routing this to a runner-health monitoring/alerting backlog plan means the
  _system_ (not a human noticing during a slow CI wait) would flag runner-capacity degradation
  automatically going forward.
- **Secret/sensitivity gate**: no secrets, credentials, tokens, real hostnames, or private
  infrastructure inventory detail in this entry — only generic runner-online/offline state and public
  GitHub Actions job names. Sanitization not required; nothing to redact.
- **Repo-relevance gate**: `ose-infra`-only. This is a private-repo CI/infrastructure operational
  concern (self-hosted runner fleet health) with no public-governance content — it must NEVER be
  cross-routed into `ose-public`/`ose-primer`, which have no visibility into or stake in `ose-infra`'s
  private runner fleet.
- **Routing decision**: **filed as backlog plan** (code/infra home, mandatory backlog per the
  code-routing downstream rule since the fix is an actual monitoring/alerting mechanism, not a docs
  edit) — `ose-infra`'s `plans/backlog/2026-07-06__ci-runner-health-monitoring/` (see Phase 6 task
  creating this folder). Terminal state: **filed**.

---

## Learning: multi-repo propagation pattern (public → primer → infra) worked without new tooling

- **Context**: Phases 1-5 repeated the same governance-change propagation across `ose-public` →
  `ose-primer` → `ose-infra`, each requiring its own worktree/checkout, edits, bindings resync, local
  quality gates, commit, push, and CI-green confirmation.
- **Observation**: the existing per-repo replication discipline (confirm reachability, replicate edits,
  resync bindings, run local gates, commit thematically, push, poll CI) was sufficient with no new
  process or tooling required — the pattern already matches what
  `plan-multi-repo-parity-planning.md`/`plan-multi-repo-parity-planning-and-execution.md` document.
- **Why it might generalize**: it doesn't need to — the generalizable version of this observation
  already exists as a documented, enforced workflow.
- **Litmus**: FAILS — nothing durable would change as a result of routing this; the system already
  catches/encodes this pattern via the existing parity-planning workflows. Re-documenting an existing,
  working process is not a new learning.
- **Secret/sensitivity gate**: N/A (discarded before this step).
- **Repo-relevance gate**: N/A (discarded before this step).
- **Routing decision**: **discarded** — reason: the multi-repo propagation pattern this plan followed
  is already fully codified in `repo-governance/workflows/plan/plan-multi-repo-parity-planning.md` and
  `plan-multi-repo-parity-planning-and-execution.md`; nothing new to add.

---

## Learning: private-repo safety-gate pattern (repo-relevance + secret/sensitivity) is self-referential

- **Context**: Phase 5 required verifying the `knowledge-capture.md` convention's own repo-relevance
  gate wording explicitly forbids cross-routing `ose-infra`-only learnings into the public repos, and
  running a manual scan confirming no private-infra content leaked into `ose-public`/`ose-primer`
  during Phases 1-4.
- **Observation**: both safety gates (secret/sensitivity, repo-relevance) performed exactly as the
  convention (authored in Phase 1 of this very plan) specifies — the verification step was itself an
  instance of the rubric the plan was building, not a new discovery about the rubric.
- **Why it might generalize**: it doesn't — this is the plan validating its own freshly-built
  mechanism, not surfacing a gap in it.
- **Litmus**: FAILS — the system already "catches this" by construction, since the two safety gates
  are the exact mechanism this plan created in Phase 1; there is no separate rule to add.
- **Secret/sensitivity gate**: N/A (discarded before this step).
- **Repo-relevance gate**: N/A (discarded before this step).
- **Routing decision**: **discarded** — reason: the safety-gate pattern is self-referential (this plan
  built the gate, then correctly exercised it); no new durable-home content is implied.

---

## Learning: `npm run generate:bindings` re-sync produced clean, drift-free output across all three repos

- **Context**: Phases 3, 4, and 5 each ended their agent/skill edits with a `generate:bindings`
  re-sync, followed by a `git status --short .opencode .amazonq` drift check.
- **Observation**: in all three repos, the resync exited 0 and produced only the expected regenerated
  mirror files — no stale drift, no manual reconciliation needed, in every one of the three runs.
- **Why it might generalize**: this confirms the existing bindings-sync tooling behaves exactly as
  documented; it is validation that the tool works, not a new fact about how it should behave.
- **Litmus**: FAILS — nothing durable would change from routing "the tool worked as documented" —
  there is no gap to close.
- **Secret/sensitivity gate**: N/A (discarded before this step).
- **Repo-relevance gate**: N/A (discarded before this step).
- **Routing decision**: **discarded** — reason: confirms existing, already-documented tool behavior;
  not a new generalizable fact.

---

## Learning: this session's own CI-polling cadence and tool-usage friction

- **Context**: monitoring `ose-infra` CI in Phase 5 required many polling cycles paced via
  `ScheduleWakeup`, occasionally with shorter or longer gaps than intended between checks.
- **Observation**: polling cadence and scheduling mechanics are an artifact of this particular
  session/tool's interaction pattern, not a fact about the repository's engineering practices.
- **Why it might generalize**: it doesn't — repository-governance learnings should be about the
  codebase/process, not about one executor's specific tool-usage friction in one session.
- **Litmus**: FAILS — no durable repo-governance surface exists (or should exist) to "catch" an
  individual agent's own polling pacing; this is not a repo-governance concern.
- **Secret/sensitivity gate**: N/A (discarded before this step).
- **Repo-relevance gate**: N/A (discarded before this step).
- **Routing decision**: **discarded** — reason: own tool-usage/session friction, not a repo-governance
  concern; no durable home owns this kind of observation.

---

## Summary (all entries terminal)

| Entry                                   | Terminal state | Destination                                                          |
| --------------------------------------- | -------------- | -------------------------------------------------------------------- |
| Single-active-runner CI capacity        | Filed          | `ose-infra` `plans/backlog/2026-07-06__ci-runner-health-monitoring/` |
| Multi-repo propagation pattern          | Discarded      | — (already codified in parity-planning workflows)                    |
| Private-repo safety-gate self-reference | Discarded      | — (self-referential validation, not a new rule)                      |
| Bindings-resync worked as documented    | Discarded      | — (validation, not a learning)                                       |
| Own CI-polling tool-usage friction      | Discarded      | — (not a repo-governance concern)                                    |

Zero entries remain in an open/undecided state. Zero code changes born from a learning landed inline
in this plan. Both safety gates satisfied for the one surviving (filed) entry — no secret/sensitive
content, and the entry is correctly scoped `ose-infra`-only with no cross-route into the public repos.
