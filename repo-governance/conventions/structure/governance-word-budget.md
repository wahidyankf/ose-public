---
description: Per-surface word thresholds for auto-loaded instruction files, checked on demand by `./rhino governance word-budget validate`
when_to_use: Use when a governance or instruction file may be approaching or over its word-count threshold.
---

# Governance Word-Budget Convention

Coding-agent harnesses auto-load certain instruction files before the first user message. Past
harness limits, instructions are **silently truncated or ignored**. This convention sets
per-surface word thresholds and the one sanctioned remediation (progressive disclosure). The metric
is a whole-file whitespace-separated word count (`count: whitespace-separated`), not bytes, with no in-file exclusions.

## Monitored Surfaces

Configured in the `policies.governance.word-budget` section of `repo-config.yml`; enforced by
`./rhino governance word-budget validate`.

| Surface                                                                                                                             | Budget class |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `repo-governance/**/*.md`, `.agents/**/*.md`, `.codex/**/*.md`, `.opencode/**/*.md`                                                 | Instruction  |
| `AGENTS.md`, `CLAUDE.md`                                                                                                            | Instruction  |
| `README.md` under `repo-governance/`, `.agents/`, `.codex/`, `.opencode/`, `apps/`, `libs/`, `.github/`, and `infra/`, at any depth | README       |
| `scripts/README.md`, `social-media-posts/README.md`, and the root `README.md`                                                       | README       |

The live `target`, `warn`, and `fail` values exist only in `repo-config.yml`. A file at or below
its target produces no finding; a file above target through the fail value warns; a file above the
fail value blocks the gate. These values are capacity ceilings, not desired lengths or permission
to fill the available space. Authors still apply the
[Minimal Sufficiency Test](../../principles/general/simplicity-over-complexity/minimal-sufficiency-test.md)
and progressive disclosure; a warning is a prompt to simplify or split reachable detail before the
file becomes blocking.

`repo-governance/**/*.md` is the largest surface by file count.

**A surface is exactly its declared glob.** There is no exclude list: README globs are declared
tree by tree, so a README under `plans/`, `docs/`, or `specs/` matches no surface and produces no
word-budget finding. Being unmeasured is not an exemption from minimal sufficiency: active plans
remain focused and must be reconciled when their canonical specs, configuration, or rules change.
See the Unmeasured Paths child below.

When a path matches more than one surface glob, the **last-declared** surface wins (select, then
classify). This is a declaration-order invariant, not a glob-specificity comparison: a
more-specific glob MUST be declared after any more-general surface it overlaps. Each tree's
`**/README.md` glob overlaps that tree's `**/*.md` glob, which is why the README globs are declared
after every directory glob. A reorder, or a new general glob inserted after them, silently
reclassifies those READMEs with no error signal: an 800-word `repo-governance/` README passes under
the README class and fails once the general glob comes last. No check guards the order; review of
any `word-budget` change does.

## Enforcement Points

Not a declared gate on any lifecycle surface (see `./rhino gate list`): it runs on demand, so run
it before committing an edit to a covered surface. See
[Governance Word-Budget Remediation](../structure/governance-word-budget-remediation.md) for the enforcement
breakdown, the progressive-disclosure fix, and forbidden anti-fixes (deleting a rule, dense
compression, splitting into another auto-loaded file, or an incomplete `See`-link target).

## Updating Thresholds

Threshold changes are class-wide policy recalibrations, never remediation for one file. Require
evidence that the existing signal is broadly non-actionable or that harness capacity or repository
policy changed; preserve minimal sufficiency, record the rationale as a YAML comment, edit the
`policies.governance.word-budget` section of `repo-config.yml`, and run
`./hippo run --class ephemeral --resource-tier standard --disk-path . -- ./rhino governance word-budget validate`.
Never adjust a threshold to paper over a bloated file or a specific change.

## Children

- [Vision and Principles](./governance-word-budget/vision-and-principles.md) — vision alignment, principles implemented, and related conventions.
- [Unmeasured Paths](./governance-word-budget/unmeasured-paths.md) — Which paths no word-budget surface measures, and why. Use when checking whether a file is actually measured.
