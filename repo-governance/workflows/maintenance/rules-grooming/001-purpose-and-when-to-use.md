---
description: What this workflow reduces in the rule corpus, what it deliberately leaves alone, and the falsifiable recurrence trigger that says a sweep is due.
when_to_use: Use when deciding whether the rule corpus is due a grooming sweep.
---

# Purpose and When to Use

**Purpose**: Sweep the repository's rule corpus and converge it toward the smallest representation
that still carries every obligation — backlog grooming applied to governance rather than to ideas.
Concretely, the workflow re-merges shards whose parent can reabsorb them, collapses an obligation
restated on a second surface down to one canonical home plus `See` links, retires rules whose
subject no longer exists, and hands each of those reductions to
[rules-propagation](../../quality/rules-propagation.md) to write.

Volume is a real cost here, not an aesthetic one. Rules that agents cannot hold, navigate, or
reconcile stop binding, and a corpus that grows faster than it is groomed drifts toward exactly
that. Grooming is the counter-pressure.

## The Gap It Fills

Neither existing rules workflow owns a proactive corpus-wide sweep. Propagation's
[Purpose and Scope](../../quality/rules-propagation.md) puts "the wide sweep" out of scope
and points at the quality gate; the
[rules-quality-gate](../../quality/rules-quality-gate.md) inspects only the affected rule and its points of
use, and never audits unrelated governance. Both are triggered by a rule change. Grooming is
triggered by corpus state, which is why it is a separate workflow rather than a step inside either.

## When to Use

Run when any one of these is true. Each is measured against the corpus the
[Membership Test](../../../glossary/repo-rules-membership-test.md) admits, and each is falsifiable
from the census at Step 1.

- **Metadata ratio** — YAML frontmatter lines divided by total corpus lines reaches **25%**. The
  measurement taken on 2026-09-07 was 23.7% (30,397 of 128,383 lines), which is the baseline this
  threshold sits just above.
- **Corpus growth** — file count has risen by **15%** or more across the trailing **180 days**.
- **Elapsed time** — **180 days** since the last grooming delivery landed on `main`.

**The baseline is git, not a tracked file.** Both conditions above are measured by re-running the
Step 1 census against a past revision and comparing — `git log` supplies the dates, and any commit
supplies the corpus it contained. No state file records them.

That is deliberate. A run log binds nothing, and `repo-governance/` is the tree that binds; run
history is what the PR and the commit trail already are. A tracked log would also be a second source
of truth about when a run happened, free to drift from the history that actually establishes it.

**First run.** With no prior grooming delivery in the history, the elapsed condition is satisfied by
definition and the run proceeds. Without this clause the two history-dependent conditions can never
fire and the metadata-ratio condition alone gates the workflow, leaving it unrunnable at any ratio
below 25%.

Whichever fires first is the trigger. It is a recurring commitment against the corpus, not a
one-time cleanup wearing a recurring name. A maintainer, or an agent acting on their behalf,
invokes it explicitly; it never self-triggers, and no other workflow may start it.

## When Not to Use

- **A file failed its word budget.** That is remediated by progressive disclosure under
  [Governance Word-Budget Remediation](../../../conventions/structure/governance-word-budget-remediation.md).
  Scheduling a grooming run instead is a category error: grooming makes the corpus smaller, not one
  file compliant, and it may well conclude that the file's shards should be merged back in.
- **A rule needs writing, changing, or superseding.** That is
  [rules-propagation](../../quality/rules-propagation.md), directly.
- **A rule's meaning is in question.** That is the
  [rules-quality-gate](../../quality/rules-quality-gate.md), which grooming never invokes and is never invoked
  by.
- **The corpus is merely long.** Length alone is not a finding. Every candidate must belong to one
  of the four classes and carry a measured yield.
