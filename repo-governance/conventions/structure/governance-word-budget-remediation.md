---
description: Enforcement-point detail, the progressive-disclosure fix, and forbidden anti-fixes for the word-budget gate
when_to_use: Use when a file fails the word-budget gate and you need the remediation steps.
---

# Governance Word-Budget Remediation

Detail split out of the
[Governance Word-Budget Convention](./governance-word-budget.md) so that doc fits its own
word ceiling (progressive disclosure applied to itself).

## Enforcement Points

1. **Pre-push (primary)**: `.husky/pre-push` runs `governance word-budget validate`, gated on
   changed paths touching a monitored surface.
2. **PR quality gate (CI)**: `npx nx run Rhino:governance-word-budget:validation` runs on every
   PR and push to `main`.
3. **Standalone deterministic audit**: `./rhino governance traceability validate` can include this category
   alongside `layer-coherence`, `traceability-audit`, and `vendor-audit`. The rules quality gate
   delegates word-budget enforcement to pre-push/CI and passes exact lifecycle evidence to
   `rules-checker`; the checker does not consume or rederive word-budget findings there.

No pre-commit surface is declared for this gate (FR-1.14): a whole-tree scan on every commit buys
no additional coverage over the pre-push/CI enforcement points above, and
The retired in-tree convention audit did not include a word-budget member; the declared Rhino
governance word-budget validator now owns that check.

## When the Gate Fails

**The only sanctioned remediation is progressive disclosure.** Replace inline-expanded content with
a one-line summary and a `See` link to its canonical home. The detail stays fully reachable, just
no longer inlined.

**Naming the shards.** A shard is not a step, so its filename carries **no** ordinal; the parent
index carries order. See [Ordinal Filename Prefixes](./ordinal-filename-prefixes.md).

### Forbidden Anti-Fixes

1. **Delete a rule** — removes coverage; rules must stay reachable.
2. **Compress to dense prose** — stripping line breaks hurts both agent and human readability.
3. **Split into another auto-loaded file** — moves words without shrinking the resolved-tree total,
   and may exceed a per-file harness limit.
4. **Point at an incomplete target** — a `See` link to a table or section that omits cases the
   inline text covered is rule deletion in disguise. Diff the target against ground truth before
   replacing an enumeration with a link — text search cannot find omissions. When the target is
   incomplete: complete it first, or restate the inline rule as a **pattern** rather than an
   enumeration (e.g. "every `prod-*`/`stag-*` ref is a deploy target" instead of listing them),
   which is both shorter and immune to new entries appearing. See
   [Anti-Pattern 10: Enumeration-Based Guards](../../development/agents/anti-patterns/anti-pattern-10-enumeration-based-guards.md#anti-pattern-10-enumeration-based-guards-denylist-guards-that-fail-open).

**Never compress a safety guardrail to save words.** Secrets/`.env` rules, the Git Identity
Guardrail, and environment-branch rules trim **last and only via a complete target** — never by
dropping cases or dense-prose compression.

If progressive disclosure cannot make one file sufficient, the file remains over budget; do not
raise its class ceiling to make it fit. A threshold recalibration is a separate, class-wide policy
change. It requires evidence that the existing signal is broadly non-actionable or that harness
capacity or repository policy changed, a documented rationale, and validation of the whole class.
The new value remains a capacity ceiling, not a content target.

## Vision Supported

Serves the [Open Sharia Enterprise Vision](../../vision/open-sharia-enterprise.md) the same way its
parent convention does: reliable instruction delivery across the multi-harness agent ecosystem.

## Principles Implemented/Respected

- **[Progressive Disclosure](../../principles/content/progressive-disclosure.md)**: this document
  is itself an application of the principle — detail split from its parent to respect a word
  ceiling.
- **[Minimal Sufficiency](../../principles/general/simplicity-over-complexity/minimal-sufficiency-test.md)**:
  thresholds bound necessary content; they do not justify adding or retaining unnecessary content.

## Related Conventions

- [Governance Word-Budget Convention](./governance-word-budget.md) — thresholds and monitored
  surfaces
- [Ordinal Filename Prefixes](./ordinal-filename-prefixes.md) — naming split shards
