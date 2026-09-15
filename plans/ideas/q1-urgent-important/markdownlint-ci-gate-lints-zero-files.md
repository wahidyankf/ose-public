# The `markdownlint` CI gate lints zero files and has always passed vacuously

One-line summary: the `markdownlint` gate declares `ci: { scope: all-file-type }` with no `glob`,
which the gate runner documents as "no-argument repository-wide mode" — but `markdownlint-cli2`
needs a positive pattern, so it receives none, lints `0 file(s)`, and reports PASS on every run.

> Surfaced 2026-08-17 during `optimize-gov` PR review, after twelve real violations reached a green
> PR.
> Absorbed the private sibling's parallel copy of this brief on 2026-08-19 by plan-ideas-grooming; the gate
> is identical in both repos, so one brief now covers both.

## Problem / context

`repo-config.yml` wires the gate like this:

```yaml
- id: markdownlint
  command: markdownlint-cli2
  surfaces:
    pre-commit: { scope: affected-file-type, glob: "*.md" }
    ci: { scope: all-file-type } # <- no glob
```

The `pre-commit` surface carries a glob; the `ci` surface does not. `gate/run.rs` maps
`ScopeKind::AllFileType` to `CandidateScope::TrackedFiles`, and its own test at `run.rs:1320`
asserts that "an all-file-type gate without a glob must retain its no-argument repository-wide
mode" — the tool is invoked with **empty argv**.

That mode is correct for tools that default to repo-wide when given no arguments (`cargo fmt`,
`shfmt` as wired here). `markdownlint-cli2` is not such a tool: with no positive pattern it has
nothing to lint. The CI log shows the result exactly:

```
Running gate markdownlint
markdownlint-cli2 v0.21.0 (markdownlint v0.40.0)
Finding: !node_modules/** !**/node_modules/** … !archived/**
Linting: 0 file(s)
Summary: 0 error(s)
markdownlint PASS
```

The `Finding:` line is all negations and no positive glob. Confirmed on two independent runs
(`32027131986` head `da015e675`, `32016959920` head `a706ed610`). The npm script `lint:md` does
carry the pattern (`markdownlint-cli2 "**/*.md"`), so running it by hand works — which is why this
never looked broken to anyone who checked locally.

This is the same shape as
[mermaid-validator-does-not-check-syntax](./mermaid-validator-does-not-check-syntax.md): the board
is green because nothing looked.

**How it was caught.** The `optimize-gov` branch reached six green CI runs carrying an MD028
blank-line-inside-blockquote and an MD020 `## F#` closed-atx heading, both introduced by its own
commits. They surfaced only when the changed set was linted by hand.

**A second, independent hole sits beside it.** `format-verify-prettier` uses
`ci: { scope: affected-file-type }`, so a documentation-only change makes no Nx project affected and
the gate is skipped outright — the same run logs show `Skipping gate format-verify-prettier` on a
commit whose diff was ~34 Markdown files. Four `repo-governance/glossary/` files were committed
having never been formatted at all. Note the private sibling already spells this one
`ci: { scope: all-file-type }`, with a comment explaining the choice, so the two repos disagree.

Corroborated 2026-08-18 in `repo-clean-up`: a branch of ~60 changed Markdown files carried five
prettier violations with every gate green, caught only by running the repo-pinned binary over the
branch's own changed set by hand. Second independent instance, different plan.

### The same gate is red the other way locally (2026-08-21)

`repository-onboarding-readme-refresh` Phase 0 baselined the local counterpart and found the inverse
failure. Where the CI gate lints **zero** files and passes vacuously, `npm run lint:md` lints too
many and fails vacuously: its `**/*.md` glob walks into `.fvm-cache/`, a gitignored vendored Flutter
SDK, and reports **565 errors** from third-party documentation. Every one is phantom — zero
markdownlint errors exist in tracked repository content.

`.fvm-cache/` is gitignored at `.gitignore:198` but appears in neither `.markdownlintignore` nor the
`ignores` array of `.markdownlint-cli2.jsonc`. CI never sees it, because CI scopes to affected
files; only a developer running the repo-wide script does.

The two halves are one problem: **the gate's file set is derived independently in two places and is
wrong in both**, once by omission and once by over-reach. A red local baseline trains readers to
ignore the gate exactly as thoroughly as a vacuous green one does. Adding one `.fvm-cache/` line to
`.markdownlintignore` restores the local signal, and belongs with whatever fix gives the CI side a
positive pattern.

## Why now

Measured blast radius, so the fix is not a leap in the dark:

| Scope                                      | Files | Errors |
| ------------------------------------------ | ----- | ------ |
| `**/*.md` as-is                            | 8324  | 8470   |
| `**/*.md` minus `.fvm/**`, `.fvm-cache/**` | 7450  | **0**  |

The repository's own Markdown is clean. Every one of the 8470 errors lives in the vendored Flutter
SDK caches `.fvm/` and `.fvm-cache/`, which are absent from `.markdownlint-cli2.jsonc`'s ignore
list. So arming the gate is cheap **provided** those two directories are ignored first — and
guaranteed to fail loudly if they are not.

The private sibling has no `.fvm` tree and reports 0 errors across 3127 files, so there the fix is the
missing glob alone.

The cost of leaving it is that every future Markdown defect lands unchallenged, exactly as twelve
just did.

## Prior art / precedents

- **[mermaid-validator-does-not-check-syntax](./mermaid-validator-does-not-check-syntax.md)** — same
  vacuous-gate class; whatever detection method is adopted there should cover this too.
- **[`doc-command-existence-validation`](../q2-not-urgent-important/doc-command-existence-validation.md)**
  — the neighbouring "a gate should be provably non-vacuous" idea.
- **`gate/run.rs:1315-1321`** — the test that pins the no-argument behaviour. It is not wrong; it
  documents a real mode. The defect is a gate opting into that mode with a tool it does not suit.

## Proposed direction (sketch)

1. Add `.fvm/**` and `.fvm-cache/**` to `.markdownlint-cli2.jsonc` `ignores` (this repo only).
2. Give the `markdownlint` gate's `ci` surface `glob: "*.md"`, matching its own `pre-commit`
   surface. Land in both repos — the config is identical today.
3. Align `format-verify-prettier`'s `ci` scope with the private sibling's `all-file-type`.
4. Capture the private sibling's own CI log for the gate to confirm the `0 file(s)` line there directly.
   Its behaviour is currently **inferred** from a byte-identical `rhino-cli` and an identical gate
   entry, not observed — its logs were unreadable during the 2026-08-17 GitHub incident, so that
   capture is still outstanding.
5. Then the general question: a gate that runs and checks nothing is indistinguishable from a gate
   that runs and finds nothing. Emitting the candidate-file count per gate, and failing any `check`
   whose count is zero unless it declares `may-be-empty: true`, would have caught this on day one
   and would catch the next one.

## Rough scope & non-goals

In scope: the `markdownlint` and `format-verify-prettier` gate entries in both repos, the
`.markdownlint-cli2.jsonc` ignore list, and a general zero-candidate assertion for `check` gates.

**Out of scope (for now)**: fixing Markdown violations — there are none once the vendored caches are
excluded; auditing every other gate for the same no-glob mistake (worth doing, but item 4 subsumes
it); the `.fvm` directories' presence in the repo at all, which is a separate question.

## Risks & open questions

- Does `all-file-type` **with** a glob pass 7450 paths as argv? If so it may approach `ARG_MAX`.
  Putting the pattern in the gate's `command` instead, as `lint:md` does, avoids the question
  entirely. Unmeasured — decide before implementing. (open)
- Which other gates declare `all-file-type` with no glob against a tool that needs a pattern? The
  same defect may be sitting in several. Nobody has enumerated them. (open)
- Arming this cannot be verified without a CI run, so it should not land during a GitHub incident —
  which is precisely why it was filed rather than fixed inside `optimize-gov`.
- `repo-config.yml` is not inside the `apps/rhino-cli` parity boundary, so the two repos can be
  fixed independently; but leaving them divergent is what produced the `format-verify-prettier`
  asymmetry in the first place.

## What success looks like + promotion signal

`markdownlint` reports a non-zero file count in CI, and a deliberately introduced MD028 fails the
PR. More durably: no `check` gate can report PASS having examined nothing.

Promotion signal: ripe now — the blast radius is measured at zero and the change is a few lines.
Promote if item 4 (the general zero-candidate assertion) is wanted, since that needs a design; if
only items 1-3 are taken, this is a small PR and should simply be done.
