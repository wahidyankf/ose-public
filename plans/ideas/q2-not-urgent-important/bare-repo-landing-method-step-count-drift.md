# The landing method says seven steps and has eight

One-line summary: `bare-repo-landing-method.md` numbers **eight** steps in its landing sequence while
its own frontmatter and a sub-folder index call it "the seven-step landing sequence" — so the summary
a reader meets first understates the procedure by exactly the step the document exists to add.

> Surfaced 2026-07-22 during `bare-repo-governance-hardening` Phase 6, by `pr-review-maker` on a pull
> request in another repository. Rewritten to `ose-public`-local scope: each repository now owns its own
> copy of this document, so the correction is made here alone.

## Problem / context

The landing sequence in
[`bare-repo-landing-method.md`](../../../repo-governance/development/workflow/bare-repo-landing-method.md)
is numbered 1-8. Step 8 is **"Reconcile local `main`"**, annotated in the document itself as "the step
most often missing in practice" — it is the defect the whole document was written to close.

Surfaces that describe that sequence as seven-step, found by `grep -rn "seven-step"` over
`repo-governance/`:

| Surface                                                        | What it says                      |
| -------------------------------------------------------------- | --------------------------------- |
| `bare-repo-landing-method.md` frontmatter `description`        | "the seven-step landing sequence" |
| `bare-repo-landing-method/README.md` frontmatter `description` | "the seven-step landing sequence" |

The count is wrong consistently, because the indexes were written from the frontmatter and the
frontmatter was written before the reconcile step was promoted into the numbered list. The
sub-folder index entry for the numbered-steps page already says "eight-step", so the document set
now contradicts itself.

A secondary observation from the same read, worth folding into whatever fixes this rather than
filing separately: index entries must key on the **property** (`core.bare=true`, "no primary
checkout"), never on repo names, because topology flips per clone — the document's own central rule.

## Why now

The document is new and normative, and its frontmatter is the first thing a reader or an index
generator sees.
An off-by-one in a summary is cheap in isolation; this particular off-by-one drops the count by
exactly the step the document was authored to introduce, so a reader who trusts the summary and skims
the list is being steered toward the original defect.

It is also a clean instance of a pattern this repo keeps paying for: a fact stated in one place and
summarized in several, where the summaries are updated by hand and drift silently. Nothing checks
that a "N-step" claim matches the number of numbered steps in the thing it describes.

## Prior art / precedents

- **Fix the class, not the sites a finding names** — the review comment named the frontmatter and two
  READMEs; enumerate every site with a per-file verdict before declaring it fixed.
- **Dynamic Collection References Convention** — the existing rule against hardcoding counts of
  dynamic collections in prose. A numbered procedure is not quite a "collection", but the failure
  mode is identical and the convention is the natural place to extend.
  [dynamic-collection-references](../../../repo-governance/conventions/writing/dynamic-collection-references.md)
- **`./rhino md heading-hierarchy validate`** — precedent for a mechanical markdown-structure
  validator in this repo; a "declared step count matches numbered steps" check would live beside it.

## Proposed direction (sketch)

1. **Decide the number, then fix every site in one round.** Either the sequence is eight steps and
   the summaries are wrong, or step 8 belongs outside the numbered list and the list is wrong. The
   first reading is almost certainly correct — step 8 has a numbered entry, a body, and a
   cross-reference — but the choice should be made explicitly rather than by patching the summaries
   to match.
2. **Prefer a phrasing that cannot drift.** "The base-worktree landing sequence" carries the same
   meaning with no number to maintain. If a number is genuinely useful to the reader, it belongs in
   the document body next to the list, not in several summaries maintained by hand.
3. **Property-bind the index entries** while they are being edited — replace any named-repo list
   with the property, matching what the document itself already requires.
4. **Consider a mechanical check.** A validator asserting that any "N-step" claim about a document
   matches that document's numbered-list length is narrow, cheap, and would have caught this at
   authoring time. Worth scoping before committing to it — the pattern may be too rare to justify.

## Rough scope & non-goals

In scope: the step-count claim in every site; any name-bound phrasing in the index entries; a decision on whether the mechanical check is worth building.

Out of scope (for now): renumbering or restructuring the landing sequence itself (the steps are
correct — only the summary of them is wrong); the vestigial `--exclude` flags in PR-body templates,
which are cosmetic and belong with whatever cleans up propagation boilerplate; a general audit of
every "N-step"/"N-phase" claim repo-wide, which should wait until the mechanical-check question is
answered.

## Risks & open questions

- The fix is literally one word per site. Whether it is worth its own pull request now, or worth
  batching with the next substantive change to that file, is a real question and the honest answer may
  be "batch it". (open)
- If the answer is "batch it", this brief needs an owner or it will be forgotten — the failure mode
  that produced the drift in the first place. (open)
- The mechanical check has an obvious false-positive surface: prose legitimately says "a three-step
  process" about things that are not numbered lists. Scoping it to frontmatter `description` fields
  and index entries that link the document they describe might be tight enough. (open)

## What success looks like + promotion signal

Success: `grep -rc "seven-step"` over `repo-governance/` returns zero for this document set, the
surviving phrasing either carries no number or carries a number that matches the list, and the index
entries name the property rather than repo names.

Promotion signal: ready to fold into the next change that touches that file rather than promoted on
its own — a standalone pull request for one word is poor value, but the correction should ride along
the moment anything else opens it.
