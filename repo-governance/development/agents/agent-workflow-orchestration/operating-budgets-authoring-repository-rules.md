---
description: "Covers the operating-budget rule for authoring and propagating repository-wide rule changes."
when_to_use: Use when a rule change needs to be authored and propagated across the repository, or to find the workflow that rule work enters through.
---

# Operating Budgets — Authoring and Propagating Repository Rules

These budgets bound how agents spend two scarce resources — external API rate limits and token burn — and how repository rules themselves are created and kept in sync. They apply to every agent and to the main conversation, across the OSE repositories — the private sibling and `ose-public`.

## Authoring and Propagating Repository Rules

Rule work runs through the [rules-propagation workflow](../../../workflows/rules/rules-propagation.md), which is entered automatically the moment a request implies a rule is being created, updated, superseded, or deleted — however that request is phrased, and including any edit to a repo-rules surface. The workflow composes the agents rather than replacing them: `rules-maker` remains the canonical maker for `repo-governance/` content and `rules-checker` validates, while propagation itself applies every edit as sole writer. Invoking the maker directly skips the normalization, conflict scan, placement, and enforcement-disposition steps, which is the failure this routing exists to prevent.

**Enforcement disposition — unenforced by decision.** Two mechanisms make an ad-hoc rule edit
unlikely: an agent skill that fires on rule-shaped phrasing, and a pre-write reminder that fires on
any write to a repo-rules surface. Neither _fails_. The reminder is warn-only by deliberate choice,
so that it can never deadlock the propagation workflow's own writes — and a check that cannot fail
is not coverage. A blocking variant was considered and declined; enforcement is review-time.

A portable rule is authored with `rules-maker` in one repository per rules-propagation run.
When the run finishes, Step 9 records the other OSE repository as a sibling obligation and a later
run carries the same canonical change there; no other repository is a propagation target. Each
repository's ready PR merges on its own hardened prerequisites and merge opportunity — never hold
one solely to synchronize with its sibling — while the recorded obligation keeps any temporary gap
visible until convergence. Use
[plan-multi-repo-parity-planning](../../../workflows/plan/plan-multi-repo-parity-planning.md) for a
planned cross-repository change and see
[Related Repositories §Sync cadence](../../../../docs/reference/related-repositories.md#sync-cadence).
