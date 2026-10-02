---
description: "States the mandatory Write and Bash tool requirement for any agent that writes to its per-family local-tmp/ directory, and lists which checker agents it applies to."
when_to_use: Use when creating or auditing a checker agent's frontmatter tools list.
---

# Tool Access Patterns — Report-Generating Agents: Mandatory Tool Requirements

**CRITICAL RULE**: Any agent that writes to its `local-tmp/<agent-family>/` directory MUST have **both Write and Bash** tools in their frontmatter.

**Tool Requirements Explained**:

- **Write tool**: Required for creating report files in `local-tmp/<agent-family>/`
- **Bash tool**: Required for generating UTC+7 timestamps for report filenames using `TZ='Asia/Jakarta' date +"%Y-%m-%d--%H-%M"`

**Why both are mandatory**:

1. **Write** - Creates the actual report file
2. **Bash** - Generates accurate, real-time timestamps (placeholder timestamps like "00-00" are forbidden)

**Applies to these agent types**:

- All `*-checker` agents (rules-checker, docs-checker, plan-checker, plan-execution-checker, etc.)
- `repo-workflow-fixer` (generates fix reports)
- Any agent creating validation, audit, or verification reports

**MANDATORY REQUIREMENT FOR ALL \*-CHECKER AGENTS**:

ALL checker agents MUST write their validation/audit reports to their own `local-tmp/<agent-family>/` directory, creating it with `mkdir -p` before the first write. This is a hard requirement with NO EXCEPTIONS. The following checker agents are subject to this rule:

1. rules-checker
2. repo-workflow-checker
3. content-checker
4. tutorial-by-example-checker
5. tutorial-in-the-field-checker
6. content-checker
7. apps-ayokoding-www-link-checker
8. content-checker
9. docs-checker
10. docs-tutorial-checker
11. docs-link-checker
12. docs-software-engineering-separation-checker
13. pdf-to-md-checker
14. readme-checker
15. plan-checker
16. plan-execution-checker
17. specs-checker
18. swe-code-checker
19. ci-checker
20. swe-ui-checker
21. harness-checker

> **Harness compatibility (Phase 0 + Phase 1)**: `harness-checker`
> (green) and `harness-fixer` (yellow) validate both internal
> cross-vendor parity invariants (Phase 0: governance prose vendor-neutrality;
> AGENTS.md / CLAUDE.md vendor-neutrality; binding sync no-op; agent inventory parity;
> color-translation map and capability-tier map coverage) and external harness drift
> (Phase 1: per-harness web-research-backed comparison against upstream docs). They
> are orchestrated by the
> [`harness-quality-gate` workflow](../../../workflows/quality/harness-quality-gate.md).
> The fixer auto-remediates only Phase 0 sync drift and unambiguous catalog updates;
> all other invariant violations and ambiguous findings are surfaced for human
> resolution.

**NO conversation-only output**: Checker agents MUST NOT output validation results in conversation only. All validation findings MUST be written to audit report files following the 4-part pattern `{agent-family}__{uuid-chain}__{YYYY-MM-DD--HH-MM}__audit.md`. The UUID chain enables parallel execution without file collisions.
