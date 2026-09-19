---
description: Defines how plan authoring detects rule impact and requires a complete repository-local rules-propagation outcome in delivery.md.
when_to_use: Use while assembling the plan-maker handoff whenever planned behaviour or file impacts may change repo rules or enforcement.
---

# Step 4 — Automatic Rule-Impact Handoff

Classify the intended behaviour and annotated file-impact tree against the repository's full
normative surface. This includes instructions, governance conventions/workflows, repository
configuration, enforcement code, targets, hooks, CI, style guides, and generated harness adapters.
Do not wait for a user to name rules-propagation.

For every affected repository, instruct `plan-maker` to add a repository-local outcome to
`delivery.md` in the delivery unit that changes the rule. It must split these into independent,
bootcamp-executable actions:

1. inventory and normalize changed subjects;
2. scan duplicates, contradictions, precedence, and supersessions;
3. decide canonical placement and any instruction-surface eviction;
4. update canonical rules, indexes, configuration, and enforcement machinery;
5. record the three-way enforcement disposition;
6. generate declared harness adapters;
7. run propagation's own verification, which never invokes `rules-quality-gate`; and
8. record the repository-specific manifest, final status, and sibling obligation.

Every action needs the exact repository, input, path or bounded discovery, copyable invocation,
expected observation, failure handling, and evidence destination. Repeat the outcome per affected
repository. A workflow link, one generic “run propagation” checkbox, or another repository's
evidence does not satisfy this handoff. Neither does a reusable checkbox template plus a generic
per-repository invocation: every concrete repository/action pair must be an action checkbox for the
plan-execution 1:1 task mirror.
