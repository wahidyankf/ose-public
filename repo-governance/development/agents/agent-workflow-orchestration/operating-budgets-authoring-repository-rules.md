---
description: "Covers the operating-budget rule for authoring and propagating repository-wide rule changes."
when_to_use: Use when a rule change needs to be authored and propagated across the repository, or to find the workflow that rule work enters through.
---

# Operating Budgets — Authoring and Propagating Repository Rules

These budgets bound how agents spend two scarce resources — external API rate limits and token burn — and how repository rules themselves are created. They apply to every agent and to the main conversation in this repository.

## Authoring and Propagating Repository Rules

Rule work runs through the [rules-propagation workflow](../../../workflows/quality/rules-propagation.md), which is entered automatically the moment a request implies a rule is being created, updated, superseded, or deleted — however that request is phrased, and including any edit to a repo-rules surface. The workflow composes the agents rather than replacing them: `rules-maker` remains the canonical maker for `repo-governance/` content and `rules-checker` validates, while propagation itself applies every edit as sole writer. Invoking the maker directly skips the normalization, conflict scan, placement, and enforcement-disposition steps, which is the failure this routing exists to prevent.

**Enforcement disposition — unenforced by decision.** Two mechanisms make an ad-hoc rule edit
unlikely: an agent skill that fires on rule-shaped phrasing, and a pre-write reminder that fires on
any write to a repo-rules surface. Neither _fails_. The reminder is warn-only by deliberate choice,
so that it can never deadlock the propagation workflow's own writes — and a check that cannot fail
is not coverage. A blocking variant was considered and declined; enforcement is review-time.

A rule is authored with `rules-maker` in one rules-propagation run for this repository only. The run
records no obligation for any other repository, and a ready PR never waits on another repository's
timing. See [Related Repositories](../../../conventions/structure/related-repositories.md#independent-repositories).
