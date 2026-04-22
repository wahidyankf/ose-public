# BRD: Fix All Mermaid Diagram Violations

## Problem

`rhino-cli docs validate-mermaid .` exits 1 with 1,095 violations. This has two
concrete consequences:

1. **Pre-push hook blocks unrelated authors.** The hook runs `--changed-only`,
   which scans every changed `.md` file. Any author who touches a file that
   already has a pre-existing violation will have their push blocked — even if
   they did not introduce the problem. This erodes trust in the tool and creates
   pressure to bypass the hook.

2. **Validator output is untrustworthy.** When the tool always exits 1, developers
   stop reading its output. Genuine new violations introduced in future PRs are
   drowned in 1,095 lines of noise.

## Root cause

The `validate-mermaid` command was added with rules calibrated for new content
(governance docs, narrow reference diagrams). Existing content — especially
educational by-example files and architecture reference docs — was authored before
the rules existed and routinely uses wide parallel layouts and verbose labels that
are semantically correct but mechanically non-compliant.

## Why fix it now

- Cost grows with time: each new commit to `apps/ayokoding-web/` or
  `docs/explanation/` that happens to touch a violating file will be blocked until
  the file is clean.
- The suppression mechanism proposed here adds a safety valve so genuinely complex
  diagrams can be explicitly exempted, making the remaining enforcement signal
  meaningful.
- Fixing straightforward violations (span-4 diagrams, slightly-over-limit labels)
  improves actual diagram readability, which is the original goal.

## Affected roles

**Documentation authors** — directly unblocked. Any author who currently
pushes a commit that touches a file with a pre-existing violation will have
their push blocked. After this plan, the pre-push hook only blocks genuinely
new violations.

**CI systems** — the `validate:mermaid` Nx target widens from scanning
`governance/ .claude/` only to scanning the full repository. CI will enforce
the zero-violation baseline on every future PR.

**rhino-cli maintainer** — takes on responsibility for the suppression
mechanism and the `done/` skip logic as part of the tool's ongoing behaviour.

## Non-goals

- This plan does not change the 30-character label length threshold or the
  3-node parallel width threshold. Threshold tuning is a separate decision.
- This plan does not fix violations in other repositories (`ose-infra`,
  `ose-primer`). Each repository is independently governed.
- This plan does not add a suppression audit command (e.g., list all
  suppressed blocks). Audit tooling is a future enhancement.
- This plan does not migrate the skip-directory logic from basename matching
  to full relative-path matching. That upgrade is a future hardening task if a
  second `done/` directory is added.

## Business risks

**Suppression overuse degrades enforcement signal**: Once `<!-- mermaid-skip -->`
is available, contributors may use it indiscriminately rather than fixing
structurally fixable diagrams. This would silently erode the value of the
validator. Mitigation: the decision matrix in tech-docs.md documents when
suppression is appropriate; a periodic suppression audit (grep for
`mermaid-skip` and review count) is recommended on a quarterly cadence.

**False exclusions via `done/` basename skip**: The `"done"` skip key will
exclude any future directory named `done` from validation scans, regardless of
its parent path. Mitigation: this constraint is documented in tech-docs.md;
the maintainer should upgrade to path-based matching before adding any second
`done/` directory to the repository.

## Success

- `rhino-cli docs validate-mermaid .` exits 0 with 0 violations.
- Suppressed blocks are explicitly annotated with `<!-- mermaid-skip -->`, making
  exemptions auditable rather than invisible.
- No regression in test coverage (≥90%) or lint.
- Pre-push hook no longer blocks authors of files unrelated to any new violation.
