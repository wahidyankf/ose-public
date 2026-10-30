# P1D GREEN — old/new equality with the JSON adapters in place

## 1. Focused characterization (adapters live)

Command: `nx -- run ayokoding-www:test:unit -- --run <2 files>
--coverage.enabled=false` (HIPPO `ephemeral/standard`)

- Test Files: 2 passed (2)
- Tests: 27 passed (27)

## 2. Full `ayokoding-www:test:unit` (HIPPO `ephemeral/standard`)

- Test Files: 39 failed | 214 passed (253)
- Tests: 3648 passed (3648) — zero failed assertions
- No coverage-threshold error.
- Failed-file set vs RED (41 files): no new failures; the only delta is
  the two characterization files flipping RED → GREEN. The remaining 39 are
  the identical pre-existing `unit-fe` collection failures
  (`Failed to resolve import "mermaid" from
src/features/content/shell/mermaid.tsx`, in suites untouched by this
  packet), recorded for the coordinator as a P0/baseline item.

## 3. `ayokoding-www:validate-benchmark-reference` (HIPPO `ephemeral/standard`)

- Exit 0 both before and after the change:
  `generate-benchmark-reference: reference is up to date.`
- Generated blocks byte-identical: the docs generator reads the same
  evaluated objects through the adapters.

## 4. `ayokoding-data:test:quick` (HIPPO `ephemeral/standard`)

- typecheck ✓, lint ✓ (0 warnings, 0 errors), test:unit 10/10 ✓,
  test:coverage:unit + test:coverage:behaviour ✓ (`corpus pending` —
  static gate passes while the specs-maker's three-entry corpus lands).
- Note: the lib has no coverable source lines (JSON-only package), so the
  `--coverage.thresholds.lines=99` command-surface contract holds while the
  runtime report is vacuous; behavior is pinned by the 10 assertions.
