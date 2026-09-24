# Phase 0: Cross-Vendor Parity Invariants (Deterministic)

Run the full standalone inventory before Phase 1. Quality-gate filtering is defined in
[Phase 0 Quality-Gate Filter](./phase0-quality-gate-filter.md).

## Invariant 1 — Governance prose vendor-neutrality

- **Tool**: `./rhino governance vendor validate`
- **Pass**: exits 0 with `GOVERNANCE VENDOR AUDIT PASSED: no violations found`
- **Fail**: any non-zero exit; report each violation (file, line, term, replacement — all in the
  tool output)
- **Default criticality**: HIGH. **Confidence**: HIGH (deterministic regex match)
- **Fix scope**: human-required — rewriting governance prose needs judgment per the convention's
  Migration Guidance

## Invariant 2 — Root instruction surface vendor-neutrality

- **Tool**: `./rhino governance vendor validate`; its declared roots include the root instruction
  pair.
- **Pass**: both exit 0, no violations outside `binding-example` fences and "Platform Binding
  Examples" headings
- **Fail**: any violation in load-bearing prose
- **Default criticality**: HIGH (root surface, many agents read it). **Confidence**: HIGH
- **Fix scope**: human-required — as Invariant 1

## Invariant 3 — Binding sync no-op

- **Tool**: `./rhino harness adapters generate && git diff --quiet .claude/ .opencode/ .codex/`
- **Pass**: sync exits 0 AND `git diff --quiet` exits 0 (no changes produced)
- **Fail**: sync produced drift in `.opencode/` — report the changed files
- **Default criticality**: MEDIUM (drift means upstream `.claude/` edits were not synced).
  **Confidence**: HIGH
- **Fix scope**: **auto-fixable** — re-run `./rhino harness adapters generate`, stage the `.opencode/`
  changes, re-run to confirm idempotence, hand them back for commit
  (`chore(opencode): re-sync agents from .claude/`)

## Invariant 4 — Agent inventory parity

- **Tool**: compare filename sets, not counts — equal counts with mismatched names must still fail.
  `comm -3 <(find .claude/agents -name '*.md' ! -name README.md -exec basename {} \; | sort) <(find .opencode/agents -name '*.md' ! -name README.md -exec basename {} \; | sort)`
- **Pass**: empty output
- **Fail**: any line — tab-indented names are `.opencode/` orphans, the rest are missing mirrors
- **Default criticality**: HIGH (divergent agent inventories). **Confidence**: HIGH
- **Known intentional skip**: `README.md` is an index, not an agent, excluded on both sides.
  `find` is required on the `.claude/` side, which nests into role subfolders.
- **Fix scope**: human-required — deleting an `.opencode/` orphan or authoring a missing
  `.claude/` counterpart both have product implications

## Invariant 5 — Translation-map coverage

Both greps must be recursive: `.claude/agents/` is nested, and a non-recursive glob silently
returns nothing.

- **Tools**: color map — `grep -rh "^color:" .claude/agents/ | sort -u` vs. the Color Translation
  Table in `repo-governance/development/agents/ai-agents.md`; tier map —
  `grep -rh "^model:" .claude/agents/ .opencode/agents/*.md | sort -u` vs. the capability-tier
  map in `repo-governance/development/agents/model-selection.md`
- **Pass**: every distinct frontmatter value appears in the corresponding map
- **Fail**: any value not in the map — report the missing entry
- **Default criticality**: MEDIUM (sync may mistranslate the missing entry). **Confidence**: HIGH
- **Fix scope**: human-required — adding a new color/tier requires a role-mapping decision a
  fixer cannot make mechanically

## Invariant 6

[Hand-authored config parity](./phase0-invariant-6-config-parity.md).
