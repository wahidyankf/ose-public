---
description: "Sweeps the repo-rules corpus for volume that carries no obligation — fragmentation overhead, cross-surface duplication, non-normative scaffolding, dead rules — and hands every reduction to rules-propagation."
when_to_use: "Use when the rule corpus is due a recurring volume sweep, never as remediation for one file failing its word budget."
---

# Repository Rules Grooming Workflow

The rule corpus grows by accretion. Word budgets push content into shards, each carrying
frontmatter, a `Contents` line, a README entry, and cross-links; the same obligation gets restated
on a second surface; a rule outlives its subject. None of that is obligation — it is
**representation**, and it is what this workflow removes.

**Reduction target.** Volume that carries no obligation. Four candidate classes only:
fragmentation overhead, cross-surface duplication, non-normative scaffolding, and dead rules.
Nothing else is admitted.

**Non-writing invariant.** [rules-propagation](../quality/rules-propagation.md) is the sole writer of every
rule edit. This workflow discovers, ranks, and hands off; it never edits a rule surface, which
leaves conflict scanning, placement, and enforcement disposition with the workflow that owns them.

**This is not prose compression.** Rewriting a rule's wording to save words violates propagation's
[semantic-preservation hard gate](../quality/rules-propagation.md), which forbids generalizing, weakening,
compressing away, or paraphrasing a material qualifier; the
[word-budget convention](../../conventions/structure/governance-word-budget-remediation.md)
separately forbids ever compressing a safety guardrail. Grooming deletes text that carries no
obligation; it never rewrites text that does. A file over its word budget is remediated by
progressive disclosure, not by scheduling a grooming run.

Composed: `rules-checker` discovers and verifies, propagation writes at Step 6, and
[rules-quality-gate](../quality/rules-quality-gate.md) returns the verdict at Step 8.

## Goal and Termination

**Goal**: Reduce the size of the repository's rule corpus without reducing its normative content, by identifying representation that carries no obligation and routing each reduction through the sole writer of rule edits

**Termination**: Every manifest item is landed, rejected, or deferred with a recorded reason, the post-run obligation inventory differs from the pre-run inventory only by the approved retirements, the rules quality gate returns a passing verdict, and the run and its metrics delta are recorded; halts on any unapproved obligation loss

## Inputs

- **`scope`** (string, optional, default `repo-rules corpus`) — Path prefixes to sweep, comma-separated. Defaults to the full repo-rules corpus as the Membership Test defines it. Narrowing is permitted; the census still reports corpus-wide metrics so a partial sweep cannot misreport overall progress.
- **`classes`** (enum: fragmentation, duplication, scaffolding, retirement, optional, default `fragmentation,duplication,scaffolding,retirement`) — Which candidate classes this run considers. Multi-valued. All four run by default; naming a subset suppresses the omitted sweeps entirely rather than discovering and skipping them. Discovery is never the safeguard — Step 5 gates every retirement per item, and no default makes a removal automatic.
- **`max-concurrency`** (number, optional, default `3`) — Background agents run concurrently — the N in the N+1 model. Never self-promoted beyond the declared value.
- **`dry-run`** (boolean, optional, default `false`) — Emit the census, manifest, and obligation inventory; hand nothing to propagation.

## Outputs

- **`grooming-manifest`** (file, pattern `local-tmp/rules-grooming/rules-grooming__*__manifest.md`) — Ranked candidates with class, measured yield, semantic risk, and per-item disposition
- **`obligation-inventory`** (file-list, pattern `local-tmp/rules-grooming/rules-grooming__*__obligations-{pre,post}.md`) — The distinct-obligation snapshots whose diff is the run's preservation proof
- **`final-status`** (enum: no-op, groomed, halted, partial)

## Contents

- [Purpose and When to Use](./rules-grooming/001-purpose-and-when-to-use.md) — what it reduces; the recurrence trigger.
- [Scope Boundary and the Non-Writing Invariant](./rules-grooming/002-scope-boundary-and-non-writing-invariant.md) — the four classes; why it never writes.
- [Steps 0-2](./rules-grooming/003-steps-0-2-authorization-census-and-inventory.md) — authorization, corpus census, obligation inventory.
- [Steps 3-4](./rules-grooming/004-steps-3-4-candidate-discovery-and-ranking.md) — the four discovery sweeps; yield over risk.
- [Steps 5-6](./rules-grooming/005-steps-5-6-checkpoint-and-handoff.md) — human checkpoint; propagation hand-off.
- [Reabsorption Mechanics](./rules-grooming/006-reabsorption-mechanics.md) — the packing limits; what a merge must carry.
- [Scaffolding Admission](./rules-grooming/007-scaffolding-admission.md) — the two tests a deletion must pass.
- [Step 7](./rules-grooming/008-step-7-preservation-verification.md) — the preservation diff.
- [Step 8](./rules-grooming/009-step-8-governance-verdict.md) — the mandatory governance verdict.
- [Step 9](./rules-grooming/010-step-9-record-and-recurrence.md) — the record; the re-run condition.
- [Success Criteria](./rules-grooming/011-success-criteria.md) — Gherkin, run lifecycle.
- [Success Criteria — Candidate Classes](./rules-grooming/012-success-criteria-candidate-classes.md) — Gherkin, per class.
- [Refused Reductions](./rules-grooming/013-refused-reductions.md) — the six permanent exclusions.
- [Success Criteria — Scaffolding and Protection](./rules-grooming/014-success-criteria-scaffolding-and-protection.md) — Gherkin, scaffolding and entry points.
- [Termination Criteria](./rules-grooming/015-termination-criteria.md) — no-op, groomed, halted, partial.
- [Related Workflows and Documentation](./rules-grooming/016-related-workflows-and-documentation.md) — what runs before and after it.
