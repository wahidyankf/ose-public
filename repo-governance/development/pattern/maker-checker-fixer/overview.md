---
description: "What the pattern is and why it exists."
when_to_use: "Use when orienting to the pattern."
---

# Overview

## What is the Maker-Checker-Fixer Pattern?

The maker-checker-fixer pattern is a **quality control workflow** consisting of three specialized agent roles:

1. **Maker** - Creates or updates content comprehensively
2. **Checker** - Validates content against conventions and standards
3. **Fixer** - Applies validated fixes from checker audit reports

Each role is implemented as a separate agent with specific responsibilities and tool permissions, enabling a robust separation of concerns for content quality management.

## Why This Pattern Exists

**Without this pattern:**

- FAIL: Quality issues discovered after content creation
- FAIL: Manual validation is time-consuming and error-prone
- FAIL: No systematic remediation process
- FAIL: Inconsistent content quality across the repository

**With this pattern:**

- PASS: Systematic validation of all content
- PASS: Automated detection of convention violations
- PASS: Safe, validated fix application
- PASS: Iterative quality improvement
- PASS: Audit trail for all changes

## Scope

This pattern is used across multiple agent families. See [AI Agents Index](../../../../.agents/agents/README.md) for the complete list of agent families using this pattern. Key families include:

1. **repo-rules-\*** - Repository-wide consistency
2. **apps-ayokoding-www-\*** - Next.js 16 content for ayokoding-www
3. **docs-tutorial-\*** - Tutorial quality validation
4. **apps-ose-www-content-\*** - Next.js 16 content for ose-www
5. **readme-\*** - README quality standards
6. **docs-\*** - Documentation factual accuracy
7. **plan-\*** - Plan completeness and structure
8. **docs-software-engineering-separation-\*** - SE documentation separation
9. **repo-workflow-\*** - Workflow documentation completeness
