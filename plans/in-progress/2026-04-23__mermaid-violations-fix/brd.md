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

## Success

- `rhino-cli docs validate-mermaid .` exits 0 with 0 violations.
- Suppressed blocks are explicitly annotated with `<!-- mermaid-skip -->`, making
  exemptions auditable rather than invisible.
- No regression in test coverage (≥90%) or lint.
- Pre-push hook no longer blocks authors of files unrelated to any new violation.
