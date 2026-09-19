# Drift Detection, Execution Pattern, and Report Format

## Drift Detection

Outside a lifecycle-filtered quality gate, validate listed `specs/apps/<app-family>/` folders with
`the declared spec-structure check` (or Nx target
`Rhino:specs:structure-validation`). It aggregates adoption, tree, and app-tree counts. Use
`the declared spec-count check` only for non-app trees that the aggregator cannot reach.
Use `./rhino md internal-link validate` for Markdown paths/fragments and
the project `test:coverage:behaviour` target for explicit When/Then and corpus structure.

In a quality-gate invocation, skip a command and any LLM substitute when its exact gate ID is in
`delegated-gate-ids`: `specs-structure`, `md-links`, or
`governance-readme-index`. Preserve the supplied lifecycle evidence instead.

Route-level drift (endpoints, contracts) is not currently implemented — the placeholder command
files were removed in the BDD+DDD tooling gap-fill plan; re-introduction needs a new dedicated
plan, not a stub.

## Execution Pattern

1. **Initialize**: generate UUID, create the report file in `local-tmp/specs/`.
2. **Run non-delegated deterministic checks**: use the current commands above. Never rerun or
   re-derive an exact delegated predicate.
3. **Validate per folder**: for each listed folder, run LLM Categories 1-7 on it and its
   subfolders.
4. **Cross-validate**: if 2+ folders are listed, run Category 4 across them.
5. **Progressive write**: update the audit report after each category completes per folder.
6. **Summarize**: write finding counts by criticality level.

## Report Format

```markdown
# Specs Validation Audit Report

**Folders validated**:

- `specs/apps/organiclever/be`
- `specs/apps/organiclever/app-web`

**Timestamp**: YYYY-MM-DD--HH-MM UTC+7
**UUID Chain**: {uuid}

## Summary

| Criticality | Count |
| ----------- | ----- |
| CRITICAL    | N     |
| HIGH        | N     |
| MEDIUM      | N     |
| LOW         | N     |

## Findings by Folder

### specs/apps/organiclever/be

#### [CRITICAL] {Category} — {Brief description}

**File**: `path/to/file`
**Line**: N
**Evidence**: What was found
**Expected**: What should be there
**Confidence**: HIGH | MEDIUM

## Cross-Folder Findings

#### [HIGH] Cross-Folder Consistency — {Brief description}

**Folders**: `specs/apps/organiclever/be`, `specs/apps/organiclever/app-web`
**Evidence**: What contradicts or does not blend
**Expected**: What consistency looks like
**Confidence**: HIGH | MEDIUM

## Validator Findings

#### [HIGH] Structure gate — missing folder

**App**: `wahidyankf`
**Command**: `the declared spec-structure check`
**Evidence**: `specs/apps/wahidyankf/containers: HIGH: missing required folder: containers`
**Expected**: Add the canonical `containers/` folder with at least one spec .md file
**Confidence**: HIGH
```
