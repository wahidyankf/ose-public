# AyoKoding mermaid diagram remediation

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: 636 mermaid violations across 241 `apps/ayokoding-www/content` tutorial files
became visible when a validator bug was fixed; remediate them and drop the temporary CI exclude.

> Surfaced 2026-07-21 while fixing the `detect_kind` leading-comment bug in `./rhino md mermaid validate`.

## Problem / context

`./rhino md mermaid validate` silently skipped **any** mermaid block whose first line inside the
fence was a `%%` comment. `detect_kind` skipped blank lines but treated a comment as an unrecognised
diagram type, returned `DiagramKind::Other`, and `validate_one_block` then returned early — bypassing
every label-length, width, depth, and subgraph rule for that block.

**2,851 of 3,905 mermaid blocks (73%), across 637 files, opened with a `%%` line** and were therefore
never validated. The colour-palette header used repo-wide is a `%%` line, and the Diagrams Convention
itself _mandates_ a `%%` justification comment above the directive for the `TD` exception — so the
diagrams most in need of checking were exactly the ones skipped.

With the parser fixed, 665 violations appeared. 29 were fixed immediately (governance, plans, docs,
specs, ose-www). The remainder is concentrated in one tree:

| Tree                         | Findings  | Files |
| ---------------------------- | --------- | ----- |
| `apps/ayokoding-www/content` | **636**   | 241   |
| everything else              | 0 (fixed) | —     |

Breakdown of the 636: 465 `label_too_long` (node labels over the 30-char-per-line limit) and 171
`width_exceeded` (chain depth over 4 in `LR`, or over 4 nodes at one rank in `TD`). A further 8
`subgraph_density` findings are advisory warnings, not violations, and are excluded from the 636.

### A second instance of the same class (2026-07-22)

Surfaced during `bare-repo-governance-hardening` Phase 4: a sibling repo's `main-ci` was **already red
before the phase started**, failing `Mermaid diagram validation (all .md)` with 3 violations in an
archived `plans/done/` file — and nobody had seen it. Two reasons compounded. The workflow is
**schedule**-triggered rather than push-triggered, so it did not run on the merge at all; and the
local gate scopes mermaid validation to `repo-governance docs`, which cannot reach `plans/done/`.
The private sibling has **no** such exposure — both its workflows use an `--exclude`-qualified form and its
scheduled runs were green.

The generalizable half is worth carrying into this brief's scope: a **repo-wide** CI validator paired
with a **directory-scoped** local gate guarantees a class of failure that is structurally invisible
until CI runs. The two scopes should match, or the local gate should state which paths it
deliberately does not cover.

#### Root cause re-measured 2026-07-22: divergent CI flags, not divergent content

The account above named the local-gate scope as the cause. That is a real contributing factor but
**not** why that repo alone was red. Measured directly on 2026-07-22, the repos then in the family
invoked the same validator with three different flag sets in `.github/workflows/main-ci.yml`:

| Repo                                | `md mermaid validate` flags                                                                         | `main-ci` on `main` |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------- |
| `ose-public`                        | `--exclude apps/rhino-cli/tests/fixtures --exclude plans/done --exclude apps/ayokoding-www/content` | green               |
| The private sibling                 | `--max-depth=4 --exclude plans/done --exclude apps/rhino-cli/tests/fixtures`                        | green               |
| sibling (now out of the parity set) | `--exclude apps/rhino-cli/tests/fixtures`                                                           | **red**             |

That sibling was the only one missing `--exclude plans/done`. The file it failed on,
`plans/done/2026-07-03__unify-rhino-cli-sdlc-parity/tech-docs.md`, was **byte-identical** across the
repos (`diff` of the `origin/main` blobs reported no difference), and
the private sibling carries 423 files under `plans/done/` of its own. So identical content passed in two
repos and failed in the third purely on a flag. `--max-depth=4` is a second divergence, present only
in the private sibling.

This reframes the fix. Editing the three violations in an archived plan document treats the symptom
and leaves the divergence in place; the root-cause fix is deciding which flag set is correct and
bringing `ose-public` and the private sibling to it. That is a CI-parity question, not a diagram question —
and it is worth asking whether the stricter form is the right one and the `plans/done`
excludes are the drift, rather than assuming the current shape is correct.

### Re-measured, and two of the three trees are not remediation work (2026-08-21)

`repository-onboarding-readme-refresh` Phase 2 re-ran `md mermaid validate` unscoped: **786
violations and 17 warnings across 1,165 files** — 588 `label_too_long`, 198 `width_exceeded`, 17
`subgraph_density` — in three trees. `apps/ayokoding-www` holds 256 files, `plans/done` 32, and
`apps/rhino-cli` 4. The gate surface stays green because the registry scopes `md-mermaid` to
`affected-file-type`, so it only ever sees staged files.

Two of the three trees are not what a "fix 786 violations" item implies:

- All four `apps/rhino-cli` files sit under `tests/fixtures/state/` and are **negative fixtures** —
  inputs authored to make the validator fail so its own tests can assert that it does. One is
  literally a state named `ThisLabelIsLongerThan30CharsAndFails`. Fixing them would break the suite
  that proves the gate works, and they are byte-identical with the private sibling besides, so an edit
  would open a cross-repository parity obligation for a change that should never be made.
- `plans/done` is completed work. Its 32 files want an ignore-list entry, not 32 rewrites of history.

Only the `apps/ayokoding-www` tree — this brief's actual subject — is remediation. The general
lesson is worth carrying into the plan that executes this one: **split a red-baseline finding by
what can actually be fixed where, and open one failing file before assuming any of them is a
defect.**

## Why now

A temporary `--exclude apps/ayokoding-www/content` was put in `.github/workflows/main-ci.yml` and
the `package.json` lint-staged `*.md` chain so the parser fix could land green. That exclude was a
coverage hole in the **reader-facing** site — precisely where the convention's mobile-rendering
rationale matters most. It should not become permanent by default.

Update (2026-09-24): that workflow and the lint-staged chain are both retired. The `md-mermaid`
registry gate now validates staged `.md` files at pre-commit and changed `.md` files on pull
requests with no exclude, so an edited course page must pass; untouched pages are never re-checked.

## Prior art / precedents

- **Diagrams Convention → Flowchart Width Constraints** — the direction-aware rule being enforced:
  in `LR` the checked horizontal axis is _depth_; in `TD` it is _span_.
  [diagrams](../../../repo-governance/conventions/formatting/diagrams.md)
- **`md links validate` content excludes** — the existing precedent for exempting
  `apps/ayokoding-www/content` and `apps/ose-www/content` from a repo-wide markdown gate, already
  applied in both the pre-push hook and CI. This brief follows that shape but aims to _remove_ the
  exemption rather than institutionalise it.
- **The split-into-shallow-LR-diagrams technique** — proven on 7 diagrams during the parser fix: because
  `LR` checks only depth, splitting one deep chain into several 2-level `LR` diagrams passes while
  preserving every node and edge. This is the mechanical remedy for `width_exceeded`.
- **mermaid-state-label-render-clipping-warn** — the sibling brief on a different mermaid rule gap.
  [brief](./mermaid-state-label-render-clipping-warn.md)

## Proposed direction (sketch)

1. **Triage by violation kind.** `label_too_long` is mostly mechanical (insert `<br/>` at a sensible
   phrase boundary, or shorten wording); `width_exceeded` needs the split technique and real editorial
   judgement.
2. **Batch by tutorial family**, not by file — `by-example`, `annotated-concept`, `primer`,
   `in-the-field` have distinct diagram idioms, so a fix pattern established once applies across a
   family.
3. **Respect bilingual parity** — `apps/ayokoding-www/content` is bilingual; an `en` diagram edit needs
   its `id` counterpart edited to match, or the two drift.
4. **Drop the exclude** from `main-ci.yml` and `package.json` as the terminal step, and assert the
   repo-wide run is clean without it.

## Rough scope & non-goals

In scope: the 636 findings in `apps/ayokoding-www/content`; removing the temporary exclude from both
invocation sites; a spot-check that rendered pages still read correctly on a narrow viewport.

Out of scope (for now): relaxing the 30-char / 4-node thresholds themselves (a separate conversation —
if the thresholds are wrong for educational content, that is a convention change, not a remediation);
the `subgraph_density` warnings, which are advisory and non-blocking; the other two repos, whose
content trees differ.

## Risks & open questions

- Are the current thresholds (30 chars/line, 4 nodes) actually right for **educational** diagrams, or
  is the volume itself evidence they are mistuned for this content type? Answering this first could
  shrink the work substantially — or convert it into a convention change instead. (open)
- Bilingual parity: is there an existing checker that would catch an `en`/`id` diagram divergence
  introduced by a partial fix, or does that need adding first? (open)
- Should remediation be one plan or one-plan-per-tutorial-family, given 241 files? (open)

## What success looks like + promotion signal

Success: `md mermaid validate` runs with **no** `apps/ayokoding-www/content` exclude and reports zero
violations, on both the pre-commit and pull-request surfaces, with no diagram having lost a node or
an edge.

Promotion signal: ready once the threshold question above is settled — if the thresholds stand, this is
a large but mechanical remediation plan; if they do not, it becomes a much smaller convention change
plus a re-baseline.
