---
description: "Plan claims carry no inline confidence labels; web sources are plain citations; plan-checker verifies claims."
when_to_use: "Use when writing or checking how a plan claim records its evidence or its source."
---

# Plan Anti-Hallucination Convention — No Inline Confidence Labels

## The Rule

Plan content in `plans/` carries **no inline confidence label** on any claim. The retired labels are
`[Repo-grounded]`, `[Web-cited]`, `[Judgment call]`, and `[Unverified]`, in any spelling or
decoration (bold, code span, or a qualifier such as `[Web-cited, accessed …]`).

- **Passes**: a search of an active plan for the four retired label tokens returns no match.
- **Violated**: any retired label token appears in an active plan.

Archived plans in `plans/done/` are history and keep whatever labels they shipped with.

## What Replaces the Labels

Removing the label removes a marker, not an obligation. Every verification duty stays in force:

- **Repo claims** are verified against the current commit before they are written, per the
  [Repo-Grounding Rule](./repo-grounding-rule-hard.md). The verification itself is the evidence;
  no marker records it.
- **External claims** carry a plain citation inline: the source URL, the access date, and the
  excerpt the claim relies on. A URL-only citation is still not enough. Multi-page research still goes through `web-researcher`, per
  [Refuse-on-Uncertainty and Web Research](./refuse-on-uncertainty-rule-and-web-research-delegation.md).
- **Expectations and gut targets** are worded as expectations in plain prose — for example "we
  expect review time to drop; no baseline measured" — never as a measured fact.
- **Unverifiable claims** are refused, per the refuse-on-uncertainty rule: skipped, or written as
  an explicit `_Unknown — verify before authoring_` placeholder carried as a delivery or
  open-question item.

## Who Verifies

Verification is `plan-checker`'s job. It checks each non-trivial claim against the repository or
its cited source, files an unverifiable or fabricated claim as a ledger finding under the
[Anti-Pattern Catalog](./anti-pattern-catalog-ap-1-through-ap-4.md), and neither requires a
confidence label nor flags its absence. It reports a retired label still present in an active plan
as one LOW finding per affected file, whose repair strips the label and keeps any URL and access
date as a plain citation.

## Supersession Record

On 2026-10-01 this rule superseded "The Four Confidence Labels", which required one of the four
labels on every non-trivial plan claim and treated an unlabeled claim as `[Unverified]`. The
maintainer judged the labels noisy; verification moved wholly to `plan-checker`'s ledger and checks.
The validation-report verdicts `[Verified]`/`[Error]`/`[Outdated]`/`[Unverified]` of the
[Factual Validation Convention](../../../conventions/writing/factual-validation.md) are a separate
system for checker reports and are unaffected.
