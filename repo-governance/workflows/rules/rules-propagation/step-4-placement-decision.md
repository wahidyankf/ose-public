---
description: The instruction-surface admission test, the fallback to a governance layer, and the rule that a threshold is never raised to make a placement fit.
when_to_use: Use after the conflict scan clears, to decide which file a rule is written into.
---

# Step 4: Placement Decision

A rule goes on the **narrowest surface that reaches its audience**. The instruction surface is
tried first, and it is the surface most rules fail to earn.

## Admission Test

An instruction-surface candidate is admitted only when **both** hold:

1. **Necessity.** The rule changes behaviour before any file is opened. If a contributor who never
   read it would still be led to it by the activity it governs, a governance layer reaches them
   just as well, at no budget cost.
2. **Room.** The destination has budget headroom for the statement, or Step 5 can free it.

Necessity is judged first. A rule that fails it is never eligible, however much room exists —
otherwise the instruction surface fills with rules that a link would have delivered.

## Which Instruction File

Neutrality decides, per the Step 2 classification:

- **Vendor-neutral** → the canonical instruction surface. It reaches every harness.
- **Vendor-specific** → that harness's binding shim, under its Platform Binding Examples
  heading, and only there; each vendor name there needs a per-file vendor exception.

A neutral rule placed in a shim is a silent failure, not a compromise. It looks landed and binds
one harness.

## Fallback

A candidate that fails necessity, and every rule that was never a candidate, is written into the
layer recorded at Step 2, in the document that already owns its subject. A new document is created
only when no existing one owns the subject — a rule appended to an unrelated document is a rule
nobody will find.

## The Threshold Is Fixed

A word-budget threshold is **never** raised to accommodate a placement, and no exemption, waiver,
or ignore entry is ever added for one. When a destination has no room, the only two moves are
Step 5's eviction or the fallback. A rule that "fits" because the ceiling moved has not been
placed; the budget has been defeated.

## Output

Per rule: destination file, section, and whether admission succeeded, failed on necessity, or
requires eviction.

## Related Documents

- [Step 5: Eviction Protocol](./step-5-eviction-protocol.md) — when room must be made.
- [Step 6: Write and Tidy](./step-6-write-and-tidy.md) — where the placement is executed.
