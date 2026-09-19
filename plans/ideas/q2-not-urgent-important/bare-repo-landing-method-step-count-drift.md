# The landing method says seven steps and has eight

One-line summary: `bare-repo-landing-method.md` numbers **eight** steps in its landing sequence while
its own frontmatter and both governance indexes call it "the seven-step landing sequence" — in all
three repos — so the summary a reader meets first understates the procedure by exactly the step the
document exists to add.

> Surfaced 2026-07-22 during `bare-repo-governance-hardening` Phase 6, by `pr-review-maker` on
> the private sibling's PR #17. Flagged there as "upstream — do not fix here", correctly: the file is under a
> byte-identity invariant, so editing it in a sibling would manufacture the drift that PR closed.

## Problem / context

The landing sequence in
[`bare-repo-landing-method.md`](../../../repo-governance/development/workflow/bare-repo-landing-method.md)
is numbered 1-8. Step 8 is **"Reconcile local `main`"**, annotated in the document itself as "the step
most often missing in practice" — it is the defect the whole document was written to close.

Three surfaces describe that sequence as seven-step:

| Surface                                                 | What it says                                    |
| ------------------------------------------------------- | ----------------------------------------------- |
| `bare-repo-landing-method.md` frontmatter `description` | "the seven-step landing sequence"               |
| `repo-governance/development/README.md`                 | "the seven-step base-worktree landing sequence" |
| `repo-governance/development/workflow/README.md`        | "the seven-step base-worktree landing sequence" |

All three exist in **each** of `ose-public` and the private sibling — six sites, verified by
`grep -c "seven-step"` against each repo's `origin/main` blobs. The count is wrong everywhere,
consistently, because the indexes were written from the frontmatter and the frontmatter was written
before the reconcile step was promoted into the numbered list.

Two secondary observations from the same read, worth folding into whatever fixes this rather than
filing separately:

- Both index entries name specific repositories as the ones with no primary checkout. That is
  name-bound phrasing in the index for a document whose
  central rule is that carve-outs must key on the **property** (`core.bare=true`, "no primary
  checkout"), never on repo names, because topology flips per clone. Any "today" hedge is doing a
  lot of work.
- The private-sibling PR body's verification line quotes
  `--exclude apps/ayokoding-www/content --exclude apps/ose-www/content`. Neither path exists in
  the private sibling. Harmless no-ops, but they are vestigial excludes copy-pasted from the `ose-public`
  invocation, and they will keep propagating unless someone stops quoting them.

## Why now

The document is new, normative, and byte-identical across three repos — which means every future
propagation copies the wrong number forward, and the two indexes are the first thing a reader sees.
An off-by-one in a summary is cheap in isolation; this particular off-by-one drops the count by
exactly the step the document was authored to introduce, so a reader who trusts the summary and skims
the list is being steered toward the original defect.

It is also a clean instance of a pattern this repo keeps paying for: a fact stated in one place and
summarized in several, where the summaries are updated by hand and drift silently. Nothing checks
that a "N-step" claim matches the number of numbered steps in the thing it describes.

## Prior art / precedents

- **Fix the class, not the sites a finding names** — the review comment named the frontmatter and two
  READMEs; the actual population is nine sites across three repos. Enumerate per repo with a
  per-file verdict before declaring it fixed.
- **Propagation checklist under coverage** — the sibling brief on propagation steps whose checklists
  do not cover every surface the change touches.
- **Dynamic Collection References Convention** — the existing rule against hardcoding counts of
  dynamic collections in prose. A numbered procedure is not quite a "collection", but the failure
  mode is identical and the convention is the natural place to extend.
  [dynamic-collection-references](../../../repo-governance/conventions/writing/dynamic-collection-references.md)
- **`./rhino md heading-hierarchy validate`** — precedent for a mechanical markdown-structure
  validator in this repo; a "declared step count matches numbered steps" check would live beside it.
- **Multi-repo parity planning workflow** — the process any three-repo byte-identical correction must
  run through.
  [plan-multi-repo-parity-planning](../../../repo-governance/workflows/plan/plan-multi-repo-parity-planning.md)

## Proposed direction (sketch)

1. **Decide the number, then fix all nine sites in one round.** Either the sequence is eight steps and
   the summaries are wrong, or step 8 belongs outside the numbered list and the list is wrong. The
   first reading is almost certainly correct — step 8 has a numbered entry, a body, and a
   cross-reference — but the choice should be made explicitly rather than by patching the summaries
   to match.
2. **Prefer a phrasing that cannot drift.** "The base-worktree landing sequence" carries the same
   meaning with no number to maintain. If a number is genuinely useful to the reader, it belongs in
   the document body next to the list, not in three summaries maintained by hand.
3. **Property-bind the index entries** while they are being edited — replace any named-repo list
   with the property, matching what the document itself already requires.
4. **Consider a mechanical check.** A validator asserting that any "N-step" claim about a document
   matches that document's numbered-list length is narrow, cheap, and would have caught this at
   authoring time. Worth scoping before committing to it — the pattern may be too rare to justify.

## Rough scope & non-goals

In scope: the step-count claim in all nine sites across the three repos; the name-bound phrasing in
the two index entries; a decision on whether the mechanical check is worth building.

Out of scope (for now): renumbering or restructuring the landing sequence itself (the steps are
correct — only the summary of them is wrong); the vestigial `--exclude` flags in PR-body templates,
which are cosmetic and belong with whatever cleans up propagation boilerplate; a general audit of
every "N-step"/"N-phase" claim repo-wide, which should wait until the mechanical-check question is
answered.

## Risks & open questions

- Fixing the frontmatter changes the bytes of a file under a three-repo byte-identity invariant, so
  this needs a full parity round — three PRs, three review cycles — for what is literally one word
  per site. Whether that cost is worth paying now, or worth batching with the next substantive `<C1>`
  change, is a real question and the honest answer may be "batch it". (open)
- If the answer is "batch it", this brief needs an owner or it will be forgotten — the failure mode
  that produced the drift in the first place. (open)
- The mechanical check has an obvious false-positive surface: prose legitimately says "a three-step
  process" about things that are not numbered lists. Scoping it to frontmatter `description` fields
  and index entries that link the document they describe might be tight enough. (open)

## What success looks like + promotion signal

Success: `grep -rc "seven-step"` returns zero across both parity repos, the surviving phrasing either
carries no number or carries a number that matches the list, and the index entries name the property
rather than two repo names.

Promotion signal: ready to fold into the next `<C1>`-touching change rather than promoted on its own —
a standalone three-repo parity round for one word is poor value, but the correction should ride along
the moment anything else opens that file.
