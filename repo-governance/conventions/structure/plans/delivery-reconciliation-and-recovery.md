---
description: Places governance and architecture reconciliation with the change and gives conditional recovery work explicit terminal states.
when_to_use: Use when delivery may change repository rules, documented C4 elements, or invoke rollback/recovery work.
---

# Delivery Reconciliation and Conditional Recovery

## Purpose

Governance, architecture, and recovery state must finish with the implementation that changes them,
not disappear into a generic final cleanup task.

## Standards

- Plan authoring MUST automatically classify rule impact from both the intended behaviour and the
  annotated file-impact tree. A plan is rule-affecting when delivery may add, change, supersede, or
  delete any normative surface—including instructions, governance conventions/workflows,
  repository configuration, enforcement code, targets, hooks, CI, style guides, or generated
  harness adapters. Do not wait for the user to request propagation by name.
- For every affected repository, `delivery.md` MUST include a repository-local rules-propagation
  outcome in the delivery unit that changes the rule. A generic “run rules-propagation” checkbox is
  insufficient. The outcome must enumerate separate, executor-tagged actions to:
  1. inventory and normalize the changed rule subjects;
  2. scan semantic duplicates, contradictions, precedence, and supersessions;
  3. decide the canonical home and any instruction-surface eviction;
  4. update canonical rules, indexes, configuration, and enforcement machinery;
  5. record one canonical [Step 7 enforcement disposition](../../../workflows/rules/rules-propagation/step-7-enforcement-disposition.md)
     per rule: `Covered`, `Gated`, or `Unenforced by Decision`, with the required gate evidence or
     rationale; an unfalsifiable rule halts at intake, not as a successful delivery disposition;
  6. generate declared harness adapters instead of hand-editing mirrors;
  7. run the rules-propagation verification commands and `rules-quality-gate`; and
  8. record the repository-specific propagation manifest path, final status, and sibling
     obligation.
- Each action above follows the granular checklist rule: exact repository, inputs, paths or bounded
  discovery, copyable command/workflow invocation, expected observation, failure handling, and
  evidence destination. Multi-repository plans repeat the outcome per affected repository; one
  repository's manifest or gate never proves another's propagation. A reusable checkbox template
  plus “execute this template for repository X” is not repetition: every concrete repository/action
  pair must exist as its own checkbox so plan-execution can materialize the strict 1:1 task mapping.
- If delivery changes a documented C4 element or relationship, update the exact as-built C4 source
  in the implementation phase that changes it. Do not defer it to generic documentation cleanup.
- Every conditional recovery or rollback packet names its trigger, decision owner, procedure, and
  proof. If the trigger never occurs, close the packet with `Not triggered` plus evidence; never
  leave it ambiguously unchecked.

## Examples

The phase that introduces a service boundary also updates the affected C4 container diagram. A
rollback packet closes as `Not triggered — deployment health and reconciliation evidence <links>`
when its trigger remains false.

## Validation

Plan quality review fails a rule-affecting plan that did not automatically include the complete
per-repository propagation outcome. Execution review checks the as-built manifest, enforcement
dispositions, bindings, gates, sibling obligation, exact C4 reconciliation, and a terminal
disposition for every conditional packet.
