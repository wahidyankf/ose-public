# Drift Detection, Execution Pattern, and Report Format

## Drift Detection

No declared gate or pinned RHINO command checks a specs tree's layout, README counts, or adoption
gaps; judge them from the listed folders (Categories 1, 2, 8, and 9), per the
[Specs Quality Gate](../../../../repo-governance/workflows/quality/specs-quality-gate.md).
Use `./rhino md internal-link validate` for missing Markdown link targets (it does not check
`#fragment` anchors) and
the project `test:coverage:behaviour` target for explicit When/Then and corpus structure (it checks
the Gherkin corpus only, not the layout).

In a quality-gate invocation, skip a command and any LLM substitute when the gate's Deterministic Boundary lists
its property. No gate owns internal links, so the link command above always runs.

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

#### [HIGH] Internal link — missing target

**Folder**: `specs/apps/wahidyankf`
**Command**: `./rhino md internal-link validate`
**Evidence**: The command's finding for the missing target, quoted verbatim
**Expected**: Point the link at an existing file, or restore the target
**Confidence**: HIGH
```
