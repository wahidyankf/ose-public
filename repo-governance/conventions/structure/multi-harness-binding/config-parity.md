---
description: Editing one harness's hand-authored config obliges the equivalent change in every other supported harness's config, or a recorded reason why it is absent.
when_to_use: Use when changing any hand-authored harness configuration file, or when recording why a setting exists for one harness and not another.
---

# Cross-Harness Config Parity (Rule 10)

**Rule 10** — When a supported harness's hand-authored configuration changes, the same intent is
applied to every other supported harness's configuration in the same delivery, or its absence is
recorded with a reason.

## What This Covers

The **hand-authored** configs only — the `source` and `vendored` classes. Generated trees are
already kept in step by the emitter and are governed by Rules 4 and 5.

Each supported harness declares its config path in the registry's `harness:` entry. The obligation
extends to what a config _references_: a hook script, a subagent definition, a plugin module. A
hook is not expressed by its config entry alone, so parity that stops at the config file is parity
in name only.

## Parity of Intent, Not of Text

Harnesses differ in what they can express, so the obligation is behavioural. Ask what the change
makes true, then make that true in each harness's own idiom. Identical keys across three schemas is
neither achievable nor the point.

## Absence Is Recorded, and Two Kinds Are Distinguished

- **Exception** — the harness genuinely cannot express the setting. Record the reason.
- **Gap** — the harness _can_ express it and it has not been done yet. Record it as outstanding
  work, never as an exception.

Collapsing the second into the first is the failure this clause exists to prevent: it converts
unfinished work into a permanent-looking decision, and nothing ever revisits it. A claim that a
harness cannot do something is a capability claim, and it is verified before it is recorded.

## Registry and Convention Stay Aligned

The registry is authoritative for **which** configs exist; this convention is authoritative for
**what** the obligation is. A config file present in one and absent from the other is drift, and it
is fixed rather than tolerated.

## Verification

Invariant 6 of the
[harness compatibility quality gate](../../../workflows/quality/harness-quality-gate.md)
checks this rule.

## Related Documents

- [Total Ownership of Binding Files (Rule 8)](./ownership-classes.md) — the three classes.
- [Mechanical Generation and the Parity Guard (Rules 4-5)](./rules-4-to-5.md) — the generated half.
