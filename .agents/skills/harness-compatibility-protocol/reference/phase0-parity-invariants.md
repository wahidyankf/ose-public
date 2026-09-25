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
- **Default criticality**: MEDIUM (drift means canonical `.agents/` edits were not synced).
  **Confidence**: HIGH
- **Fix scope**: **auto-fixable** — re-run `./rhino harness adapters generate`, stage the `.opencode/`
  changes, re-run to confirm idempotence, hand them back for commit
  (`chore(opencode): re-sync agents from .agents/`)

## Invariant 4 — Agent inventory parity

- **Tool**: compare filename sets, not counts — equal counts with mismatched names must still fail.
  `comm -3 <(find .agents/agents -maxdepth 1 -name '*.md' ! -name README.md -exec basename {} \; | sort) <(find .claude/agents -maxdepth 1 -name '*.md' -exec basename {} \; | sort)`
- **Pass**: empty output
- **Fail**: any line — tab-indented names are `.claude/` orphans, the rest are missing routes
- **Default criticality**: HIGH (divergent agent inventories). **Confidence**: HIGH
- **Known intentional skip**: `README.md` is an index, not an agent. Codex and OpenCode render only the agents their
  profile's `agents` list in `repo-config.yml` names; `./rhino harness adapters validate` checks those sets.
- **Fix scope**: human-required — deleting a route orphan or authoring a missing canonical agent both have product
  implications

## Invariant 5 — Translation-map coverage

- **Tools**: tier map — `grep -h "^tier:" .agents/agents/*.md | sort -u` vs. the Claude profile's `tiers` map in
  `repo-config.yml`; constraint map — `grep -h -A9 "^constraints:" .agents/agents/*.md | grep "^  - " | sort -u` vs.
  `harness.requirements.constraints`
- **Pass**: every distinct frontmatter value appears in the corresponding map
- **Fail**: any value not in the map — report the missing entry
- **Default criticality**: MEDIUM (sync may mistranslate the missing entry). **Confidence**: HIGH
- **Fix scope**: human-required — adding a new color/tier requires a role-mapping decision a
  fixer cannot make mechanically

## Invariant 6

[Hand-authored config parity](./phase0-invariant-6-config-parity.md).
