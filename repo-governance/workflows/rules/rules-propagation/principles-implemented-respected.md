---
description: Which governance principles this workflow implements and which it must not violate while running.
when_to_use: Use when tracing a step of this workflow upward to the principle that justifies it.
---

# Principles Implemented/Respected

## Implemented

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)** —
  the workflow's spine. A rule's placement, its supersessions, its evictions, and its enforcement
  disposition are all recorded rather than inferred. The mandatory three-way disposition at Step 7
  exists so that "unenforced" is a stated decision instead of an absence.
- **[Deliberate Problem-Solving](../../../principles/general/deliberate-problem-solving.md)** —
  classification precedes placement, and the conflict scan precedes the write. The run establishes
  what it is doing before it does it.
- **[Progressive Disclosure](../../../principles/content/progressive-disclosure.md)** — the
  admission test is this principle applied to the instruction surface: the fullest statement lives
  in the layer that owns the subject, and only what must be read unprompted sits above it.
- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)** —
  Step 7 pushes every rule toward a mechanical check, and Step 8 runs the applicable deterministic
  gates. A suspected wider semantic concern goes directly to `rules-checker` as new propagation
  input instead of recursively invoking the independent quality gate.

## Respected

- **[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md)** — the
  tidy sweep is bounded to the rule's subject. Making the repository tidy everywhere is a different
  job with a different owner.
- **[Root Cause Orientation](../../../principles/general/root-cause-orientation.md)** — a failing
  gate is investigated, never bypassed, and a rule is never softened so that it stops failing a
  check. Step 6 fixes the class rather than the sites a single search named.
- **[Documentation-First](../../../principles/content/documentation-first.md)** — a rule that is
  not written down does not bind, which is the whole reason this workflow exists.
- **[Reproducibility](../../../principles/software-engineering/reproducibility.md)** — re-running
  propagation with the same rule changes nothing, and every derived surface is regenerated rather
  than hand-edited.

## Related Documents

- [Conventions Implemented/Respected](./conventions-implemented-respected.md) — the layer below.
