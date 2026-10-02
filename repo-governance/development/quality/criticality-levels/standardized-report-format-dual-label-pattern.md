---
description: "The criticality + confidence dual-label pattern."
when_to_use: "Use when labeling a finding with both dimensions."
---

# Dual-Label Pattern

**Five agents require both verification/status AND criticality labels**:

- `docs-checker` - Verification labels ([Verified], [Error], [Outdated], [Unverified])
- `docs-tutorial-checker` - Verification labels
- `content-checker` - Verification labels
- `docs-link-checker` - Status labels ([OK], [BROKEN], [REDIRECT])
- `apps-ayokoding-www-link-checker` - Status labels

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

**File**: `repo-governance/conventions/formatting/linking.md:89`
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
