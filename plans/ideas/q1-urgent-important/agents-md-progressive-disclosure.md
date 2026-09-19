# AGENTS.md progressive-disclosure refactor

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: move detail out of `AGENTS.md` behind `See`-links and pattern-based rules to
restore working headroom under its size budget — without deleting a rule or pointing at an incomplete
target.

> De-promoted 2026-07-21 from a full backlog plan (full detail preserved in git history).

## Problem / context

`AGENTS.md` is the most-loaded instruction surface in the repository and sits at **29,982 bytes**
(measured 2026-07-21) against a 30,000-byte hard fail threshold — under 20 bytes of headroom, so the
next governance addition of any size fails the gate. It is already well over the 27,000-byte warn
threshold, as is the resolved tree the root `CLAUDE.md` pulls in (~37,368 B against a 38,000 B fail /
34,000 B warn). This is not one plan's debt: `AGENTS.md` was 29,995 B when the originating plan filed
this, and 28,333 B at that plan's own baseline — it only ratchets up. The structural tension is that governance plans exist to thread new rules through this exact
file, while the Instruction-File Size Budget Convention names progressive disclosure as the _only_
sanctioned remediation — and nothing forces a plan author to notice the collision until a gate fires
mid-execution.

## Why now

The file is under 20 bytes from its ceiling; the next rule addition is blocked. This surfaced during
`parallel-orchestration-shared-machine-governance`, and every future governance plan hits the same
wall until headroom is restored.

**The ceiling has now blocked a real correction (2026-07-22, `bare-repo-governance-hardening`).**
The private sibling's `AGENTS.md` gained a one-clause bareness carve-out to §Delivery Mode — 23,902 → 24,096
bytes, comfortably inside its passing band. `ose-public` **cannot absorb the same clause**: with
under 20 bytes of headroom there is no room for a clause of any size. So a downstream sibling now
leads the source of truth on the repo's most-loaded instruction surface, and the gap cannot be closed
until progressive disclosure runs. The ceiling is no longer a hypothetical future obstruction.

## Prior art / precedents

- **Instruction-File Size Budget Convention** — the gate that fails `AGENTS.md` over threshold and
  names progressive disclosure as the sole sanctioned remediation.
  [budget convention](../../../repo-governance/conventions/structure/governance-word-budget.md)
- **Progressive Disclosure principle** — the repo principle this refactor applies to the
  most-loaded instruction surface.
  [principle](../../../repo-governance/principles/content/progressive-disclosure.md)
- **Progressive disclosure (Nielsen Norman)** — the origin UX concept of showing summaries and
  deferring detail behind a request.
  [nngroup](https://www.nngroup.com/articles/progressive-disclosure/)
- **AGENTS.md standard** — the open instruction-file format this file implements, whose size is
  under refactor. [agents.md](https://agents.md/)

## Proposed direction (sketch)

- Identify the highest-byte inline-expanded sections that already have a complete canonical home in
  `repo-governance/`, `docs/`, or a per-app `README.md`, and replace each with a one-line summary plus
  a `See` link — but only after diffing the target against ground truth to prove it covers every case
  the inline text covered.
- Convert enumerations to patterns where a pattern is both complete and shorter (e.g. "every `prod-*`
  and `stag-*` ref is a deploy target — never commit directly").
- Re-measure and confirm `AGENTS.md` and the resolved tree land back in the target band, not merely
  under fail.

## Rough scope & non-goals

In scope: summary-plus-link replacement of proven-complete sections and enumeration-to-pattern
conversions, landing both surfaces in the target band.

Out of scope (for now): raising thresholds (the budget convention forbids it); deleting any rule;
moving content into another auto-loaded file (that only relocates bytes within the resolved tree);
compressing safety guardrails — the secrets/`.env` rules, the Git Identity Guardrail, and the
environment-branch rule are trimmed last and only via a complete target.

## Risks & open questions

- The known hazard to avoid: a prior compression pass replaced an inline enumeration with a pointer to
  an _incomplete_ table, leaving three deploy targets uncovered by "never commit directly" — now
  recorded as Forbidden Anti-Fix 4. Text search cannot find omissions, so every `See`-link swap needs
  a real diff against ground truth.
- How much byte savings is reachable without touching guardrails is unknown until the section audit is
  done — no target-band-landing headroom has been measured yet. (open)
- The blocked bareness carve-out above sets a floor on how much headroom is _enough_: whatever this
  refactor recovers must at minimum accommodate the clause the sibling already carries, plus the
  ordinary growth that has ratcheted this file upward all along. (open)

## What success looks like + promotion signal

Success: `./rhino governance word-budget validate` exits 0 with `AGENTS.md` at or under its
target threshold and no warn-level message for either `AGENTS.md` or the resolved tree, while every
removed rule still traces to a reachable canonical home and every safety guardrail remains inline and
complete. Ready to re-promote once a section-by-section audit confirms enough proven-complete link
targets and pattern conversions exist to land in the target band without trimming any guardrail.
