---
description: Determining a rule's subject, audience, vendor-neutrality, and governance layer before any placement decision is made.
when_to_use: Use after normalization, to establish the four facts every later step depends on.
---

# Step 2: Classification

Placement is a consequence of classification, not a judgement made alongside it. Four facts are
established here, and every one of them is recorded in the manifest.

## 1. Subject

The narrowest noun the rule constrains — a file class, a tool, a step, a role. The subject
determines the tidy sweep's boundary at Step 6, so an over-broad subject produces an over-broad
diff and an over-narrow one leaves duplicates standing.

## 2. Audience

Who must read this rule for it to bind, and when:

| Audience                                        | Consequence                          |
| ----------------------------------------------- | ------------------------------------ |
| Everyone, before opening any file               | Instruction-surface candidate        |
| Everyone, when they reach a particular activity | Governance layer                     |
| One delegated agent                             | That agent's definition or its skill |
| A machine only                                  | A declaration, not prose             |

Only the first row makes a rule an instruction-surface candidate, and candidacy is not admission —
see Step 4.

## 3. Vendor Neutrality

A rule is **vendor-specific** only when it cannot be stated without naming a harness, a vendor
tool, or a vendor path. Everything else is neutral, including rules that merely happen to be
noticed while using one harness.

This distinction decides the file. A neutral rule written into a binding shim is invisible to
every other harness, which is a silent failure — the rule appears to have landed and does not
bind. Vendor-specific content belongs on a Platform Binding Examples surface with a per-file vendor
exception, and neutral
governance prose says "the primary binding", never a product name.

## 4. Layer

Which question the rule answers, per the governance home table: why the project exists, why an
approach is valued, what documentation rule applies, how to develop or operate, when a multi-step
process runs, or what a disputed term covers.

Record the layer even when the rule is an instruction-surface candidate. If admission fails at
Step 4, this is where it lands instead, with no re-derivation.

## Output

Per rule: subject, audience, neutrality, layer, and the membership verdict for any surface the
rule would touch.

## Related Documents

- [Step 3: Conflict Scan](./step-3-conflict-scan.md) — the next step.
- [Step 4: Placement](./step-4-placement-decision.md) — where these four facts are spent.
