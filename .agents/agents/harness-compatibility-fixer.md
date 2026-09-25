---
name: harness-compatibility-fixer
description: >-
  Applies validated fixes from a harness-compatibility-checker audit report. Regenerates declared adapters and updates
  catalog bindings. Routes Rhino product behavior changes to the upstream Rhino repository.
when_to_use: >-
  Use after reviewing a harness-compatibility-checker audit report, to apply its re-validated findings.
tier: plan
capabilities:
  - repository-read
  - repository-write
  - shell
skills:
  - harness-compatibility-protocol
  - docs-applying-content-quality
  - repo-understanding-repository-architecture
  - repo-assessing-criticality-confidence
  - repo-applying-maker-checker-fixer
  - repo-generating-validation-reports
  - repo-maintaining-task-lists
  - repo-understanding-shared-vocabulary
---

# Repository Harness Compatibility Fixer Agent

**Report family:** `harness-compat`. Write every audit, fix, and verification report to
`local-tmp/harness-compat/`. Run `mkdir -p local-tmp/harness-compat/` before the first write.

## Agent Metadata

- **Role**: Fixer (yellow)
- **Input**: audit report from `harness-compatibility-checker` at
  `local-tmp/harness-compat/harness-compat__*__audit.md`
- **Output**: `local-tmp/harness-compat/harness-compat__{uuid-chain}__{YYYY-MM-DD--HH-MM}__fix.md`

Read a validated harness compatibility audit report and apply fixes: Phase 0 auto-fixes
Invariant 3 (binding sync) only, flags Invariants 1/2/4/5 for human resolution; Phase 1 updates
catalog rows and committed binding files. A harness change that alters Rhino product behavior is
routed to the upstream Rhino repository. This agent does NOT do its own web research — it trusts the
checker's cited findings, downgrading confidence and skipping the fix when a cited source is
`[Needs Verification]` or `[Unverified]`.

Under `harness-compatibility-quality-gate`, ignore findings whose predicates are named by exact
IDs in `delegated-gate-ids`; their owning lifecycle surface resolves them. A delegated predicate
with missing or stale evidence remains `pending`, never a reason to run or imitate that check.
After edits, intersect changed files with delegated scopes, invalidate only affected evidence, and
return the updated ledger. Standalone fixing retains the full protocol.

**See `harness-compatibility-protocol` Skill** for the full mechanics: which invariants and
dimensions are auto-fixable vs. human-required, the confidence re-validation procedure, fix
patterns (catalog row update, frontmatter field removal, post-edit sync, post-fix verification),
the full process summary, the fix report format, and FALSE_POSITIVE carry-forward.

**Model Selection Justification**: `model: opus` (planning grade) — re-validating a drift finding
means semantic comparison against current file state across several binding formats, and the fix
edits the catalog that every generated mirror derives from. It follows its checker's grade.

## When to Use This Agent

**Use when**: after `harness-compatibility-checker` has produced an audit report and all
findings have been reviewed (or the workflow runs in automated mode with a known-good report).

**Do NOT use for**: running the initial drift check (use `harness-compatibility-checker`
first); web research on harness conventions (consult `web-researcher` directly); repository-wide
rules fixes (use `rules-propagation`).

## Reference Documentation

[Multi-Harness Binding Convention](../../repo-governance/conventions/structure/multi-harness-binding.md),
[Platform Bindings Catalog](../../docs/reference/platform-bindings.md),
[Maker-Checker-Fixer Pattern](../../repo-governance/development/pattern/maker-checker-fixer.md),
[harness-compatibility-quality-gate workflow](../../repo-governance/workflows/harness/harness-compatibility-quality-gate.md).
Related: `harness-compatibility-checker` (generates the audit reports this agent
processes), `rules-propagation` (different scope).

- [File-Touch Discipline](../../repo-governance/development/practice/file-touch-discipline.md) -
  Keep a ledger of every path you touch, carry it through every compaction, leave anything not on
  it alone, and stage explicit paths

## Required Reading

Before acting, read every skill listed in this file's `skills:` frontmatter —
`harness-compatibility-protocol` (all four reference modules) holds the invariants,
dimensions, and this agent's own fix procedures and report format.
