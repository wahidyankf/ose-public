# Correction-Record Freeze (Cycle 2 Onward)

The brief OMITS every `plans/**` hunk (`delivery.md` and `learnings.md` included) that **a fixer
commit introduced** — the prose the loop wrote about its own cycles. Any other `plans/**` hunk is
reviewed **once, in the first cycle in which it appears**, and omitted from every brief after that;
for content present at cycle 1 that is cycle 1. Keep the **PR body** in the brief every cycle — a
human reads it first. Record the omission.

**The test is who wrote it, not where it lives.** This is not generated-file filtering: these files
are excluded because the loop **wrote** them, not because a tool emitted them. A `plans/**` glob is
only a proxy for that, and the proxy fails in one direction — a plan document a human pushes in
cycle 3 matches the glob, was never in a cycle-1 brief, and would otherwise be reviewed by no cycle
at all. Reviewing it once restores the guarantee below without reopening the loop's own record.

**Why the freeze exists.** A loop whose scope contains its own correction record reviews the
falsifiable claims it wrote last cycle, so the surface grows about as fast as it is cleaned and a
zero-finding cycle becomes unreachable. On PR #239 the shipping files stopped changing at cycle 14
while the loop ran to 19, and every finding from `C-72` onward was the record making a claim about
itself and getting it wrong. Cycle 1 still reviews the record, so a plan document that misstates the
change is caught once.

Two carve-outs, both narrower than the freeze:

- **Plans-only PR** — the plan is the shipping surface, so `plans/**` stays in the brief. Recompute
  this status **every cycle**, exactly as the tier is recomputed: a fixer commit adding a
  `specs/**` file turns a plans-only PR into a mixed one mid-loop, and the carve-out lapses from
  that cycle on.
- **Security-sensitive content** — a `plans/**` hunk falling anywhere in
  `pr-review-security-checker`'s charter stays in the **shared** brief regardless of cycle — the
  scout hands every specialist one identical brief, so there is no per-specialist copy to add it
  to.
  That is the **whole** charter as stated in
  [`pr-review-security-checker`'s own Owns section](../../../agents/pr-review-security-checker.md),
  read by reference and never copied here — a copy drifts, and a drifted copy silently narrows or
  widens what stays reviewable. Naming a shortlist would leave the rest reviewed once and then
  frozen out. The freeze is a noise-control device and never narrows a security charter.
