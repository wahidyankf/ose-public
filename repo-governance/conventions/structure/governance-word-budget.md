---
description: Per-surface word thresholds for auto-loaded instruction files, enforced by rhino-cli and git hooks
when_to_use: Use when a governance or instruction file may be approaching or over its word-count threshold.
---

# Governance Word-Budget Convention

Coding-agent harnesses auto-load certain instruction files before the first user message. Past
harness limits, instructions are **silently truncated or ignored**. This convention sets
per-surface word thresholds and the one sanctioned remediation (progressive disclosure). The metric
is a raw whole-file `split_whitespace()` word count, not bytes, with no in-file exclusions.

## Monitored Surfaces

Configured in the `governance-word-budget:` section of `repo-config.yml`; enforced by
`rhino-cli governance word-budget validate`.

| Surface                                                             | Budget class  |
| ------------------------------------------------------------------- | ------------- |
| `repo-governance/**/*.md`                                           | Instruction   |
| `AGENTS.md` / `CLAUDE.md` / `RTK.md`                                | Instruction   |
| Every harness binding directory in the `harness:` registry (`*.md`) | Instruction   |
| `**/README.md`                                                      | README        |
| Resolved tree (`CLAUDE.md` + imports)                               | Resolved tree |

The live `target`, `warn`, and `fail` values exist only in `repo-config.yml`. A file at or below
its target produces no finding; a file above target through the fail value warns; a file above the
fail value blocks the gate. These values are capacity ceilings, not desired lengths or permission
to fill the available space. Authors still apply the
[Minimal Sufficiency Test](../../principles/general/simplicity-over-complexity/minimal-sufficiency-test.md)
and progressive disclosure; a warning is a prompt to simplify or split reachable detail before the
file becomes blocking.

`repo-governance/**/*.md` is the largest surface by file count.

**A surface is its glob minus the registered exclude prefixes** — the `args.exclude` path
prefixes on the gate are part of the published rule, not an implementation detail. `plans/`,
`docs/`, and `specs/` are among them, so a `plans/` README does not produce a word-budget finding.
That scan exclusion is not an exemption from minimal sufficiency: active plans remain focused and
must be reconciled when their canonical specs, configuration, or rules change. The full list is in
the Excluded Prefixes child below.

When a path matches more than one surface glob, the **last-declared** surface wins (select, then
classify). This is a declaration-order invariant, not a glob-specificity comparison: a
more-specific glob MUST be declared after any more-general surface it overlaps. `**/README.md` is
the only overlapping surface today — every other surface's directory glob also matches its
README.md files — which is why it is declared last. A reorder, or a new general glob inserted after
it, silently misclassifies every README.md with no error signal;
`application::governance::word_budget::tests::surfaces_declares_readme_glob_last` enforces the
order against the live config. Update that test if a change legitimately needs a different one.

## Enforcement Points

Runs at pre-push (changed-path gated), in CI, and as category 4 of `repo-governance audit`'s
preflight. No pre-commit surface. See
[Governance Word-Budget Remediation](../structure/governance-word-budget-remediation.md) for the enforcement
breakdown, the progressive-disclosure fix, and forbidden anti-fixes (deleting a rule, dense
compression, splitting into another auto-loaded file, or an incomplete `See`-link target).

## Updating Thresholds

Threshold changes are class-wide policy recalibrations, never remediation for one file. Require
evidence that the existing signal is broadly non-actionable or that harness capacity or repository
policy changed; preserve minimal sufficiency, record the rationale as a YAML comment, edit the
`governance-word-budget:` section of `repo-config.yml`, and run
`./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run rhino-cli:governance-word-budget:validation`.
Never adjust a threshold to paper over a bloated file or a specific change.

## Children

- [Vision and Principles](./governance-word-budget/vision-and-principles.md) — vision alignment, principles implemented, and related conventions.
- [Excluded Prefixes](./governance-word-budget/excluded-prefixes.md) — The path prefixes the word-budget gate excludes, and why. Use when checking whether a file is actually measured.
