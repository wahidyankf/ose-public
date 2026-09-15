# `sdlc-gate-standard.md` lags both siblings on bareness wording

One-line summary: `ose-public`'s copy of `docs/reference/sdlc-gate-standard.md` is behind both
sibling repos on two name-bound statements about repository bareness — one of which is factually
impossible — and the fix is to adopt the siblings' already-reviewed property-bound wording upstream.

> Surfaced 2026-07-22 during `bare-repo-governance-hardening` Phases 4-5, which corrected both
> siblings and left the source of truth behind.

## Problem / context

Two defects, both from binding a statement to a **repo name** where it should be bound to a
**property of the clone**. Verified by diffing `ose-public`'s working copy against
`git show origin/main:docs/reference/sdlc-gate-standard.md` in each sibling:

1. **§Worktree-Agnostic Execution** says "the private sibling is a bare repo worked only through linked
   worktrees (no primary checkout exists), so worktree-agnostic execution is a hard requirement
   there". Naming one repo implies the other two are not bare. Both siblings are.
2. **The evidence table's "Worktree-agnostic guardrails" row** claims the guardrails were "verified
   from both the primary checkout and a linked worktree in all 3". That is **impossible**: two of the
   three repos have no primary checkout at all, so no such verification can ever have happened in
   them.

The siblings already carry the corrected text and are **byte-identical to each other** on this file
(same SHA-256 for both `origin/main` copies; `ose-public`'s differs). The corrected §Worktree-Agnostic
Execution paragraph states that bareness is a property of a given clone rather than a fixed attribute
of a repo name, names both currently-bare clones, and — deliberately — tells the reader to re-verify
the current layout with the checks named above rather than trusting the sentence to stay current. The
corrected table row states what was verified where, without the impossible claim.

## Why now

The source of truth being behind two downstream copies inverts the parity relationship: anyone
diffing the three repos sees `ose-public` as the odd one out and could "fix" the siblings back to the
wrong text. The wording is already written and already through two PR-review cycles, so the work here
is adoption, not authoring. The second defect is worse than stale — it asserts evidence that cannot
exist, in a document whose job is recording what was verified.

## Prior art / precedents

- **`sdlc-gate-standard.md`** — the document being corrected, and the authority for the cross-repo
  gate shape. [sdlc-gate-standard](../../../docs/reference/sdlc-gate-standard.md)
- **Bare-Repo Base-Worktree Landing Method** — the document that defines how to ask the bareness
  question properly (`git worktree list`, labelled `core.bare` read), which the corrected paragraph
  points at. [bare-repo-landing-method](../../../repo-governance/development/workflow/bare-repo-landing-method.md)
- **`plan-multi-repo-parity-planning` workflow** — the mechanism for keeping the three copies
  aligned, and the reason a lagging source of truth is a problem rather than a curiosity.
  [workflow](../../../repo-governance/workflows/plan/plan-multi-repo-parity-planning.md)
- **Propagation coverage** — a separately tracked sibling concern about how a sibling gets ahead of
  its source.

## Proposed direction (sketch)

Adopt the siblings' wording for both sites, making `ose-public`'s copy agree with the two that
already match — a property-bound §Worktree-Agnostic Execution paragraph plus an evidence-table row
stating what was verified in which clone. Confirm afterwards that all three copies hash identically,
which is the whole point of the change.

## Rough scope & non-goals

In scope: the two sites in `docs/reference/sdlc-gate-standard.md`, and a check for any other
name-bound bareness assertion in the same file.

Out of scope: re-litigating the corrected wording (it is already reviewed and landed twice);
sweeping other documents for the same pattern — that is a separately tracked class-sweep question;
any change to the gate standard itself.

## Risks & open questions

- Bareness genuinely changes over time — the corrected wording says so explicitly — so any repo list
  in this file is a snapshot. The risk is re-introducing a name-bound claim while fixing a
  name-bound claim; the mitigation is keeping the re-verify instruction the siblings' text already
  carries.
- Low risk otherwise: this is a two-site text adoption with a verifiable end state.

## What success looks like + promotion signal

Success: all three copies of `docs/reference/sdlc-gate-standard.md` hash identically, and neither
corrected site asserts a verification that the repository topology makes impossible.

Promotion signal: ready now. This is a small, well-understood correction with the replacement text
already written — it needs a delivery vehicle, not more analysis.
