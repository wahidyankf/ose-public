---
description: "Defines the code-related qualifier used by the optional cycle's exit and ceiling rules."
when_to_use: "Use when deciding whether an outstanding MEDIUM/HIGH/CRITICAL finding blocks the optional cycle."
---

# What Code-Related Means

Every exit and block rule in this workflow is gated on **code-related** MEDIUM/HIGH/CRITICAL
findings, not on findings in general. The qualifier is doing real filtering work, so it needs a
definition rather than an intuition.

**A finding is code-related when it names a defect in an artifact this PR ships.** The shipping
artifact is whatever the PR exists to put on `main`: executable source, configuration, specs, and —
this is the half most easily misread — governance prose, agent definitions, and skill files. On a
PR whose whole purpose is to change the rules, the rules **are** the artifact. A CRITICAL in a
convention blocks exactly as a CRITICAL in a function does.

On a plans-only PR, the plan is the shipping artifact. Its
[primary mandatory probe](cost-control-noise-control-mechanics-plans-only-route.md)
covers exposed real secrets, credentials, or other values that grant access. Also review the plan's
architecture, domain criteria, substantive document quality, and governance conformance. Do not
treat an eventual implementation artifact's absence as a defect; review it when its implementation
PR ships.

**Two things are not code-related**, and neither blocks:

- **The correction record.** Prose introduced by a fixer commit after cycle 1 — what the loop
  wrote about its own cycles. Authorship is the test, not path: a `plans/**` document a human
  pushes mid-loop is reviewed once, in the cycle it first appears. See the correction-record
  freeze in [Loop-Exit and Block Rules](../../../workflows/quality/pr-review-quality-gate/003-clean-audits-and-the-ceiling.md). On a plans-only PR the
  plan is the shipping artifact, so the exclusion does not apply.
- **The review conversation.** Review comments, replies, and disposition blocks describe the work;
  they are not the work.

## Why the Definition Has to Be Written Down

Read literally as "about executable code", the qualifier would make the loop vacuous on any PR that
ships only prose — the exit condition would be satisfied on cycle 1 no matter how many real defects
the specialists found, because none of them would be about code. Most PRs in this repository are
exactly that shape.

The loop has always been run the broad way in practice. That is the point: a rule whose correct
reading exists only in observed behaviour is one careful reader away from being applied the other
way, and the reader who applies it literally will be the one merging a CRITICAL.

## The Test

Ask what the PR would be reverted for. If a reader on `main` a month from now would call the finding
a defect in what shipped, it is code-related and it blocks.

## Enforcement

None automated. A violation is visible as a cycle-blocking finding whose remedy nobody on `main`
would call a defect in what shipped. The ordinary merge protocol remains independent.
