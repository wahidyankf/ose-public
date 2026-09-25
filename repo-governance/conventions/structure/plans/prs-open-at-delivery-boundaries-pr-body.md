---
description: What every PR description states about outcome, scope, natural seam, production deployability, reading order, verification, and rollback.
when_to_use: Use when writing or reviewing a PR description.
---

# What Every PR Body Must Carry

Every PR here is read by a human, whatever else reviews it. A readable body states the outcome,
why, scope and non-goals, reading order, verification, and risk/rollback without becoming an
academic paper. `.github/pull_request_template.md` prompts for each in compact form.

1. **The outcome and why the change is needed, not only what changed.** State the intended result
   and the problem it solves in enough
   detail that a reader can judge whether the change answers it. A list of edits is not a reason.
2. **What is in scope, and what is deliberately not** — both stated, each with its reason. A
   non-goal without a reason reads as an oversight; with one it is a decision. This is the
   boundary any invoked review and every human reader use, so leaving it implicit removes the
   reference point
   to.
3. **Where to start reading** — the one file that makes the rest legible.
4. **Which paths to skip** — generated mirrors and mechanical churn, named explicitly.
5. **What was verified and what could go wrong.** Name the checks run, the remaining risk, and the
   safe rollback or containment step.
6. **Why this is one natural delivery seam.** Name the cohesive purpose, explain why the included
   artifacts must land together, and confirm that unrelated purposes are excluded. Do not use LOC
   or file counts to justify, force, or erase the boundary.
7. **Why the resulting `main` state is production-deployable.** State whether user-reachable
   behaviour is complete and active or incomplete and complete-and-inert behind a temporary feature
   flag disabled in production by default. For a flag, name enabled/disabled-path tests and the
   rollout, rollback, and removal record. State the supporting build, test, lint, operational, and
   rollback proof.

**Why this binds prose PRs too.** [Code as
Liability](../../../development/practice/code-as-liability/the-obligation.md) makes a PR adding
code state its cost and benefit, but
[what counts as code](../../../development/practice/code-as-liability/what-counts-as-code.md)
excludes Markdown. Without this rule a rules-and-docs PR — most of this repo's traffic — would
carry no why-obligation at all, and its body would degrade to a changelog. That obligation and
this one are separate: a code PR carries both.

**Reviewers may ask.** A missing, vague, or self-contradicting scope statement is a legitimate
finding, not pedantry — it is the one thing the
[Scope Guard](../../../workflows/pr/pr-review-cycle/scope-guard-no-scope-creep.md) measures
against. Raise it as `clarify` and answer it by editing the body.

**Review scope.** The PR description is in scope whenever semantic review is explicitly invoked.
[`pr-review-docs-maker`](../../../../.agents/agents/pr-review-docs-maker.md) owns whether
the body accurately describes the diff it ships — a body contradicted by the diff is doc drift.
[`pr-review-governance-maker`](../../../../.agents/agents/pr-review-governance-maker.md)
owns whether the required sections are present at all. The body is never frozen by the
correction-record freeze.

**Enforcement**: the template prompts universally; the two reviewers check when invoked.
