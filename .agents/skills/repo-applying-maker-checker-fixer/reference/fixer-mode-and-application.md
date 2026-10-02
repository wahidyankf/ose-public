# Maker-Checker-Fixer — Fixer Mode Parameter Handling and Fix Application

## Fixer Workflow Step 3: Mode Parameter Handling

Support `mode` parameter for quality-gate workflows:

**Mode Levels**:

- **lax**: Process CRITICAL findings only (skip HIGH/MEDIUM/LOW)
- **normal**: Process CRITICAL + HIGH findings only (skip MEDIUM/LOW)
- **strict**: Process CRITICAL + HIGH + MEDIUM findings (skip LOW)
- **all**: Process all findings (CRITICAL + HIGH + MEDIUM + LOW)

**Implementation**:

```markdown
1. Parse audit report and categorize findings by criticality
2. Apply mode filter before re-validation:
   - lax: Only process CRITICAL findings
   - normal: Process CRITICAL + HIGH findings
   - strict: Process CRITICAL + HIGH + MEDIUM findings
   - all: Process all findings
3. Track skipped findings for reporting
4. Document skipped findings in fix report
```

**Reporting Skipped Findings**:

```markdown
## Skipped Findings (Below Mode Threshold)

**Mode Level**: normal (fixing CRITICAL/HIGH only)

**MEDIUM findings** (X skipped - reported but not fixed):

1. [File path] - [Issue description]

**LOW findings** (X skipped - reported but not fixed):

1. [File path] - [Issue description]

**Note**: Run with `mode=strict` or `mode=all` to fix these findings.
```

## Fixer Workflow Step 4: Fix Application

**Automatic Application** (HIGH confidence only):

- Apply ALL HIGH_CONFIDENCE fixes automatically
- NO confirmation prompts (no gate cycle waits for a person, per the [Quality Gate Contract](../../../../repo-governance/development/workflow/quality-gate-contract.md))
- Skip MEDIUM_CONFIDENCE findings (flag for manual review)
- Skip FALSE_POSITIVE findings (report to improve checker)
- Use the right tool for the edit shape:
- Single-file targeted edits: `Edit` tool (including registry-declared `source` or `vendored`
  paths under binding roots, plus `docs/` and `repo-governance/`); never edit a generated binding
  path or generated delimited region directly
  - Bulk mechanical substitutions across many files: `Bash` with `sed` / `awk`
  - New file creation: `Write` tool

**Fix Execution Pattern**:

```markdown
For each HIGH_CONFIDENCE finding:

1. Read current file state
2. Apply fix using appropriate tool
3. Verify fix applied correctly
4. Log fix in fix report (progressive writing)
5. Continue to next finding
```

## Fixer Workflow Step 5: Fix Report Generation

Generate fix report in `local-tmp/<agent-family>/` using same UUID chain as audit:

**File Naming Pattern**:

- Input audit: `{agent-family}__{uuid-chain}__{timestamp}__audit.md`
- Output fix: `{agent-family}__{uuid-chain}__{timestamp}__fix.md`
- Preserve UUID chain and timestamp from source audit
