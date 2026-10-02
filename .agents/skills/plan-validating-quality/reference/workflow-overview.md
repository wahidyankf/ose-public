# Workflow Overview

## Workflow Overview

See `repo-applying-maker-checker-fixer` Skill for the maker-checker-fixer shape: Step 0 (initialize
report — UUID, progressive writing) → Steps 1-N (domain-specific validation) → Final step (finalize
report — status, summary).

### Step 0: Initialize Report File

Use `repo-generating-validation-reports` Skill for report initialization.

### Step 0b: Load Known False Positive Skip List

Before validation, load `local-tmp/.known-false-positives.md` if it exists; reference during
ALL steps. Before reporting any finding, check the stable key
`[category] | [file] | [brief-description]`; if matched, log
`[PREVIOUSLY ACCEPTED FALSE_POSITIVE — skipped]` informationally — do not count or include in the
findings report:

```markdown
### [INFO] Previously Accepted FALSE_POSITIVE — Skipped

**Key**: [category] | [file] | [brief-description]
**Skipped**: Finding matches entry in local-tmp/.known-false-positives.md
**Originally Accepted**: [date from skip list]
```

### Step 0c: Re-validation Mode Detection

When a multi-part UUID chain exists (e.g. `abc123_def456`): run validation (Steps 2-6) and factual
accuracy (Step 4b) on the whole frozen plan again, per the
[Quality Gate Contract](../../../../repo-governance/development/workflow/quality-gate-contract.md); a
fix report's `## Changed Files` list never narrows the audit. Reuse iteration 1's
`## Codebase Files Inspected` list and do not read additional codebase files. This prevents scope
expansion across iterations.

### Step 1: Read Complete Plan

Read all plan files for full scope and structure.

**Comprehensive Codebase Inspection (Iteration 1 Only)**: on the first iteration (single-segment
UUID), read every file listed in "Files to modify"/"Files to create"/dependency lists; search for
related test files (fixtures, factories, helpers); check build/config files (`package.json`,
`.csproj`, `Dockerfile`) as relevant; record the inspection scope under `## Codebase Files Inspected`
(every path read). This scope is LOCKED after iteration 1 — never expand it later.

### Steps 2-6: Validate and Write Findings Immediately

Step 2 (Structure — folder naming, file organization, section presence), Step 3 (Requirements —
objectives, user stories, acceptance-criteria quality), Step 4 (Technical Documentation —
architecture, decisions, implementation clarity), Step 5 (Delivery Checklist — executability,
sequencing, granularity, validation criteria), Step 6 (Consistency — alignment across requirements,
tech docs, delivery steps). Write each step's findings to the report immediately.

### Step 7: Finalize Report

Update status to "Complete"; add summary statistics and prioritized recommendations.
