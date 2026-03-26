---
title: "Temporary Files Convention"
description: Guidelines for AI agents creating temporary uncommitted files and folders
category: explanation
subcategory: development
tags:
  - temporary-files
  - ai-agents
  - file-organization
  - best-practices
created: 2025-12-01
updated: 2025-12-26
---

# Temporary Files Convention

Guidelines for AI agents when creating temporary uncommitted files and folders in the open-sharia-enterprise repository.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Designated directories (`generated-reports/`, `local-temp/`) with explicit purposes. Report naming pattern clearly encodes agent family, timestamp, and type. No hidden temporary files scattered throughout the repository.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Two directories for all temporary files - one for reports, one for scratch work. Simple, flat structure with clear naming conventions. No complex hierarchies or categorization schemes.

## Conventions Implemented/Respected

**REQUIRED SECTION**: All development practice documents MUST include this section to ensure traceability from practices to documentation standards.

This practice implements/respects the following conventions:

- **[AI Agents Convention](../agents/ai-agents.md)**: All checker agents MUST have Write and Bash tools for report generation. Report-generating agents follow mandatory progressive writing requirement to survive context compaction.

- **[Timestamp Format Convention](../../conventions/formatting/timestamp.md)**: Report filenames use UTC+7 timestamps in format YYYY-MM-DD--HH-MM (hyphen-separated for filesystem compatibility).

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Report files follow 4-part pattern {agent-family}**{uuid-chain}**{timestamp}\_\_{type}.md with double-underscore separators. UUID chain enables parallel execution without file collisions.

## Overview

This convention establishes designated directories for temporary files created by AI agents during validation, auditing, checking, and other automated tasks. It prevents repository clutter and provides clear organization for ephemeral outputs.

## The Rule

**AI agents creating temporary uncommitted file(s) or folder(s) MUST use one of these directories:**

- `generated-reports/` - For validation, audit, and check reports
- `local-temp/` - For miscellaneous temporary files and scratch work

**Exception**: Unless specified otherwise by other existing governance/conventions in the repository.

## Mandatory Report Generation for Checker Agents

**CRITICAL REQUIREMENT**: All \*-checker agents MUST write their validation/audit reports to the `generated-reports/` directory. This is a hard requirement for consistency and traceability across all checker agent families.

### Checker Agents That Must Generate Reports

All checker agents in the following families MUST write audit reports to `generated-reports/`:

1. **repo-governance-checker** - Repository consistency validation
2. **apps-ayokoding-web-general-checker** - General content validation (ayokoding-web)
3. **apps-ayokoding-web-by-example-checker** - By-example tutorial validation (ayokoding-web)
4. **apps-ayokoding-web-facts-checker** - Educational content factual accuracy validation
5. **apps-ayokoding-web-link-checker** - Link validation (ayokoding-web)
6. **apps-oseplatform-web-content-checker** - Hugo content validation (oseplatform-web)
7. **docs-checker** - Documentation factual accuracy validation
8. **docs-link-general-checker** - External and internal link validation
9. **docs-tutorial-checker** - Tutorial quality validation
10. **readme-checker** - README quality validation
11. **plan-checker** - Plan readiness validation
12. **plan-execution-checker** - Implementation validation
13. **apps-ayokoding-web-in-the-field-checker** - In-the-field content validation (ayokoding-web)
14. **docs-software-engineering-separation-checker** - Software engineering docs separation validation
15. **repo-workflow-checker** - Workflow documentation quality validation
16. **specs-checker** - Gherkin/BDD specs directory structural and content validation
17. **swe-code-checker** - Software code quality validation

**NO EXCEPTIONS**: Checker agents MUST NOT output results in conversation only. All validation findings MUST be written to audit report files.

### Required Tool Permissions

All checker agents MUST have both `Write` and `Bash` tools in their frontmatter:

- **Write tool** - Required for creating report files in `generated-reports/`
- **Bash tool** - Required for generating UTC+7 timestamps using `TZ='Asia/Jakarta' date +"%Y-%m-%d--%H-%M"`

**Example frontmatter**:

```yaml
---
name: example-checker
description: Validates example content against conventions
tools: Read, Glob, Grep, Write, Bash
model: inherit
color: green
---
```

### Report File Naming Pattern

All checker agents MUST follow the universal naming pattern:

```
{agent-family}__{uuid-chain}__{YYYY-MM-DD--HH-MM}__{type}.md
```

**Components** (4 parts separated by `__`):

- `{agent-family}`: Agent name WITHOUT the `-checker` suffix (e.g., `repo-rules`, `ayokoding-web`, `docs`, `plan`)
- `{uuid-chain}`: Execution hierarchy as underscore-separated 6-char UUIDs (e.g., `a1b2c3`, `a1b2c3_d4e5f6`)
- `{YYYY-MM-DD--HH-MM}`: Timestamp in UTC+7 (double dash between date and time)
- `{type}`: Report type suffix (`audit`, `validation`, `fix`)

**UUID Chain Examples**:

- `a1b2c3` - Root execution (no parent)
- `a1b2c3_d4e5f6` - Child of a1b2c3
- `a1b2c3_d4e5f6_g7h8i9` - Grandchild (2 levels deep)

**Full Filename Examples**:

```
generated-reports/repo-rules__a1b2c3__2025-12-14--20-45__audit.md
generated-reports/ayokoding-web-general__d4e5f6__2025-12-14--15-30__audit.md
generated-reports/ayokoding-web-by-example__a1b2c3_d4e5f6__2025-12-14--15-45__audit.md
generated-reports/oseplatform-web-content__g7h8i9__2025-12-14--16-00__audit.md
generated-reports/docs__a1b2c3_d4e5f6_g7h8i9__2025-12-15--10-00__audit.md
generated-reports/plan__b2c3d4__2025-12-15--11-30__validation.md
generated-reports/plan-execution__c3d4e5__2025-12-15--14-00__validation.md
```

**Why UUID Chain?**

- **Parallelization**: Unique UUID per execution prevents file collisions when multiple agents run simultaneously
- **Traceability**: Underscore-separated chain shows parent-child execution hierarchy
- **Debugging**: Can trace back from any report to its root execution

### UUID Generation

All checker agents MUST generate a 6-character hexadecimal UUID at startup:

```bash
MY_UUID=$(uuidgen | tr '[:upper:]' '[:lower:]' | head -c 6)
# Example output: a1b2c3
```

**Why 6 characters?**

- 16^6 = 16,777,216 possible combinations
- Collision probability for 1000 parallel executions: ~0.003%
- Short enough for readable filenames, long enough for uniqueness

### Scope-Based Execution Tracking

To enable accurate parent-child hierarchy tracking across concurrent workflow runs, agents use **scope-based tracking files**.

**Tracking File Pattern**: `generated-reports/.execution-chain-{scope}`

**Scope Definitions**:

| Workflow/Agent            | Scope           | Tracking File                    |
| ------------------------- | --------------- | -------------------------------- |
| repo-governance-checker   | `repo-rules`    | `.execution-chain-repo-rules`    |
| docs-checker              | `docs`          | `.execution-chain-docs`          |
| docs-tutorial-checker     | `docs-tutorial` | `.execution-chain-docs-tutorial` |
| readme-checker            | `readme`        | `.execution-chain-readme`        |
| plan-checker              | `plan`          | `.execution-chain-plan`          |
| docs-link-general-checker | `docs-link`     | `.execution-chain-docs-link`     |
| ayokoding-web-\* (golang) | `golang`        | `.execution-chain-golang`        |
| ayokoding-web-\* (elixir) | `elixir`        | `.execution-chain-elixir`        |
| oseplatform-web-\*        | `ose-platform`  | `.execution-chain-ose-platform`  |

**Tracking File Format**: `{unix-timestamp} {uuid-chain}`

**Example**: `1703594400 a1b2c3_d4e5f6`

### Scope Passing

When spawning child agents, include `EXECUTION_SCOPE` in the prompt:

```bash
Task(
  subagent_type="docs-checker",
  prompt="Validate documentation. EXECUTION_SCOPE: docs"
)
```

### Agent Startup Logic

All checker agents MUST implement this startup logic:

```bash
# 1. Generate own UUID (6 hex chars)
MY_UUID=$(uuidgen | tr '[:upper:]' '[:lower:]' | head -c 6)

# 2. Determine scope (from prompt or default to agent-family)
# If EXECUTION_SCOPE found in prompt, use it; otherwise use agent-family
SCOPE="${EXECUTION_SCOPE:-${AGENT_FAMILY}}"

# 3. Read parent chain from scope-specific tracking file
CHAIN_FILE="generated-reports/.execution-chain-${SCOPE}"
if [ -f "$CHAIN_FILE" ]; then
  read PARENT_TIME PARENT_CHAIN < "$CHAIN_FILE"
  CURRENT_TIME=$(date +%s)
  TIME_DIFF=$((CURRENT_TIME - PARENT_TIME))

  if [ $TIME_DIFF -lt 300 ]; then
    # Recent parent, append to chain
    UUID_CHAIN="${PARENT_CHAIN}_${MY_UUID}"
  else
    # Stale parent (>300 seconds / 5 minutes), treat as root
    UUID_CHAIN="${MY_UUID}"
  fi
else
  # No tracking file, we're root
  UUID_CHAIN="${MY_UUID}"
fi

# 4. Generate timestamp
TIMESTAMP=$(TZ='Asia/Jakarta' date +"%Y-%m-%d--%H-%M")

# 5. Create report filename
REPORT_FILE="generated-reports/${AGENT_FAMILY}__${UUID_CHAIN}__${TIMESTAMP}__audit.md"

# 6. Write tracking file ONLY if about to spawn children
# Most checker/fixer agents skip this step (they don't spawn children)
```

### Write Tracking File Rule

**CRITICAL**: Only write to `.execution-chain-{scope}` when **about to spawn child agents**.

- PASS: Workflows write before spawning checkers
- PASS: Orchestrating agents write before spawning sub-agents
- FAIL: Checker agents do NOT write (they don't spawn children)
- FAIL: Fixer agents do NOT write (they don't spawn children)

This prevents race conditions when multiple children run in parallel.

### Concurrent Workflow Isolation

Scope-based tracking enables correct parent tracking for concurrent workflows:

```
T0: golang-workflow writes .execution-chain-golang = "aaa111"
T1: elixir-workflow writes .execution-chain-elixir = "bbb222"
T2: golang-checker reads .execution-chain-golang → "aaa111"
T3: elixir-checker reads .execution-chain-elixir → "bbb222"
```

Each workflow scope is isolated, preventing cross-contamination.

### Documented Limitation

> **Edge case:** If the same workflow with the same scope runs concurrently (e.g., two golang by-example validations simultaneously), parent tracking may be imperfect within that scope. This is expected behavior for concurrent operations on the same resource. The unique UUID still ensures no file collisions.

### Backward Compatibility

Fixer agents MUST handle both old (3-part) and new (4-part) filename formats:

```bash
BASENAME=$(basename "$AUDIT_FILE" .md)
PART_COUNT=$(echo "$BASENAME" | awk -F'__' '{print NF}')

if [ "$PART_COUNT" -eq 3 ]; then
  # Old format: agent__timestamp__type
  AGENT=$(echo "$BASENAME" | awk -F'__' '{print $1}')
  TIMESTAMP=$(echo "$BASENAME" | awk -F'__' '{print $2}')
  TYPE=$(echo "$BASENAME" | awk -F'__' '{print $3}')
  UUID_CHAIN=""
elif [ "$PART_COUNT" -eq 4 ]; then
  # New format: agent__uuid__timestamp__type
  AGENT=$(echo "$BASENAME" | awk -F'__' '{print $1}')
  UUID_CHAIN=$(echo "$BASENAME" | awk -F'__' '{print $2}')
  TIMESTAMP=$(echo "$BASENAME" | awk -F'__' '{print $3}')
  TYPE=$(echo "$BASENAME" | awk -F'__' '{print $4}')
fi
```

### Why This is Mandatory

**Consistency**: Standardized report location and naming across all checker families

**Traceability**: Timestamps enable chronological tracking of validation runs

**Integration**: Fixer agents expect audit reports in `generated-reports/` following this naming pattern

**Documentation**: Audit trail for all validation activities

**NO conversation-only output**: Reports must be persisted for review, comparison, and fixer integration

## Directory Purposes

### `generated-reports/`

**Use for**: Structured reports and analysis outputs

**Examples**:

- Validation reports (docs-checker, plan-checker, etc.)
- Audit reports (repo-governance-checker)
- Execution verification reports (plan-execution-checker)
- Todo lists and progress tracking

### Progressive Writing Requirement for Checker Agents

**CRITICAL BEHAVIORAL REQUIREMENT**: All \*-checker agents MUST write their validation reports PROGRESSIVELY (continuously updating files during execution), NOT buffering findings in memory to write once at the end.

**Why This is Critical:**

Progressive writing ensures reports survive context compaction:

- During long audits, conversation context may be compacted/summarized by the AI assistant
- If agent only writes report at the END, file contents may be lost during compaction
- If file is continuously updated THROUGHOUT execution, findings persist regardless of context compaction
- This is a **behavioral requirement**, not optional

**What Progressive Writing Means:**

**FAIL: Bad Pattern (Buffering - DO NOT DO THIS)**:

```markdown
findings = [] # Collect in memory
for item in items:
result = validate(item)
findings.append(result) # Buffer in memory

# At the very end...

write_report(findings) # Write once after all validation complete
```

**PASS: Good Pattern (Progressive - MUST DO THIS)**:

```markdown
file.write("# Audit Report\n\n") # Create file immediately
file.write("**Status**: In Progress\n\n")

for item in items:
result = validate(item)
file.write(f"## {item}\n")
file.write(f"Result: {result}\n\n") # Write immediately
file.flush() # Ensure written to disk

file.write("**Status**: Complete\n") # Update final status
file.flush()
```

**Requirements for All \*-Checker Agents:**

1. **Initialize file immediately** at start of agent execution (not at the end)
   - Use `Write` tool to create report file with header
   - Document creation timestamp and status "In Progress"
   - Each section added as discovered

2. **Write findings progressively** as they are discovered
   - Each validated item written to file immediately after checking
   - Use `Edit` or `Write` tool to append/update findings
   - Include interim status updates

3. **Update file continuously** throughout execution
   - Current progress indicator shown in file
   - Running totals updated
   - Any findings from this point forward are persisted

4. **Final update with completion status** when done
   - Update "In Progress" → "Complete"
   - Provide final summary statistics
   - File is fully persisted before agent finishes

5. **NO buffering in conversation** of findings to write later
   - Each finding must be written to file immediately
   - Conversation output is SUPPLEMENTARY (summary), not the source

**Implementation Pattern:**

All checker agents should follow this structure in their instructions:

```
## File Output Strategy

This agent writes findings PROGRESSIVELY to ensure survival through context compaction:

1. **Initialize** report file at execution start with header and "In Progress" status
2. **Validate** each item and write findings immediately to file (not buffered)
3. **Update** file continuously with progress indicator and running totals
4. **Finalize** with completion status and summary statistics
5. **Never** buffer findings in memory - write immediately after each validation

Report file: generated-reports/{agent-family}__{uuid-chain}__{YYYY-MM-DD--HH-MM}__audit.md

This progressive approach ensures findings persist even if context is compacted during long audits.
```

**Checker Agents Subject to This Requirement:**

ALL \*-checker agents must implement progressive writing:

1. repo-governance-checker
2. apps-ayokoding-web-general-checker
3. apps-ayokoding-web-by-example-checker
4. apps-ayokoding-web-facts-checker
5. apps-ayokoding-web-link-checker
6. apps-oseplatform-web-content-checker
7. docs-checker
8. docs-link-general-checker
9. docs-tutorial-checker
10. readme-checker
11. plan-checker
12. plan-execution-checker
13. apps-ayokoding-web-in-the-field-checker
14. docs-software-engineering-separation-checker
15. repo-workflow-checker
16. specs-checker
17. swe-code-checker

**Validation**: See repo-governance-checker agent for validation rules that verify progressive writing compliance across all checker agents.

### Report File Naming Standard

**CRITICAL REQUIREMENT**: All checker/fixer agents use standardized report naming pattern aligned with repository file naming convention.

**Pattern**: `{agent-family}__{uuid-chain}__{YYYY-MM-DD--HH-MM}__{suffix}.md`

**Components** (4 parts):

- `{agent-family}`: Agent name WITHOUT checker/fixer/maker suffix (e.g., `repo-rules`, `ayokoding-web`, `docs`, `plan`, `plan-execution`)
- `{uuid-chain}`: Execution hierarchy as underscore-separated 6-char UUIDs (e.g., `a1b2c3`, `a1b2c3_d4e5f6`)
- `{YYYY-MM-DD--HH-MM}`: Timestamp in UTC+7 with double dash between date and time
- `{suffix}`: Report type suffix (`audit`, `fix`, `validation`)

**Separator Rules**:

- Double underscore (`__`) separates the 4 major components
- Underscore (`_`) separates UUIDs within the uuid-chain
- Double dash (`--`) separates date from time within timestamp
- Single dash (`-`) separates components within date (YYYY-MM-DD) and time (HH-MM)
- NO "report" keyword in filename (redundant - location in `generated-reports/` makes purpose clear)

**Why this pattern**:

- **Alignment**: Follows repository file naming convention (`[prefix]__[content-identifier].md`)
- **Consistency**: Same separator style as documentation files (double underscore for major segments)
- **Clarity**: Agent family, UUID chain, timestamp, and suffix all clearly separated
- **Parallelization**: UUID prevents file collisions when multiple agents run simultaneously
- **Traceability**: UUID chain shows parent-child execution hierarchy
- **Sortability**: Agent family first enables grouping; timestamp enables chronological sorting within groups

**Example files**:

```
generated-reports/repo-rules__a1b2c3__2025-12-14--20-45__audit.md
generated-reports/repo-rules__a1b2c3__2025-12-14--20-45__fix.md
generated-reports/ayokoding-web__d4e5f6__2025-12-14--15-30__audit.md
generated-reports/ayokoding-web__a1b2c3_d4e5f6__2025-12-14--15-30__audit.md
generated-reports/oseplatform-web-content__g7h8i9__2025-12-14--15-30__audit.md
generated-reports/docs__b2c3d4__2025-12-15--10-00__validation.md
generated-reports/plan__c3d4e5__2025-12-15--11-30__validation.md
generated-reports/plan-execution__d4e5f6__2025-12-15--14-00__validation.md
```

**Pattern Rules**:

- Use double underscore (`__`) to separate the 4 components (agent-family, uuid-chain, timestamp, suffix)
- Use underscore (`_`) to separate UUIDs within the uuid-chain
- Use double dash (`--`) to separate date from time in timestamp
- UUID MUST be 6 lowercase hex characters (generated via `uuidgen | head -c 6`)
- Timestamp MUST be UTC+7 (YYYY-MM-DD--HH-MM format)
- Zero-pad all timestamp components (01 not 1, 09 not 9)
- Agent family is lowercase with single dashes (multi-word: `oseplatform-web-content`, `plan-execution`)
- Suffix is lowercase, no plurals (`audit` not `audits`)

**CRITICAL - UUID and Timestamp Generation:**

**FAIL: WRONG - Using placeholder values:**

```bash
# DO NOT use placeholder values
filename="repo-rules__abc123__2025-12-14--00-00__audit.md"  # WRONG!
```

**PASS: CORRECT - Execute bash commands for actual UUID and current time:**

```bash
# MUST generate real UUID and timestamp
uuid=$(uuidgen | tr '[:upper:]' '[:lower:]' | head -c 6)
timestamp=$(TZ='Asia/Jakarta' date +"%Y-%m-%d--%H-%M")
filename="repo-rules__${uuid}__${timestamp}__audit.md"
# Example: repo-rules__a1b2c3__2025-12-14--16-43__audit.md (actual values!)
```

**Why this is critical:** Placeholder timestamps like "00-00" defeat the entire purpose of timestamping. Reports must have accurate creation times for audit trails, chronological sorting, and debugging. See [Timestamp Format Convention](../../conventions/formatting/timestamp.md) for complete details.

#### Repository Audit Reports

**Agent**: repo-governance-checker
**Pattern**: `repo-rules__{uuid-chain}__{YYYY-MM-DD--HH-MM}__audit.md`
**Example**: `repo-rules__a1b2c3__2025-12-14--20-45__audit.md`

**Content**: Comprehensive consistency audit covering:

- AGENTS.md vs convention documents
- Agent definitions vs conventions
- Cross-references and links
- Duplication and contradictions
- Frontmatter consistency
- File naming compliance

**Timestamp**: Audit start time in UTC+7 (YYYY-MM-DD--HH-MM format)

**Retention**: Keep for historical tracking and comparison. Review/archive older reports periodically.

#### Link Validation Reports

**Agent**: docs-link-general-checker
**Pattern**: `docs-link__{uuid-chain}__{YYYY-MM-DD--HH-MM}__audit.md`
**Example**: `docs-link__a1b2c3__2025-12-14--20-45__audit.md`

**Content**: External and internal link validation results, broken links, redirect chains, cache maintenance summary (pruned links, usedIn updates)

**Timestamp**: Audit start time in UTC+7 (YYYY-MM-DD--HH-MM format)

**Retention**: Keep for historical tracking and comparison. Review/archive older reports periodically.

#### Fixer Reports (Universal Pattern)

**Agents**: All fixer agents (repo-governance-fixer, apps-ayokoding-web-general-fixer, apps-ayokoding-web-by-example-fixer, apps-ayokoding-web-facts-fixer, apps-ayokoding-web-in-the-field-fixer, apps-ayokoding-web-link-fixer, docs-tutorial-fixer, docs-software-engineering-separation-fixer, apps-oseplatform-web-content-fixer, readme-fixer, docs-fixer, plan-fixer, repo-workflow-fixer, specs-fixer)

**Pattern**: `{agent-family}__{uuid-chain}__{YYYY-MM-DD--HH-MM}__fix.md`

**Universal Structure**: All fixer agents follow the same report structure:

**Naming Convention**:

- Replaces `__audit` suffix with `__fix` suffix
- **CRITICAL**: Uses SAME uuid-chain AND timestamp as source audit report
- This creates clear audit-fix report pairing for traceability

**Report Pairing Examples**:

| Agent Family            | Audit Report                                                   | Fix Report                                                   |
| ----------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| repo-rules              | `repo-rules__a1b2c3__2025-12-14--20-45__audit.md`              | `repo-rules__a1b2c3__2025-12-14--20-45__fix.md`              |
| ayokoding-web           | `ayokoding-web__d4e5f6__2025-12-14--15-30__audit.md`           | `ayokoding-web__d4e5f6__2025-12-14--15-30__fix.md`           |
| oseplatform-web-content | `oseplatform-web-content__g7h8i9__2025-12-14--16-00__audit.md` | `oseplatform-web-content__g7h8i9__2025-12-14--16-00__fix.md` |
| docs-tutorial           | `docs-tutorial__a1b2c3_d4e5f6__2025-12-14--10-15__audit.md`    | `docs-tutorial__a1b2c3_d4e5f6__2025-12-14--10-15__fix.md`    |
| readme                  | `readme__b2c3d4__2025-12-14--09-45__audit.md`                  | `readme__b2c3d4__2025-12-14--09-45__fix.md`                  |
| docs                    | `docs__c3d4e5__2025-12-15--10-00__validation.md`               | `docs__c3d4e5__2025-12-15--10-00__fix.md`                    |
| plan                    | `plan__d4e5f6__2025-12-15--11-30__validation.md`               | `plan__d4e5f6__2025-12-15--11-30__fix.md`                    |

**Why Same UUID and Timestamp?**

- UUID chain enables exact matching of audit to fix report
- Timestamp enables chronological tracking
- Audit trail shows what was detected vs what was fixed
- Supports debugging (compare checker findings vs fixer actions)

**Universal Content Structure**:

All fixer reports include these sections:

1. **Validation Summary**:
   - Total findings processed from audit report
   - Fixes applied (HIGH confidence count)
   - False positives detected (count)
   - Needs manual review (MEDIUM confidence count)

2. **Fixes Applied**:
   - Detailed list of HIGH confidence fixes
   - What was changed in each file
   - Re-validation results confirming issue
   - Confidence level reasoning

3. **False Positives Detected**:
   - Checker findings that re-validation disproved
   - Why checker was wrong (detection logic flaw)
   - Actionable recommendations to improve checker
   - Example code showing correct validation approach

4. **Needs Manual Review**:
   - MEDIUM confidence items requiring human judgment
   - Why automated fix was skipped (subjective/ambiguous/risky)
   - Action required from user

5. **Recommendations for Checker**:
   - Improvements based on false positives
   - Concrete suggestions with example code
   - Impact assessment

6. **Files Modified**:
   - Complete list of files changed during fix application
   - Total count for summary

**Confidence Levels**: All fixers use universal three-level system (HIGH/MEDIUM/FALSE_POSITIVE). See [Fixer Confidence Levels Convention](../quality/fixer-confidence-levels.md) for complete criteria.

**Workflow**:

1. Checker generates audit report
2. User reviews audit report
3. User invokes fixer
4. Fixer reads audit report, re-validates findings
5. Fixer applies HIGH confidence fixes automatically
6. Fixer generates fix report with same timestamp as audit

**Retention**: Keep alongside audit reports for complete audit trail. Provides transparency on automated fixes vs manual review items vs false positives.

#### Content Validation Reports

**Agents**: apps-ayokoding-web-general-checker, apps-ayokoding-web-by-example-checker, apps-ayokoding-web-facts-checker, apps-ayokoding-web-in-the-field-checker, apps-ayokoding-web-link-checker, apps-oseplatform-web-content-checker
**Pattern**: `{site}__{uuid-chain}__{YYYY-MM-DD--HH-MM}__audit.md`

**Examples**:

- `ayokoding-web-general__a1b2c3__2025-12-14--15-30__audit.md`
- `ayokoding-web-by-example__d4e5f6__2025-12-14--15-45__audit.md`
- `ayokoding-web-facts__a1b2c3__2025-12-14--15-50__audit.md`
- `ayokoding-web-in-the-field__d4e5f6__2025-12-14--15-55__audit.md`
- `ayokoding-web-link__g7h8i9__2025-12-14--16-00__audit.md`
- `oseplatform-web-content__g7h8i9__2025-12-14--16-10__audit.md`

**Content**: Content validation results (quality, factual accuracy, links)

#### Documentation Validation Reports

**Agent**: docs-checker
**Pattern**: `docs__{uuid-chain}__{YYYY-MM-DD--HH-MM}__validation.md`
**Example**: `docs__a1b2c3__2025-12-15--10-00__validation.md`

**Content**: Documentation factual accuracy and consistency validation

#### Plan Validation Reports

**Agent**: plan-checker
**Pattern**: `plan__{uuid-chain}__{YYYY-MM-DD--HH-MM}__validation.md`
**Example**: `plan__b2c3d4__2025-12-15--11-30__validation.md`

**Content**: Plan readiness validation (completeness, accuracy, implementability)

#### Plan Execution Validation Reports

**Agent**: plan-execution-checker
**Pattern**: `plan-execution__{uuid-chain}__{YYYY-MM-DD--HH-MM}__validation.md`
**Example**: `plan-execution__c3d4e5__2025-12-15--14-00__validation.md`

**Content**: Implementation validation against requirements

### `local-temp/`

**Use for**: Miscellaneous temporary files and scratch work

**Examples**:

- Draft files before finalizing
- Temporary data processing files
- Scratch notes and calculations
- Intermediate build artifacts
- Any temporary files that don't fit the "report" category

**Naming pattern**: No strict pattern required (use descriptive names)

**Example files**:

```
local-temp/draft-convention.md
local-temp/temp-analysis.json
local-temp/scratch-notes.txt
```

## PASS: When This Applies

Use these directories when:

- Creating validation or audit reports
- Generating temporary checklists or todo lists
- Writing intermediate analysis files
- Creating scratch files for processing
- Any file that is **not meant to be committed** to version control
- Files intended for immediate review/use only

## FAIL: When NOT to Use These Directories

Do NOT use these directories for:

- **Permanent documentation** - Use `docs/` directory with proper naming convention
- **Operational metadata** - Use `docs/metadata/` directory (e.g., `external-links-status.yaml` for link verification cache)
- **Project planning** - Use `plans/` directory with proper structure
- **Source code** - Use `apps/` or `libs/` directories
- **Configuration files** - Place in repository root or appropriate subdirectories
- **Files explicitly required by other conventions** - Follow the specific convention's guidelines

## Implementation for AI Agents

### For Report-Generating Agents

Agents that create validation/audit reports (docs-checker, plan-checker, repo-governance-checker, etc.) should:

1. Use `generated-reports/` directory
2. Follow naming pattern: `{agent-family}__{uuid-chain}__{YYYY-MM-DD--HH-MM}__{type}.md`
3. Include timestamp in filename for traceability
4. Use descriptive report type in filename
5. **MUST have both Write and Bash tools** in their frontmatter

**Tool Requirements**:

Any agent writing to `generated-reports/` MUST have:

- **Write tool**: Required for creating report files
- **Bash tool**: Required for generating UTC+7 timestamps using `TZ='Asia/Jakarta' date +"%Y-%m-%d--%H-%M"`

**Example frontmatter**:

```yaml
---
name: repo-governance-checker
description: Validates consistency between agents, AGENTS.md, conventions, and documentation.
tools: Read, Glob, Grep, Write, Bash
model: sonnet
color: green
---
```

**Rationale**: Write tool creates the file, Bash tool generates accurate timestamps. Both are mandatory for report-generating agents.

**Example implementation**:

```markdown
When generating a validation report:

- Path: `generated-reports/docs__a1b2c3__2025-12-01--14-30__validation.md`
- Include: Timestamp, agent name, summary, detailed findings
```

### For General-Purpose Agents

Agents creating miscellaneous temporary files should:

1. Use `local-temp/` directory
2. Use descriptive filenames
3. Clean up files after use (when appropriate)
4. Document the purpose of temporary files if they're long-lived

## ️ Directory Status

Both directories are **gitignored** (not tracked by version control):

Under the "Temporary files" section (line 70):

- `local-temp/`

Under the "Generated reports" section (line 73):

- `generated-reports/`

Under the "Execution tracking files" section:

- `generated-reports/.execution-chain-*`

Files in these directories will not be committed to the repository.

**Note**: The `.execution-chain-{scope}` files are hidden files within `generated-reports/` used for parent-child execution tracking. They are automatically gitignored via the `generated-reports/` pattern.

## Exception Handling

The rule includes "unless specified otherwise by other governance/conventions":

- If a specific convention already defines where certain files should go, **follow that convention instead**
- This rule serves as the **default/fallback** for temporary files
- When in doubt, use these directories rather than creating files in the repository root

**Example exceptions**:

- **Operational metadata files** - Use `docs/metadata/` instead (e.g., `external-links-status.yaml` is committed to git, not temporary)
- Agent-specific conventions may override this rule
- Task-specific requirements may specify different locations
- User instructions may explicitly request different locations

## Related Conventions

- [File Naming Convention](../../conventions/structure/file-naming.md) - For permanent documentation files
- [AI Agents Convention](../agents/ai-agents.md) - For agent design and tool access
- [Diátaxis Framework](../../conventions/structure/diataxis-framework.md) - For documentation organization

## Benefits

This convention provides:

1. **Clear Organization** - Temporary files are isolated from permanent content
2. **Prevent Clutter** - No temporary files scattered across the repository
3. **Easy Cleanup** - Both directories can be safely cleared when needed
4. **Traceability** - Generated reports include dates for tracking
5. **Consistent Behavior** - All agents follow the same pattern

## Important Notes

- Always use one of these directories for temporary files (never the repository root)
- Choose `generated-reports/` for structured reports, `local-temp/` for everything else
- Include dates in report filenames for traceability
- Remember these files are gitignored and won't be committed
- Clean up old files periodically to prevent accumulation
