---
title: "Criticality Levels Convention"
description: Universal criticality level system for categorizing validation findings across all checker and fixer agents
category: explanation
subcategory: development
tags:
  - criticality
  - validation
  - checker-agents
  - fixer-agents
  - quality-assurance
created: 2025-12-27
---

# Criticality Levels Convention

**Purpose**: Define universal issue severity classification system for all checker agents in the repository.

**Scope**: All checker agents and fixer agents must use this standardized criticality system. See [AI Agents Index](./../../../.claude/agents/README.md) for the complete list.

**Status**: Active (standardizes existing inconsistent terminology)

---

## Overview

This convention establishes a universal **four-level criticality system** (CRITICAL/HIGH/MEDIUM/LOW) for categorizing validation findings across all checker agents. Criticality measures **importance and urgency** of fixing an issue, answering "how soon must this be fixed?"

### Why This Convention Exists

**Problem**: Seven different severity classification systems existed across checker agents, causing confusion and inconsistency:

- `repo-rules-checker`: Critical/Important/Minor
- `apps-ayokoding-web-general-checker`: Must Fix/Warnings/Suggestions
- `readme-checker`: High/Medium/Low Priority
- `docs-checker`: [Verified]/[Error]/[Outdated] (verification-based, NOT severity)
- `docs-link-checker`: [OK]/[BROKEN]/[REDIRECT] (status-based, NOT severity)
- `plan-checker`: Critical/Warnings/Recommendations

**Solution**: Universal 4-level system that works orthogonally with existing confidence levels.

### Relationship to Confidence Levels

**Criticality and confidence are orthogonal dimensions**:

- **Criticality** (CRITICAL/HIGH/MEDIUM/LOW) → **Importance/Urgency** - "How critical is this issue?"
- **Confidence** (HIGH/MEDIUM/FALSE_POSITIVE) → **Certainty/Fixability** - "How certain are we it needs fixing?"

See [Fixer Confidence Levels Convention](./fixer-confidence-levels.md) for complete confidence system details.

**Example showing both dimensions**:

```markdown
## CRITICAL Issues (Must Fix)

### 1. Missing Required Field Breaks Content Validation

**File**: `apps/ayokoding-web/content/en/programming/python/_index.md:3`
**Criticality**: CRITICAL - Breaks Next.js content validation
**Confidence**: HIGH - Field objectively missing from frontmatter

**Finding**: Required `draft` field missing from frontmatter
**Impact**: Content validation fails with "required field missing" error
```

---

## Four Universal Criticality Levels

### CRITICAL

**Definition**: Issues that break functionality, block users, or violate mandatory requirements.

**Impact**: System failures, build breaks, broken user experiences, security vulnerabilities.

**When to Use**:

- Missing required fields that prevent compilation/build
- Broken links that cause 404 errors
- Security vulnerabilities
- Data loss risks
- Syntax errors that prevent execution
- Violations of MUST requirements in conventions

**Action Required**: Must fix before publication/deployment/merge.

**Auto-Fix**: Yes (if confidence is HIGH).

**Examples Across Domains**:

**Repository Governance**:

- Missing required `subcategory` field in convention document frontmatter
- Agent `name` field doesn't match filename (breaks agent discovery)
- Broken internal link to non-existent file in documentation

**Next.js Content (ayokoding-web/oseplatform-web)**:

- Missing required `title` field (content validation fails)
- Invalid frontmatter syntax (YAML parsing error)
- Broken internal links (404 on site)
- Missing language prefix in internal links (Next.js specific)

**Documentation (docs/)**:

- Command syntax errors that would fail when executed
- Broken links to critical reference material
- Security vulnerabilities in code examples
- Missing alt text on images (WCAG violation)

**Plans**:

- Missing required sections in plan template
- Contradictory requirements (implementation impossible)
- Broken links to critical dependencies

**README**:

- Broken quick start instructions (users cannot get started)
- Incorrect installation commands (fails on execution)

**Factual Validation**:

- Code examples that won't compile/run
- Incorrect command syntax (verified via web search)
- Outdated major version references (breaking changes exist)

**Links**:

- 404 errors on internal links
- 404 errors on external links to critical resources
- Redirect chains >3 hops

### HIGH

**Definition**: Issues causing significant quality degradation or violating documented conventions.

**Impact**: Poor user experience, accessibility violations, convention non-compliance, maintainability problems.

**When to Use**:

- Wrong format but system still functions
- Accessibility violations (WCAG AA failures)
- Convention violations (documented SHOULD requirements)
- Incorrect link format (works but violates convention)
- Missing optional but important fields
- Structural inconsistencies affecting navigation

**Action Required**: Should fix before publication (current cycle).

**Auto-Fix**: Yes (if confidence is HIGH).

**Examples Across Domains**:

**Repository Governance**:

- Missing "Principles Respected" section in convention doc
- YAML comments in agent frontmatter (convention violation)
- Filename not following kebab-case convention

**Next.js Content**:

- Missing `weight` field (navigation order undefined)
- Wrong heading hierarchy (H3 before H2)
- Missing overview links in navigation
- Incorrect internal link format (relative path instead of absolute)

**Documentation**:

- Missing alt text on non-critical images
- Passive voice in instructional content
- Incorrect heading nesting (H1 → H3 skip)
- Missing code block language tags

**Plans**:

- Missing acceptance criteria
- Incomplete deliverables checklist
- Ambiguous requirements needing clarification

**README**:

- Jargon without explanation
- Paragraphs >5 lines (scannability issue)
- Missing problem-solution hook
- Acronyms without context

**Factual Validation**:

- Outdated minor version (still functional but newer exists)
- Unverified external claims (need web verification)
- Incomplete code examples (missing imports)

**Links**:

- External link redirects (1-2 hops, working but suboptimal)
- Missing HTTPS upgrade
- Slow-loading external resources

### MEDIUM

**Definition**: Minor quality issues, style inconsistencies, or cosmetic problems.

**Impact**: Slight quality degradation, minor style inconsistencies, suboptimal but functional.

**When to Use**:

- Missing optional fields with minimal impact
- Formatting inconsistencies (whitespace, indentation variations)
- Suboptimal structure that still works
- Outdated versions that remain functional
- Minor style guide deviations
- Cosmetic improvements

**Action Required**: Fix when convenient (next cycle or maintenance window).

**Auto-Fix**: Only if explicitly approved by user.

**Examples Across Domains**:

**Repository Governance**:

- Missing optional description fields
- Suboptimal section ordering (still readable)
- Minor formatting inconsistencies

**Next.js Content**:

- Missing optional `description` field in frontmatter
- Inconsistent emoji usage (semantic meaning clear)
- Suboptimal weight spacing (still ordered correctly)

**Documentation**:

- Inconsistent code fence language tags (markdown vs md)
- Minor formatting variations in lists
- Suboptimal diagram styling

**Plans**:

- Missing optional implementation notes
- Suboptimal section organization
- Minor formatting inconsistencies

**README**:

- Paragraphs at 4-5 lines (approaching but not exceeding limit)
- Slightly verbose explanations
- Minor structural improvements

**Factual Validation**:

- Outdated patch versions (no breaking changes)
- Alternative approaches not mentioned
- Documentation could be more comprehensive

**Links**:

- Slow external resources (>3s load time)
- Unverified optional references
- Missing title attributes on links

### LOW

**Definition**: Suggestions, optional improvements, enhancements.

**Impact**: Potential improvements, alternative approaches, optimizations, future considerations.

**When to Use**:

- Performance optimizations
- Alternative implementation suggestions
- Future-proofing recommendations
- Nice-to-have enhancements
- Best practice suggestions (not requirements)
- Potential refactoring opportunities

**Action Required**: Consider for future work (optional).

**Auto-Fix**: No (suggestions only).

**Examples Across Domains**:

**Repository Governance**:

- Suggest adding optional cross-references
- Alternative organization suggestions
- Potential future convention additions

**Next.js Content**:

- Suggest adding optional metadata
- Performance optimization opportunities
- Alternative content structures

**Documentation**:

- Suggest additional examples
- Consider adding diagrams
- Potential cross-linking opportunities

**Plans**:

- Suggest additional acceptance criteria
- Consider alternative approaches
- Potential risk mitigations

**README**:

- Suggest additional visual elements
- Consider adding badges
- Potential structural improvements

**Factual Validation**:

- Consider mentioning alternative tools
- Future version considerations
- Additional context suggestions

**Links**:

- Suggest adding related resources
- Consider internal cross-references
- Potential deep-linking improvements

---

## Criticality × Confidence Decision Matrix

This matrix shows how criticality and confidence combine to determine **priority** and **fix strategy**.

| Criticality  | HIGH Confidence                                               | MEDIUM Confidence                                   | FALSE_POSITIVE                                             |
| ------------ | ------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| **CRITICAL** | **P0** - Auto-fix immediately<br>Block deployment until fixed | **P1** - URGENT manual review<br>High priority flag | Report with CRITICAL context<br>Improve checker urgently   |
| **HIGH**     | **P1** - Auto-fix after P0<br>Fix before publication          | **P2** - Standard manual review<br>Normal priority  | Report with HIGH context<br>Improve checker soon           |
| **MEDIUM**   | **P2** - Auto-fix after P1<br>Requires user approval          | **P3** - Optional review<br>Low priority            | Report with MEDIUM context<br>Note for checker improvement |
| **LOW**      | **P3** - Include in batch fixes<br>User decides if/when       | **P4** - Suggestions only<br>No urgency             | Report with LOW context<br>Informational only              |

### Priority Levels Explained

- **P0** (Blocker): Must fix before any publication/deployment
- **P1** (Urgent): Should fix before publication, can proceed with approval
- **P2** (Normal): Fix in current cycle when convenient
- **P3** (Low): Fix in future cycle or batch operation
- **P4** (Optional): Suggestion only, no action required

### Execution Strategy for Fixers

**Fixer agents should process findings in priority order**:

1. **P0 fixes first** (CRITICAL + HIGH confidence)
   - Apply automatically without prompts
   - Block if any P0 fixes fail
   - Report immediately

2. **P1 fixes second** (HIGH + HIGH confidence OR CRITICAL + MEDIUM confidence)
   - Apply HIGH + HIGH automatically
   - Flag CRITICAL + MEDIUM for urgent manual review
   - Continue on failures (don't block)

3. **P2 fixes third** (MEDIUM + HIGH confidence OR HIGH + MEDIUM confidence)
   - Apply MEDIUM + HIGH if user approved batch fixes
   - Flag HIGH + MEDIUM for standard review
   - Skip if not approved

4. **P3-P4 last** (LOW priority combinations)
   - Include in summary only
   - Apply only if explicitly requested
   - No automatic application

**Example execution log**:

```
Fixer Execution Summary:

P0 (CRITICAL + HIGH): 5 findings
   Fixed 5/5 automatically

P1 (HIGH + HIGH): 12 findings
   Fixed 12/12 automatically

P1 (CRITICAL + MEDIUM): 2 findings
  Flagged for urgent manual review:
    - File X: Ambiguous fix target
    - File Y: Context-dependent correction

P2 (MEDIUM + HIGH): 8 findings
   Fixed 8/8 (user approved batch mode)

P2 (HIGH + MEDIUM): 3 findings
  Flagged for standard review

P3-P4: 15 findings
  Included in summary (no action)

Total: 45 findings processed
  - 25 fixed automatically
  - 5 flagged for manual review
  - 15 suggestions only
```

---

## Standardized Report Format

All checker agents must generate reports following this template.

### Report Header

```markdown
# [Agent Name] Audit Report

**Audit ID**: {uuid-chain}\_\_{timestamp}
**Scope**: {scope-description}
**Files Checked**: N files
**Audit Start**: YYYY-MM-DDTHH:MM:SS+07:00
**Audit End**: YYYY-MM-DDTHH:MM:SS+07:00
**Duration**: Mm Ss

---

## Executive Summary

- **CRITICAL Issues**: X (must fix before publication)
- **HIGH Issues**: Y (should fix before publication)
- **MEDIUM Issues**: Z (improve when time permits)
- **LOW Issues**: W (optional enhancements)

**Total Issues**: X + Y + Z + W = TOTAL

**Overall Status**: [PASS | PASS WITH WARNINGS | FAIL]

**Status Determination**:

- PASS: Zero CRITICAL and HIGH issues
- PASS WITH WARNINGS: Zero CRITICAL, some HIGH/MEDIUM/LOW issues
- FAIL: One or more CRITICAL issues present

---
```

### Issue Sections

Each criticality level has its own section with consistent formatting:

````markdown
## CRITICAL Issues (Must Fix)

**Count**: X issues found

---

### 1. [Issue Title - Brief Description]

**File**: `path/to/file.md:line`
**Criticality**: CRITICAL - [One-line justification why critical]
**Category**: [Missing Required Field | Broken Link | Syntax Error | Security Vulnerability | etc.]

**Finding**:
[Clear, specific description of what's wrong]

**Impact**:
[What breaks or fails if not fixed - user/system consequences]

**Recommendation**:
[Specific, actionable fix - exact change needed]

**Example**:

```yaml
# Current (broken)
---
title: "Example"
# Missing required 'draft' field
---
# Expected (fixed)
---
title: "Example"
draft: false
---
```
````

**Confidence**: HIGH
[If confidence differs from HIGH, explain assessment]

---

### 2. [Next CRITICAL Issue]

[Same format as above]

---

[Continue for all CRITICAL findings]

````

**Repeat section template for each criticality level**:

- `## HIGH Issues (Should Fix)`
- `## MEDIUM Issues (Improve When Possible)`
- `## LOW Issues (Optional Enhancements)`

### Report Footer

```markdown
---

## Recommendations

### Critical Path (Before Publication)
1. Fix all CRITICAL issues immediately (blocking)
2. Address HIGH issues before deployment (recommended)

### Next Iteration
- Review and fix MEDIUM issues for polish
- Consider LOW suggestions if relevant to current work

### For Fixer Agent
Run `{agent-family}-fixer` on this audit report:
- Fixer will auto-apply HIGH confidence fixes for CRITICAL and HIGH issues
- MEDIUM confidence issues flagged for manual review
- FALSE_POSITIVE findings will be reported to improve checker

---

## Audit Completion

**Report File**: `generated-reports/{agent-family}__{uuid-chain}__{timestamp}__audit.md`
**Next Steps**:
1. Review findings by priority (CRITICAL → HIGH → MEDIUM → LOW)
2. Run fixer agent if auto-fixes desired
3. Manually address flagged items

---

**Audit Report ID**: {uuid-chain}
**Checker Version**: {agent-name} v{version}
**Generated**: {timestamp} UTC+7
````

### Dual-Label Pattern

**Five agents require both verification/status AND criticality labels**:

- `docs-checker` - Verification labels ([Verified], [Error], [Outdated], [Unverified])
- `docs-tutorial-checker` - Verification labels
- `apps-ayokoding-web-facts-checker` - Verification labels
- `docs-link-checker` - Status labels ([OK], [BROKEN], [REDIRECT])
- `apps-ayokoding-web-link-checker` - Status labels

**Format for dual-label findings**:

```markdown
### 1. [Verification/Status] - Issue Title

**File**: `path/to/file.md:line`
**Verification**: [Error] - [Reason for verification status]
**Criticality**: HIGH - [Reason for criticality level]
**Category**: [Category name]

**Finding**: [Description]
**Impact**: [Consequences]
**Recommendation**: [Fix]

**Example**: [Code or output showing issue]

**Confidence**: HIGH
```

**Example from docs-checker**:

```markdown
### 1. [Error] - Command Syntax Incorrect in Installation Guide

**File**: `docs/tutorials/quick-start.md:42`
**Verification**: [Error] - Command syntax verified incorrect via WebSearch
**Criticality**: CRITICAL - Breaks user quick start experience
**Category**: Factual Error - Command Syntax

**Finding**:
Installation command uses incorrect npm flag `--save-deps` (should be `--save-dev`)

**Impact**:
Users following quick start tutorial get command error, cannot complete setup

**Recommendation**:
Change `npm install --save-deps prettier` to `npm install --save-dev prettier`

**Verification Source**:
Official npm documentation confirms `--save-dev` is correct flag for dev dependencies
https://docs.npmjs.com/cli/v9/commands/npm-install

**Confidence**: HIGH
```

**Example from docs-link-checker**:

```markdown
### 1. [BROKEN] - Reference Link Returns 404

**File**: `governance/conventions/formatting/linking.md:89`
**Status**: [BROKEN] - HTTP 404 Not Found
**Criticality**: CRITICAL - Breaks documentation reference chain
**Category**: Broken External Link

**Finding**:
Link to external markdown syntax guide returns 404 error

**Impact**:
Users cannot access referenced resource, documentation incomplete

**Recommendation**:
Update link to current documentation URL or find alternative resource

**Link**: `https://example.com/old-markdown-guide`
**HTTP Status**: 404 Not Found
**Last Checked**: 2025-12-27T10:30:00+07:00

**Confidence**: HIGH
```

**Key Point**: Verification/status describes WHAT (factual state), criticality describes HOW URGENT (importance).

---

## Domain-Specific Examples

### Repository Governance (repo-rules-checker)

**CRITICAL**:

- Missing required `subcategory` field in convention document (breaks organization)
- Agent `name` field doesn't match filename (agent discovery fails)
- YAML comment in agent frontmatter (parsing error)

**HIGH**:

- Missing "Principles Respected" section in convention (traceability violation)
- Filename not in kebab-case (convention violation)
- Broken internal link to convention document

**MEDIUM**:

- Missing optional cross-reference
- Suboptimal section ordering
- Minor formatting inconsistency

**LOW**:

- Suggest adding related links
- Consider alternative organization
- Potential future sections

### Next.js Content - ayokoding-web (general-checker, facts-checker, link-checker)

**CRITICAL**:

- Missing required `title` field (content validation fails)
- Invalid YAML syntax in frontmatter (parsing error)
- Broken internal link without language prefix (404 on site)
- Code example won't compile (verified via web search)

**HIGH**:

- Missing `weight` field (navigation order undefined)
- Wrong internal link format (relative instead of absolute)
- Incorrect heading hierarchy (H3 before H2)
- Outdated tutorial sequence (verified via official docs)

**MEDIUM**:

- Missing optional `description` field
- Suboptimal weight spacing (still ordered correctly)
- Minor bilingual inconsistency (both versions functional)
- Unverified external claim (needs web verification)

**LOW**:

- Suggest adding optional tags
- Consider alternative content structure
- Potential cross-linking opportunity
- Suggest mentioning alternative approach

### Next.js Content - oseplatform-web (content-checker)

**CRITICAL**:

- Missing required frontmatter for Next.js content validation
- Broken internal link (404 error)
- Invalid markdown syntax (rendering breaks)

**HIGH**:

- Missing recommended metadata for SEO
- Wrong heading hierarchy
- Accessibility violation (missing alt text)

**MEDIUM**:

- Suboptimal content organization
- Minor formatting inconsistency
- Missing optional PaperMod feature

**LOW**:

- Suggest adding cover image
- Consider adding tags
- Potential cross-reference

### Documentation (docs-checker, docs-tutorial-checker, docs-link-checker)

**CRITICAL**:

- [Error] Command syntax incorrect (verified via web search)
- [BROKEN] Internal link to non-existent file (404)
- Security vulnerability in code example
- Missing alt text on critical diagram (WCAG violation)

**HIGH**:

- [Outdated] Major version reference with breaking changes
- [BROKEN] External link to important resource (404)
- Passive voice in step-by-step instructions
- Wrong heading nesting (H1 → H3)

**MEDIUM**:

- [Unverified] External claim needs web verification
- [REDIRECT] External link redirects (1 hop, working)
- Minor formatting inconsistency
- Missing optional code fence language tag

**LOW**:

- Suggest additional examples
- Consider adding diagram
- Potential cross-linking opportunity
- Alternative phrasing suggestion

### Plans (plan-checker, plan-execution-checker)

**CRITICAL**:

- Missing required sections (Goal, Approach, Deliverables)
- Contradictory requirements (implementation impossible)
- Broken link to critical dependency

**HIGH**:

- Missing acceptance criteria
- Incomplete deliverables checklist
- Ambiguous requirements needing clarification

**MEDIUM**:

- Missing optional risk section
- Suboptimal organization
- Minor formatting issue

**LOW**:

- Suggest additional context
- Consider alternative approach
- Potential refinement

### README (readme-checker)

**CRITICAL**:

- Broken quick start instructions (commands fail)
- Incorrect installation command (verified incorrect)
- Missing navigation structure (users lost)

**HIGH**:

- Jargon without explanation (accessibility issue)
- Paragraph >5 lines (scannability violation)
- Missing problem-solution hook
- Acronym without context

**MEDIUM**:

- Paragraph at 4-5 lines (approaching limit)
- Slightly verbose explanation
- Minor structural improvement needed

**LOW**:

- Suggest adding visual elements
- Consider adding badges
- Potential rewording for clarity

### Workflows (repo-workflow-checker)

**CRITICAL**:

- Missing required workflow metadata (goal, termination)
- Invalid step dependency reference (execution breaks)
- Contradictory termination criteria

**HIGH**:

- Missing success criteria for step
- Ambiguous agent invocation pattern
- Incomplete error handling specification

**MEDIUM**:

- Missing optional example usage
- Suboptimal step ordering
- Minor formatting inconsistency

**LOW**:

- Suggest additional examples
- Consider alternative agent selection
- Potential optimization

### By-Example Tutorials (apps-ayokoding-web-by-example-checker)

**CRITICAL**:

- Code example won't run (syntax error verified)
- Missing critical example for core concept
- Coverage <95% (below requirement)

**HIGH**:

- Example missing educational annotation
- Missing diagram for complex concept
- Code example incomplete (missing imports)

**MEDIUM**:

- Annotation could be more detailed
- Alternative approach not shown
- Minor code style inconsistency

**LOW**:

- Suggest additional edge case
- Consider showing optimization
- Potential alternative syntax

---

## Implementation Guidelines for Checker Agents

### Assessment Decision Tree

When categorizing a finding, use this decision tree:

```
1. Does it BREAK functionality or BLOCK users?
   YES → CRITICAL
   NO → Continue to 2

2. Does it cause SIGNIFICANT quality degradation or violate DOCUMENTED conventions?
   YES → HIGH
   NO → Continue to 3

3. Is it a MINOR quality issue or style inconsistency?
   YES → MEDIUM
   NO → Continue to 4

4. Is it a suggestion, optimization, or future consideration?
   YES → LOW
```

### Context-Specific Adjustments

**Build/Compilation Breaking**:

- Always CRITICAL (blocks deployment)

**Security/Privacy**:

- Always CRITICAL (blocks deployment)

**Accessibility Violations**:

- WCAG A violations: CRITICAL
- WCAG AA violations: HIGH
- WCAG AAA violations: MEDIUM

**Link Status**:

- 404 on critical reference: CRITICAL
- 404 on optional reference: HIGH
- Redirect working: MEDIUM
- Slow loading: LOW

**Factual Errors**:

- Command won't run: CRITICAL
- Outdated major version with breaking changes: HIGH
- Outdated minor version (compatible): MEDIUM
- Alternative approach not mentioned: LOW

**Convention Violations**:

- MUST requirement: CRITICAL
- SHOULD requirement: HIGH
- MAY/OPTIONAL requirement: MEDIUM
- Style preference: LOW

### Progressive Writing Pattern

**MANDATORY**: All checker agents MUST write reports progressively throughout execution.

**Why**: Long validation runs may exceed context limits. Progressive writing ensures audit history survives context compaction.

**How**:

1. **Initialize report at execution start**:

```bash
# Create report file immediately
REPORT_FILE="generated-reports/${AGENT_FAMILY}__${UUID_CHAIN}__${TIMESTAMP}__audit.md"

# Write header
cat > "$REPORT_FILE" <<'EOF'
# Agent Name Audit Report

**Audit ID**: uuid__timestamp
**Scope**: scope-description
**Audit Start**: timestamp
**Files Checked**: TBD (will update)

## Executive Summary
(Findings counts will be updated as we progress)

---

## CRITICAL Issues (Must Fix)

**Count**: 0 issues (updating progressively)

---
EOF
```

1. **Append findings as discovered**:

```bash
# Append each finding immediately when found
cat >> "$REPORT_FILE" <<EOF

### ${FINDING_NUM}. ${ISSUE_TITLE}

**File**: \`${FILE_PATH}:${LINE_NUM}\`
**Criticality**: CRITICAL - ${JUSTIFICATION}
**Category**: ${CATEGORY}

**Finding**: ${DESCRIPTION}
**Impact**: ${IMPACT}
**Recommendation**: ${FIX}

**Confidence**: HIGH

---
EOF
```

1. **Update summary at completion**:

```bash
# Update executive summary with final counts
# (Use sed or similar to replace TBD values)
```

**Key Point**: Never buffer all findings in memory and write once at end. Write incrementally.

---

## Implementation Guidelines for Fixer Agents

### Criticality-Aware Decision Logic

**Fixer agents must process findings considering BOTH criticality and confidence**.

**Priority Matrix** (already shown above):

| Criticality | HIGH Confidence      | MEDIUM Confidence     | FALSE_POSITIVE      |
| ----------- | -------------------- | --------------------- | ------------------- |
| CRITICAL    | P0 - Fix immediately | P1 - Urgent review    | Report with context |
| HIGH        | P1 - Fix after P0    | P2 - Standard review  | Report with context |
| MEDIUM      | P2 - Fix after P1    | P3 - Optional review  | Report with context |
| LOW         | P3 - Batch fixes     | P4 - Suggestions only | Report with context |

### Execution Order

```python
def apply_fixes(audit_report):
    """Apply fixes in priority order."""

    # Parse findings by section (CRITICAL → HIGH → MEDIUM → LOW)
    critical_findings = parse_section(audit_report, "CRITICAL")
    high_findings = parse_section(audit_report, "HIGH")
    medium_findings = parse_section(audit_report, "MEDIUM")
    low_findings = parse_section(audit_report, "LOW")

    # Re-validate and assess confidence for each finding
    validated_findings = []
    for finding in (critical_findings + high_findings + medium_findings + low_findings):
        confidence = revalidate_finding(finding)
        priority = determine_priority(finding.criticality, confidence)
        validated_findings.append((finding, confidence, priority))

    # Sort by priority (P0 first)
    validated_findings.sort(key=lambda x: x[2])  # Sort by priority

    # Apply fixes in priority order
    p0_fixes = []
    p1_fixes = []
    p2_fixes = []
    p3_fixes = []

    for finding, confidence, priority in validated_findings:
        if priority == "P0":
            if confidence == "HIGH":
                apply_fix(finding)
                p0_fixes.append(finding)
            else:
                # This shouldn't happen (P0 requires HIGH confidence)
                flag_for_urgent_review(finding)
        elif priority == "P1":
            if confidence == "HIGH":
                apply_fix(finding)
                p1_fixes.append(finding)
            else:  # MEDIUM confidence
                flag_for_urgent_review(finding)
        elif priority == "P2":
            if confidence == "HIGH" and user_approved_batch_mode:
                apply_fix(finding)
                p2_fixes.append(finding)
            else:
                flag_for_standard_review(finding)
        elif priority in ["P3", "P4"]:
            # Include in summary only, no automatic application
            p3_fixes.append(finding)

    # Report summary
    return {
        "p0_fixed": p0_fixes,
        "p1_fixed": p1_fixes,
        "p2_fixed": p2_fixes,
        "flagged_for_review": flagged_items,
        "suggestions_only": p3_fixes
    }
```

### Priority Determination Function

```python
def determine_priority(criticality, confidence):
    """Determine priority based on criticality × confidence matrix."""

    priority_matrix = {
        ("CRITICAL", "HIGH"): "P0",
        ("CRITICAL", "MEDIUM"): "P1",
        ("CRITICAL", "FALSE_POSITIVE"): "REPORT",
        ("HIGH", "HIGH"): "P1",
        ("HIGH", "MEDIUM"): "P2",
        ("HIGH", "FALSE_POSITIVE"): "REPORT",
        ("MEDIUM", "HIGH"): "P2",
        ("MEDIUM", "MEDIUM"): "P3",
        ("MEDIUM", "FALSE_POSITIVE"): "REPORT",
        ("LOW", "HIGH"): "P3",
        ("LOW", "MEDIUM"): "P4",
        ("LOW", "FALSE_POSITIVE"): "REPORT",
    }

    return priority_matrix.get((criticality, confidence), "P4")
```

### Fix Report Format Updates

**Fixer agents should group fixes by priority in their reports**:

````markdown
# Repository Governance Fix Report

**Source Audit**: repo-rules**a1b2c3**2025-12-27--10-30\_\_audit.md
**Fix Date**: 2025-12-27T11:15:00+07:00
**Fixer Version**: repo-rules-fixer v2.0

---

## Execution Summary

- **P0 Fixes Applied**: 5 (CRITICAL + HIGH confidence)
- **P1 Fixes Applied**: 12 (HIGH + HIGH confidence)
- **P1 Flagged for Urgent Review**: 2 (CRITICAL + MEDIUM confidence)
- **P2 Fixes Applied**: 8 (MEDIUM + HIGH confidence, batch mode)
- **P2 Flagged for Standard Review**: 3 (HIGH + MEDIUM confidence)
- **P3-P4 Suggestions**: 15 (LOW priority, no action)
- **False Positives Detected**: 3

---

## P0 Fixes Applied (CRITICAL + HIGH Confidence)

### 1. Missing Required Subcategory Field

**File**: `governance/development/agents/ai-agents.md`
**Original Issue**: CRITICAL - Missing `subcategory: development` field
**Validation**: Confirmed field missing in frontmatter (HIGH confidence)
**Fix Applied**: Added `subcategory: development` at line 5

**Before**:

```yaml
---
name: AI Agents Convention
category: development
---
```
````

**After**:

```yaml
---
name: AI Agents Convention
category: development
subcategory: development
---
```

[... continue for all P0 fixes ...]

---

## P1 Fixes Applied (HIGH + HIGH Confidence)

[Same format as P0]

---

## P1 Flagged for Urgent Review (CRITICAL + MEDIUM Confidence)

### 1. Ambiguous Link Target

**File**: `governance/conventions/formatting/linking.md:89`
**Original Issue**: CRITICAL - Broken link to convention doc
**Validation**: MEDIUM confidence - Multiple possible target files found
**Reason for Flag**: Cannot determine correct link target automatically
**Action Required**: Manually select correct target from:

- `governance/conventions/structure/file-naming.md`
- `governance/development/infra/file-organization.md`

---

## P2 Fixes Applied (MEDIUM + HIGH Confidence)

[Same format as P0]

---

## P2-P3-P4 Suggestions (No Action Taken)

**Total**: 15 findings

1. **File**: `governance/conventions/formatting/diagrams.md`
   **Suggestion**: Consider adding example of complex multi-layer diagram
   **Priority**: P4 (LOW + MEDIUM)

[... list remaining suggestions ...]

---

## False Positives Detected

[Same format as before, with criticality context]

---

## Next Steps

1. **URGENT** - Review 2 P1 flagged items (CRITICAL issues needing manual decision)
2. **Standard** - Review 3 P2 flagged items (HIGH issues needing clarification)
3. **Optional** - Consider 15 suggestions if relevant to current work

````

### Backward Compatibility

**Fixer agents must handle reports without criticality sections**:

```python
def parse_findings(audit_report):
    """Parse findings from audit report, handling old formats."""

    findings = []

    # Try new format first (criticality sections)
    if has_criticality_sections(audit_report):
        findings += parse_section(audit_report, "CRITICAL")
        findings += parse_section(audit_report, "HIGH")
        findings += parse_section(audit_report, "MEDIUM")
        findings += parse_section(audit_report, "LOW")
    else:
        # Fall back to old format (Critical/Important/Minor or other)
        findings += parse_legacy_section(audit_report, "Critical")
        findings += parse_legacy_section(audit_report, "Important")
        findings += parse_legacy_section(audit_report, "Minor")

        # Map legacy severity to new criticality
        for finding in findings:
            if finding.legacy_severity == "Critical":
                finding.criticality = "CRITICAL"
            elif finding.legacy_severity == "Important":
                finding.criticality = "HIGH"
            elif finding.legacy_severity == "Minor":
                finding.criticality = "MEDIUM"

    return findings
````

---

## Principles Implemented/Respected

This convention implements the following principles from [Core Principles Index](../../principles/README.md):

### Explicit Over Implicit

**How**:

- Four clearly defined criticality levels with objective criteria
- Explicit decision matrix showing criticality × confidence combinations
- Standardized report format with clear section structure
- Explicit priority levels (P0-P4) with defined execution order

**Why**:

Removes ambiguity in severity assessment. Everyone interprets CRITICAL, HIGH, MEDIUM, LOW the same way.

### Automation Over Manual

**How**:

- Priority-based execution enables automated fix application
- HIGH confidence + CRITICAL/HIGH criticality → automatic fixing
- Clear criteria enable checker agents to categorize programmatically
- Progressive writing ensures automation survives context limits

**Why**:

Reduces manual decision-making for objective issues. Automation handles P0-P1 fixes reliably.

### Simplicity Over Complexity

**How**:

- Four levels (not five or seven) - sufficient granularity without overwhelm
- Section-based organization (not per-finding metadata) - human-readable
- Single decision tree for assessment - easy to apply
- Orthogonal dimensions (criticality vs confidence) - one concept per dimension

**Why**:

Simple system is easier to understand, apply consistently, and maintain long-term.

### Accessibility First

**How**:

- Emoji indicators (🟠🟡🟢) ALWAYS paired with text labels (CRITICAL/HIGH/MEDIUM/LOW)
- Color is supplementary - text labels provide primary identification
- Clear priority labels (P0-P4) supplement colors
- Text-based severity names work in all contexts (voice, text-only)
- Standardized format improves scannability

**Why**:

Ensures findings are accessible to all users regardless of visual ability or context. Unlike Mermaid diagrams (which must use accessible palette), emoji indicators can use standard emoji colors because they NEVER appear without text labels.

---

## Conventions Implemented/Respected

This convention builds upon and references:

### [Fixer Confidence Levels Convention](./fixer-confidence-levels.md)

**Relationship**: Criticality works orthogonally with confidence levels.

- Criticality (CRITICAL/HIGH/MEDIUM/LOW) measures importance/urgency
- Confidence (HIGH/MEDIUM/FALSE_POSITIVE) measures certainty/fixability
- Combined in decision matrix to determine priority (P0-P4)

### [Maker-Checker-Fixer Pattern Convention](../pattern/maker-checker-fixer.md)

**Relationship**: Criticality enhances Stage 2 (Checker) and Stage 3 (Fixer).

- Stage 2: Checkers categorize findings by criticality
- Stage 3: Fixers use criticality + confidence to determine priority
- Priority-based execution aligns with pattern's quality gates

### [Repository Validation Methodology Convention](./repository-validation.md)

**Relationship**: Validation checks produce findings that need criticality assessment.

- Validation patterns detect issues
- Criticality system categorizes detected issues
- Standardized report format presents categorized findings

### [Temporary Files Convention](../infra/temporary-files.md)

**Relationship**: Checker reports using criticality system are temporary files.

- All checker agents write to `generated-reports/`
- Filename pattern: `{agent-family}__{uuid-chain}__{timestamp}__audit.md`
- Progressive writing requirement ensures reports survive context compaction

### [Content Quality Principles Convention](../../conventions/writing/quality.md)

**Relationship**: Content quality violations are categorized by criticality.

- WCAG A violations: CRITICAL
- WCAG AA violations: HIGH
- Heading hierarchy errors: HIGH
- Style inconsistencies: MEDIUM

### [Color Accessibility Convention](../../conventions/formatting/color-accessibility.md)

**Relationship**: Criticality emoji indicators use standard emoji colors WITH text labels.

**Why emoji indicators can use red/green/yellow (unlike Mermaid diagrams)**:

- CRITICAL - Red emoji ALWAYS paired with "CRITICAL" text label
- HIGH - Orange emoji ALWAYS paired with "HIGH" text label
- MEDIUM - Yellow emoji ALWAYS paired with "MEDIUM" text label
- LOW - Green emoji ALWAYS paired with "LOW" text label

**Key Distinction**: Emoji indicators NEVER rely on color alone - text labels provide primary identification. This differs from Mermaid diagrams, which must use the verified accessible palette (Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161) to ensure color-blind users can distinguish elements visually.

See [Color Accessibility Convention](../../conventions/formatting/color-accessibility.md) for complete details on when standard emoji colors are acceptable (always with text) versus when accessible palette is required (Mermaid diagrams).

### [AI Agents Convention](../agents/ai-agents.md)

**Relationship**: All checker and fixer agents must follow this convention.

- Checker agents: Generate reports with criticality sections
- Fixer agents: Use criticality + confidence for priority execution
- Progressive writing: Required for all checkers per AI Agents Convention

---

## Migration Path

Existing agents using different terminology should migrate to this convention.

### Phase 1: Documentation (Week 1)

1. Create this convention document
2. Update [Fixer Confidence Levels Convention](./fixer-confidence-levels.md) with criticality integration
3. Update [Maker-Checker-Fixer Pattern Convention](../pattern/maker-checker-fixer.md) with criticality flow
4. Update AGENTS.md with brief summary and link

### Phase 2: Pilot Agent (Week 2)

1. Update `repo-rules-checker` to use CRITICAL/HIGH/MEDIUM/LOW sections
2. Test report generation with standardized format
3. Validate that `repo-rules-fixer` correctly interprets new format
4. Identify any issues before broader rollout

### Phase 3: Checker Agent Families (Week 2-3)

**Severity-Based Family**:

- apps-ayokoding-web-general-checker
- apps-ayokoding-web-by-example-checker
- apps-ayokoding-web-in-the-field-checker
- apps-oseplatform-web-content-checker
- repo-workflow-checker

**Dual-Label Family** (preserve existing labels + add criticality):

- docs-checker ([Verified]/[Error]/[Outdated] + CRITICAL/HIGH/MEDIUM/LOW)
- docs-tutorial-checker
- docs-software-engineering-separation-checker
- apps-ayokoding-web-facts-checker
- apps-ayokoding-web-link-checker
- docs-link-checker ([OK]/[BROKEN]/[REDIRECT] + CRITICAL/HIGH/MEDIUM/LOW)
- repo-rules-checker

**Plan/Priority Family**:

- plan-checker
- plan-execution-checker
- readme-checker

### Phase 4: Fixer Agents (Week 3)

Update all fixer agents to use priority-based execution:

- repo-rules-fixer (pilot)
- apps-ayokoding-web-general-fixer
- apps-ayokoding-web-by-example-fixer
- apps-ayokoding-web-facts-fixer
- apps-ayokoding-web-in-the-field-fixer
- apps-ayokoding-web-link-fixer
- docs-tutorial-fixer
- docs-software-engineering-separation-fixer
- apps-oseplatform-web-content-fixer
- readme-fixer
- docs-fixer
- plan-fixer
- repo-workflow-fixer

### Phase 5: Validation (Week 4)

1. Run full repository audit with all checkers
2. Test all fixers on new report formats
3. Verify priority-based execution works correctly
4. Confirm backward compatibility with old reports

---

## Frequently Asked Questions

### Why four levels instead of three?

Three levels (Critical/Important/Minor) don't distinguish between "should fix soon" (HIGH) and "nice to have" (MEDIUM). Four levels provide clearer prioritization without overwhelming users.

### Why keep dual labels for some agents?

Verification status ([Verified]/[Error]) and link status ([OK]/[BROKEN]) serve different purposes than criticality. Example: `[Error] - HIGH` means "verified incorrect AND important to fix." Both dimensions provide valuable information.

### Can criticality and confidence ever contradict?

No - they measure different things. Criticality = importance, confidence = certainty. Example: CRITICAL + MEDIUM confidence means "very important issue but we're uncertain about the exact fix" → urgent manual review.

### What if an agent finds no CRITICAL/HIGH issues?

Report status: PASS or PASS WITH WARNINGS. MEDIUM/LOW issues don't block publication.

### Should all findings be auto-fixed?

No - only HIGH confidence findings. MEDIUM confidence requires manual review (too risky to auto-fix).

### How does this affect existing workflows?

Checkers generate reports with new sections. Fixers process findings in priority order. Users see clearer categorization. Core workflow unchanged.

### What about backward compatibility?

Fixers must handle both old and new report formats. Legacy severity terms (Critical/Important/Minor) map to new criticality levels (CRITICAL/HIGH/MEDIUM).

---

## Summary

This convention establishes **universal criticality levels** (CRITICAL/HIGH/MEDIUM/LOW) for all checker agents, working orthogonally with existing **confidence levels** (HIGH/MEDIUM/FALSE_POSITIVE).

**Key Takeaways**:

1. **Four criticality levels** provide clear prioritization without overwhelming users
2. **Orthogonal with confidence** - criticality measures importance, confidence measures certainty
3. **Standardized reports** with emoji indicators and consistent section structure
4. **Priority-based execution** enables automated fixing for HIGH confidence + CRITICAL/HIGH criticality
5. **Dual labels preserved** for verification/status agents (both dimensions provide value)
6. **Progressive writing mandatory** for all checker agents (survives context compaction)
7. **Backward compatible** - fixers handle both old and new report formats

**For Checker Agents**: Categorize findings using the decision tree, generate standardized reports with criticality sections.

**For Fixer Agents**: Process findings in priority order (P0 → P1 → P2 → P3), auto-fix HIGH confidence, flag MEDIUM confidence for review.

**For Users**: Quickly identify what must be fixed (CRITICAL), what should be fixed (HIGH), and what's optional (MEDIUM/LOW).

---

**Convention Status**: Active

**Version**: 1.0
