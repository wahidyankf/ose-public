# Reconcile `Rhino CLI Parity Audit` with the documented F#-era coverage exception

One-line summary: the private sibling's nightly `Rhino CLI Parity Audit` workflow does a blunt byte-diff of
`apps/rhino-cli/parity-manifest.sha256` against `ose-public` main with no exception mechanism, and a
deliberate, already-documented one-file divergence introduced during `rewrite-rhino-cli-to-fsharp`
(`GlossaryDddCoverageUnitTests.fs`, private-sibling-only) now fails it permanently instead of
transiently.

## Problem / context

The private sibling's `.github/workflows/rhino-cli-parity-audit.yml` (schedule: daily 02:00 UTC, plus
`workflow_dispatch`) downloads `ose-public` main's `apps/rhino-cli/parity-manifest.sha256` as a
"canonical manifest" and runs a plain `diff -u` against the private sibling's own copy, failing the run on
any difference. It does not gate any PR or merge — it is a standalone, informational check.

`rewrite-rhino-cli-to-fsharp`'s Phase 11a (private-sibling repeat, 2026-08-30) deliberately made the two
repos' manifests differ by exactly one file:
`apps/rhino-cli/src/tests/unit/Steps/GlossaryDddCoverageUnitTests.fs` exists only in the private sibling. Its
own header comment explains why: `ose-public`'s real glossary/bounded-context content already
exercises the forbidden-synonyms bullet parser, the slash/glob-qualified `featureRefResolves`
branches, and `Ddd.loadRegistry`'s default-code_lang/malformed-YAML branches via its own real files;
the private sibling's real content does not. Rather than alter real glossary/registry content to force
parity, the decision (recorded in `plans/done/2026-08-30__rewrite-rhino-cli-to-fsharp/learnings.md`,
Phase 11a entries) was to close the gap with synthetic xUnit fixtures in the private sibling only.

That decision is sound on its own terms, but nobody checked it against this specific nightly
workflow's assumption (the two repos' `apps/rhino-cli` trees are always exactly byte-identical), which
is now knowingly false in this one place — permanently, not as merge-timing lag. Confirmed current
diff (both repos' actual `main` as of 2026-08-30): exactly one changed line
(`RhinoCli.UnitTests.fsproj`'s hash, because its `<Compile Include>` list differs) and one added line
(the new file's own hash) in the private sibling's 181-line manifest vs. `ose-public`'s 180-line manifest.

## Why now

A nightly CI check that is _expected_ to fail forever trains whoever monitors it to ignore red, which
defeats its purpose of catching _genuine_ future drift between the two repos' `rhino-cli` trees. The
workflow's run history (`gh run list -R wahidyankf/<private-sibling> --workflow rhino-cli-parity-audit.yml`)
already shows several transient pre-existing failures (2026-08-16, -17, -26, -27) that self-healed
once both repos caught up — this one will not self-heal, because the divergence is permanent by
design.

## Prior art / precedents

- `plans/done/2026-08-30__rewrite-rhino-cli-to-fsharp/learnings.md`, Phase 11a entries — the decision
  record for why `GlossaryDddCoverageUnitTests.fs` is private-sibling-only.
- The private sibling's `apps/rhino-cli/src/tests/unit/Steps/GlossaryDddCoverageUnitTests.fs` header comment
  — states the rationale inline, including "per the parity-boundary-drift guidance (never converge
  real content to force byte-identical coverage)."

## Proposed direction (sketch)

Pick one, in the private sibling's workflow only:

1. **Named-line allowlist** (smallest, most explicit): strip the `GlossaryDddCoverageUnitTests.fs`
   line and the `RhinoCli.UnitTests.fsproj` line (expected to differ as a direct consequence) from
   the diff inputs before comparing, with a comment naming this brief and the coverage-gap rationale.
2. **Split into two passes**: fail only on files that exist in `ose-public`'s manifest with a
   different hash (catches genuine shared-file drift); list private-sibling-only files as informational,
   never failing — lower-maintenance if more per-repo-only files are expected later, but coarser (a
   hash change on the allowlisted file itself would go uncaught).

## Rough scope & non-goals

In scope: the private sibling's `.github/workflows/rhino-cli-parity-audit.yml` only.

Out of scope: reverting `GlossaryDddCoverageUnitTests.fs` or otherwise forcing the manifests back to
byte-identical; any other repo's parity mechanisms; the plan-internal, per-repo
`parity-manifest:validate` Nx target (self-consistency within one repo's own tree, unaffected,
already passing in both repos); building a general automated cross-repo byte-identity gate.

## Risks & open questions

- Which approach (allowlist vs. two-pass) fits better if more private-sibling-only rhino-cli files show
  up in the future — this is the one open design choice. (open)
- Does anything else consume this workflow's pass/fail status (dashboards, alerts) that a silent
  behaviour change could surprise? Not found in a repo-wide search, but worth a last check at pickup.
  (open)

## What success looks like + promotion signal

Success: `Rhino CLI Parity Audit` passes on the private sibling's main as it stands today, and a locally
simulated third, undocumented manifest-line difference still makes it fail.

Promotion signal: ready to promote directly to a `backlog/` plan now — the fix is small, single-repo,
and fully diagnosed (exact diff lines identified above); no further research step is needed first.
